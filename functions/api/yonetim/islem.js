// Moderators' actions: delete a comment, mark or delete a contact message.
import { json, uyeBul, yonetici, ayniKaynak } from "../../../lib/uye.js";

export async function onRequestPost({ request, env }) {
  if (!ayniKaynak(request)) return json({ hata: "Geçersiz istek." }, 403);
  const uye = await uyeBul(request, env);
  if (!yonetici(env, uye)) return json({ hata: "Yetkiniz yok." }, 403);
  const g = await request.json().catch(() => ({}));
  const id = Number(g.id);
  if (!Number.isInteger(id)) return json({ hata: "Geçersiz istek." }, 400);
  const SQL = {
    yorumSil: "DELETE FROM yorumlar WHERE id = ?",
    mesajYanitlandi: "UPDATE iletisim SET yanitlandi = 1 WHERE id = ?",
    mesajSil: "DELETE FROM iletisim WHERE id = ?",
  }[g.islem];
  if (!SQL) return json({ hata: "Geçersiz işlem." }, 400);
  await env.DB.prepare(SQL).bind(id).run();
  return json({ tamam: true });
}
