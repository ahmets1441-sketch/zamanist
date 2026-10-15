// Follow or unfollow a brand/group: { anahtar, takip: true|false }, or merge a list kept in the
// browser before signing in: { ekle: [...] }.
import { json, uyeBul, takipler, ayniKaynak, gecerliAnahtar, TAKIP_SINIRI } from "../../../lib/uye.js";

export async function onRequestPost({ request, env }) {
  if (!ayniKaynak(request)) return json({ hata: "Geçersiz istek." }, 403);
  const uye = await uyeBul(request, env);
  if (!uye) return json({ hata: "Giriş yapın." }, 401);
  const g = await request.json().catch(() => ({}));
  const simdiki = await takipler(env, uye.id);
  const eklenecek = (Array.isArray(g.ekle) ? g.ekle : g.takip === true ? [g.anahtar] : [])
    .filter(gecerliAnahtar).map((a) => a.trim()).filter((a) => !simdiki.includes(a));
  if (simdiki.length + eklenecek.length > TAKIP_SINIRI) return json({ hata: `En fazla ${TAKIP_SINIRI} marka takip edilebilir.` }, 400);
  const tarih = new Date().toISOString();
  const islemler = eklenecek.map((a) => env.DB.prepare("INSERT OR IGNORE INTO takipler (uye_id, anahtar, olusturma) VALUES (?, ?, ?)").bind(uye.id, a, tarih));
  if (g.takip === false && gecerliAnahtar(g.anahtar)) {
    islemler.push(env.DB.prepare("DELETE FROM takipler WHERE uye_id = ? AND anahtar = ?").bind(uye.id, g.anahtar.trim()));
  }
  if (islemler.length) await env.DB.batch(islemler);
  return json({ takip: await takipler(env, uye.id) });
}
