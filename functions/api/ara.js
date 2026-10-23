// Product search across the marketplaces configured for a country in src/_data/ulkeler.json.
// Each source in lib/kaynaklar returns offers in the same shape.
import ulkeler from "../../src/_data/ulkeler.json";
import * as rakuten from "../../lib/kaynaklar/rakuten.js";
import * as ebay from "../../lib/kaynaklar/ebay.js";
import { sorguAdaylari } from "../../lib/sorgu.js";

const KAYNAKLAR = { rakuten, ebay };

const sorguBilgisi = (q, ulke) => {
  const { eklenenMarka, cikarilan, magazaKodu } = sorguAdaylari(q, ulke.dil);
  return { arananSorgu: null, eklenenMarka, cikarilanKelime: cikarilan, magazaKodu, eksikKaynaklar: 0 };
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=1800" },
  });

export async function onRequestGet({ request, env }) {
  const u = new URL(request.url);
  const q = (u.searchParams.get("q") || "").trim().slice(0, 100);
  const ulke = ulkeler.find((x) => x.kod === (u.searchParams.get("ulke") || "japonya"));
  if (q.length < 2) return json({ hata: "En az 2 harf yazın." }, 400);
  if (!ulke) return json({ hata: "Bu ülke henüz desteklenmiyor." }, 400);
  const kaynaklar = (ulke.kaynaklar || []).map((k) => KAYNAKLAR[k]).filter((k) => k && k.hazir(env));

  const cache = caches.default;
  const anahtar = new Request(`${u.origin}/api/ara?v=11&ulke=${ulke.kod}&q=${encodeURIComponent(q.toLowerCase())}`);
  const onbellek = await cache.match(anahtar);
  if (onbellek) return onbellek;

  // No listing source yet (e.g. eBay keys pending): the page still shows the brand's official price.
  // A name typed without a model code still needs one to find that price, so the Rakuten listings
  // (model codes are the same worldwide) are returned without prices, only to pick the code from.
  if (!kaynaklar.length) {
    let kodIlanlari = [];
    if (rakuten.hazir(env)) {
      const { adaylar } = sorguAdaylari(q, "ja");
      try {
        const { teklifler } = await rakuten.ara({ adaylar, env, origin: u.origin });
        kodIlanlari = teklifler.map(({ ad, resim, tur, aksesuar }) => ({ ad, resim, tur, aksesuar }));
      } catch (e) {}
    }
    const cevap = json({ kaynak: null, sonuclar: [], kaynakYok: true, kodIlanlari, ...sorguBilgisi(q, ulke) });
    await cache.put(anahtar, cevap.clone());
    return cevap;
  }

  const { adaylar, eklenenMarka, cikarilan, magazaKodu } = sorguAdaylari(q, ulke.dil);
  if (!adaylar.length) return json({ hata: "Aranacak bir kelime kalmadı. Marka ve model adını yazın." }, 400);
  const sonuclar = await Promise.allSettled(kaynaklar.map((k) => k.ara({ adaylar, env, origin: u.origin, ulke })));
  const basarili = sonuclar.filter((s) => s.status === "fulfilled");
  if (!basarili.length) {
    return json({ hata: "Arama şu an yapılamadı. Biraz sonra tekrar deneyin.", detay: String(sonuclar[0].reason?.message) }, 502);
  }
  const cevap = json({
    kaynak: kaynaklar.map((k) => k.ad).join(", "),
    sonuclar: basarili.flatMap((s) => s.value.teklifler),
    // What was actually searched, so the page can say so.
    arananSorgu: basarili.map((s) => s.value.sorgu).find(Boolean) || null,
    eklenenMarka,
    cikarilanKelime: cikarilan,
    magazaKodu,
    eksikKaynaklar: sonuclar.filter((s) => s.status === "rejected").length,
  });
  await cache.put(anahtar, cevap.clone());
  return cevap;
}
