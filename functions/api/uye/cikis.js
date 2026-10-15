// Sign out: drop this browser's session.
import { json, ayniKaynak, oturumKapat, oturumSil } from "../../../lib/uye.js";

export async function onRequestPost({ request, env }) {
  if (!ayniKaynak(request)) return json({ hata: "Geçersiz istek." }, 403);
  if (env.DB) await oturumKapat(request, env);
  return json({ tamam: true }, 200, { "Set-Cookie": oturumSil() });
}
