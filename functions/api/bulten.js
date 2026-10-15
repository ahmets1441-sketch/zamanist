// Newsletter sign-up. Stores the address with the consent date; a confirmation e-mail
// (double opt-in) will be sent once e-mail sending is set up, and only confirmed addresses get mail.
import { json, ayniKaynak, gecerliEposta } from "../../lib/uye.js";

async function isle({ request, env }) {
  if (!env.DB) return json({ hata: "Bülten şu an kapalı." }, 503);
  if (!ayniKaynak(request)) return json({ hata: "Geçersiz istek." }, 403);
  const g = await request.json().catch(() => ({}));
  const eposta = String(g.eposta || "").trim().toLowerCase();
  if (!gecerliEposta(eposta)) return json({ hata: "Geçerli bir e-posta adresi yazın." }, 400);
  if (g.izin !== true) return json({ hata: "Abone olmak için izin kutusunu işaretleyin." }, 400);
  const anahtar = crypto.randomUUID();
  await env.DB.prepare("INSERT INTO bulten (eposta, izin_tarihi, anahtar) VALUES (?, ?, ?) ON CONFLICT(eposta) DO NOTHING")
    .bind(eposta, new Date().toISOString(), anahtar).run();
  // Same answer whether or not the address was already listed, so the form cannot be used to check addresses.
  return json({ mesaj: "Teşekkürler! Bülten başladığında önce onay e-postası göndereceğiz." });
}

// Before db/ek-2026-10-15.sql is applied the table does not exist; answer politely instead of a 500.
export async function onRequestPost(ctx) {
  try { return await isle(ctx); } catch (h) { return json({ hata: "Bülten şu an kapalı." }, 503); }
}
