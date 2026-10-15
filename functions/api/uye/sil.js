// Delete the member with all sessions and follows (KVKK right to erasure).
import { json, uyeBul, ayniKaynak, oturumSil } from "../../../lib/uye.js";

export async function onRequestPost({ request, env }) {
  if (!ayniKaynak(request)) return json({ hata: "Geçersiz istek." }, 403);
  const uye = await uyeBul(request, env);
  if (!uye) return json({ hata: "Giriş yapın." }, 401);
  await env.DB.batch([
    env.DB.prepare("DELETE FROM takipler WHERE uye_id = ?").bind(uye.id),
    env.DB.prepare("DELETE FROM oturumlar WHERE uye_id = ?").bind(uye.id),
    env.DB.prepare("DELETE FROM uyeler WHERE id = ?").bind(uye.id),
  ]);
  return json({ tamam: true }, 200, { "Set-Cookie": oturumSil() });
}
