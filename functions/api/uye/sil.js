// Delete the member with all comments, sessions and follows (KVKK right to erasure).
import { json, uyeBul, ayniKaynak, oturumSil } from "../../../lib/uye.js";

export async function onRequestPost({ request, env }) {
  if (!ayniKaynak(request)) return json({ hata: "Geçersiz istek." }, 403);
  const uye = await uyeBul(request, env);
  if (!uye) return json({ hata: "Giriş yapın." }, 401);
  // The comments table may not exist yet on a database set up before comments were added.
  await env.DB.prepare("DELETE FROM yorumlar WHERE uye_id = ?").bind(uye.id).run().catch(() => {});
  await env.DB.batch([
    env.DB.prepare("DELETE FROM takipler WHERE uye_id = ?").bind(uye.id),
    env.DB.prepare("DELETE FROM oturumlar WHERE uye_id = ?").bind(uye.id),
    env.DB.prepare("DELETE FROM uyeler WHERE id = ?").bind(uye.id),
  ]);
  return json({ tamam: true }, 200, { "Set-Cookie": oturumSil() });
}
