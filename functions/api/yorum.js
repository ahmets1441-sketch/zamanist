// Comments under articles. Members only; shown at once, removed by moderators (functions/api/yonetim).
import { json, uyeBul, ayniKaynak, gorunenAd } from "../../lib/uye.js";

const SAYFA = /^\/[a-z0-9-]+\/[a-z0-9-]+\/$/;
const SAAT_SINIRI = 10;

export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ kapali: true });
  const sayfa = new URL(request.url).searchParams.get("sayfa") || "";
  if (!SAYFA.test(sayfa)) return json({ hata: "Geçersiz sayfa." }, 400);
  try {
    const { results } = await env.DB.prepare(
      "SELECT y.id, y.metin, y.tarih, u.ad, u.eposta FROM yorumlar y JOIN uyeler u ON u.id = y.uye_id WHERE y.sayfa = ? ORDER BY y.tarih LIMIT 200"
    ).bind(sayfa).all();
    return json({ yorumlar: results.map((r) => ({ id: r.id, metin: r.metin, tarih: r.tarih, ad: gorunenAd(r.ad, r.eposta) })) });
  } catch (h) {
    return json({ kapali: true }); // table not created yet
  }
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ hata: "Yorumlar şu an kapalı." }, 503);
  if (!ayniKaynak(request)) return json({ hata: "Geçersiz istek." }, 403);
  const uye = await uyeBul(request, env);
  if (!uye) return json({ hata: "Yorum yazmak için giriş yapın." }, 401);
  const g = await request.json().catch(() => ({}));
  const metin = String(g.metin || "").trim();
  if (!SAYFA.test(g.sayfa || "")) return json({ hata: "Geçersiz sayfa." }, 400);
  if (metin.length < 2 || metin.length > 1500) return json({ hata: "Yorum 2 ile 1500 karakter arasında olmalı." }, 400);
  const simdi = Math.floor(Date.now() / 1000);
  const son = await env.DB.prepare("SELECT COUNT(*) AS n FROM yorumlar WHERE uye_id = ? AND tarih > ?").bind(uye.id, simdi - 3600).first();
  if (son.n >= SAAT_SINIRI) return json({ hata: "Çok sık yorum yazdınız. Biraz sonra tekrar deneyin." }, 429);
  await env.DB.prepare("INSERT INTO yorumlar (sayfa, uye_id, metin, tarih) VALUES (?, ?, ?, ?)").bind(g.sayfa, uye.id, metin, simdi).run();
  return json({ mesaj: "Yorumunuz yayınlandı. Sayfayı yenileyince görünür." });
}
