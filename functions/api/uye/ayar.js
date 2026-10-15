// E-mail notification consent. Commercial e-mail needs explicit, recorded opt-in.
import { json, uyeBul, ayniKaynak } from "../../../lib/uye.js";

export async function onRequestPost({ request, env }) {
  if (!ayniKaynak(request)) return json({ hata: "Geçersiz istek." }, 403);
  const uye = await uyeBul(request, env);
  if (!uye) return json({ hata: "Giriş yapın." }, 401);
  const g = await request.json().catch(() => ({}));
  if (typeof g.epostaIzni !== "boolean") return json({ hata: "Geçersiz istek." }, 400);
  await env.DB.prepare("UPDATE uyeler SET eposta_izni = ?, izin_tarihi = ? WHERE id = ?")
    .bind(g.epostaIzni ? 1 : 0, new Date().toISOString(), uye.id).run();
  return json({ epostaIzni: g.epostaIzni });
}
