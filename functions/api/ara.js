// Product search in a foreign marketplace. Only Japan (Rakuten Ichiba) for now.
// Keys live in Pages env vars RAKUTEN_APP_ID and RAKUTEN_ACCESS_KEY.
const RAKUTEN = "https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=1800" },
  });

async function rakutenAra(q, env, origin) {
  const url = new URL(RAKUTEN);
  url.searchParams.set("applicationId", env.RAKUTEN_APP_ID);
  url.searchParams.set("accessKey", env.RAKUTEN_ACCESS_KEY);
  url.searchParams.set("keyword", q);
  url.searchParams.set("hits", "30");
  url.searchParams.set("availability", "1");
  url.searchParams.set("formatVersion", "2");
  const r = await fetch(url, { headers: { Referer: origin + "/", Origin: origin } });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error_description || d.error || `Rakuten ${r.status}`);
  return (d.Items || []).map((i) => ({
    ad: i.itemName,
    fiyat: i.itemPrice,
    vergiDahil: i.taxFlag === 0,
    kargoDahil: i.postageFlag === 0,
    magaza: i.shopName,
    magazaLink: i.shopUrl,
    puan: i.reviewAverage || null,
    yorumSayisi: i.reviewCount || 0,
    link: i.itemUrl,
    resim: (i.mediumImageUrls || [])[0] || null,
    ikinciEl: /中古|USED|ユーズド|良品|美品|質屋/i.test(i.itemName),
    aksesuar: /適合|互換|交換用|替えベルト|替えバンド|ベルトのみ|バンドのみ/.test(i.itemName),
  }));
}

export async function onRequestGet({ request, env }) {
  const u = new URL(request.url);
  const q = (u.searchParams.get("q") || "").trim().slice(0, 100);
  const ulke = u.searchParams.get("ulke") || "japonya";
  if (q.length < 2) return json({ hata: "En az 2 harf yazın." }, 400);
  if (ulke !== "japonya") return json({ hata: "Bu ülke henüz desteklenmiyor." }, 400);
  if (!env.RAKUTEN_APP_ID || !env.RAKUTEN_ACCESS_KEY) return json({ hata: "Arama servisi henüz ayarlanmadı." }, 503);

  const cache = caches.default;
  const anahtar = new Request(`${u.origin}/api/ara?ulke=${ulke}&q=${encodeURIComponent(q.toLowerCase())}`);
  const onbellek = await cache.match(anahtar);
  if (onbellek) return onbellek;

  try {
    const sonuc = json({ kaynak: "Rakuten Ichiba", sonuclar: await rakutenAra(q, env, u.origin) });
    await cache.put(anahtar, sonuc.clone());
    return sonuc;
  } catch (e) {
    return json({ hata: "Arama şu an yapılamadı. Biraz sonra tekrar deneyin.", detay: String(e.message) }, 502);
  }
}
