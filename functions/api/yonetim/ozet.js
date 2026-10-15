// Moderators' view: latest comments and contact messages, newsletter count.
import { json, uyeBul, yonetici, gorunenAd } from "../../../lib/uye.js";

export async function onRequestGet({ request, env }) {
  const uye = await uyeBul(request, env);
  if (!yonetici(env, uye)) return json({ hata: "Yetkiniz yok." }, 403);
  let y, i, b;
  try {
  [y, i, b] = await Promise.all([
    env.DB.prepare("SELECT y.id, y.sayfa, y.metin, y.tarih, u.ad, u.eposta FROM yorumlar y JOIN uyeler u ON u.id = y.uye_id ORDER BY y.tarih DESC LIMIT 100").all(),
    env.DB.prepare("SELECT id, ad, eposta, konu, mesaj, tarih, yanitlandi FROM iletisim ORDER BY tarih DESC LIMIT 100").all(),
    env.DB.prepare("SELECT COUNT(*) AS n, SUM(onay) AS onayli FROM bulten").first(),
  ]);
  } catch (h) {
    return json({ hata: "Veritabanı tabloları henüz kurulmadı (db/ek-2026-10-15.sql)." }, 503);
  }
  return json({
    yorumlar: y.results.map((r) => ({ ...r, ad: gorunenAd(r.ad, r.eposta) })),
    iletisim: i.results,
    bulten: { toplam: b.n, onayli: b.onayli || 0 },
  });
}
