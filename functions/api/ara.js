// Product search across the marketplaces configured for a country in src/_data/ulkeler.json.
// Each source in lib/kaynaklar returns offers in the same shape.
import ulkeler from "../../src/_data/ulkeler.json";
import * as rakuten from "../../lib/kaynaklar/rakuten.js";

const KAYNAKLAR = { rakuten };
const URUN_TURLERI = ["saat", "ayakkabi"];

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=1800" },
  });

export async function onRequestGet({ request, env }) {
  const u = new URL(request.url);
  const q = (u.searchParams.get("q") || "").trim().slice(0, 100);
  const ulke = ulkeler.find((x) => x.kod === (u.searchParams.get("ulke") || "japonya"));
  const urunTuru = URUN_TURLERI.includes(u.searchParams.get("tur")) ? u.searchParams.get("tur") : "saat";
  if (q.length < 2) return json({ hata: "En az 2 harf yazın." }, 400);
  if (!ulke) return json({ hata: "Bu ülke henüz desteklenmiyor." }, 400);
  const kaynaklar = (ulke.kaynaklar || []).map((k) => KAYNAKLAR[k]).filter((k) => k && k.hazir(env));
  if (!kaynaklar.length) return json({ hata: "Bu ülke için arama servisi henüz ayarlanmadı." }, 503);

  const cache = caches.default;
  const anahtar = new Request(`${u.origin}/api/ara?v=5&ulke=${ulke.kod}&tur=${urunTuru}&q=${encodeURIComponent(q.toLowerCase())}`);
  const onbellek = await cache.match(anahtar);
  if (onbellek) return onbellek;

  const sonuclar = await Promise.allSettled(kaynaklar.map((k) => k.ara({ q, urunTuru, env, origin: u.origin })));
  const basarili = sonuclar.filter((s) => s.status === "fulfilled");
  if (!basarili.length) {
    return json({ hata: "Arama şu an yapılamadı. Biraz sonra tekrar deneyin.", detay: String(sonuclar[0].reason?.message) }, 502);
  }
  const cevap = json({
    kaynak: kaynaklar.map((k) => k.ad).join(", "),
    sonuclar: basarili.flatMap((s) => s.value),
    eksikKaynaklar: sonuclar.filter((s) => s.status === "rejected").length,
  });
  await cache.put(anahtar, cevap.clone());
  return cevap;
}
