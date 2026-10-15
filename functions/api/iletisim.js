// Contact form. Messages are stored for the moderators' page; the visitor's IP is kept only as a salted hash for rate limiting.
import { json, ayniKaynak, gecerliEposta, sha256 } from "../../lib/uye.js";

const KONULAR = ["Öneri veya soru", "Bilgi düzeltmesi", "Fotoğraf kaldırma talebi", "Marka / basın duyurusu", "Diğer"];

async function isle({ request, env }) {
  if (!env.DB) return json({ hata: "Form şu an kapalı." }, 503);
  if (!ayniKaynak(request)) return json({ hata: "Geçersiz istek." }, 403);
  const g = await request.json().catch(() => ({}));
  if (g.tuzak) return json({ mesaj: "Mesajınız alındı." }); // bot filled the hidden field
  const ad = String(g.ad || "").trim(), eposta = String(g.eposta || "").trim(), mesaj = String(g.mesaj || "").trim();
  if (!ad || ad.length > 80) return json({ hata: "Adınızı yazın." }, 400);
  if (!gecerliEposta(eposta)) return json({ hata: "Geçerli bir e-posta adresi yazın." }, 400);
  if (mesaj.length < 5 || mesaj.length > 4000) return json({ hata: "Mesajınız 5 ile 4000 karakter arasında olmalı." }, 400);
  const konu = KONULAR.includes(g.konu) ? g.konu : "Diğer";
  const ip = await sha256((request.headers.get("CF-Connecting-IP") || "") + (env.IP_TUZU || "zamanist"));
  const simdi = Math.floor(Date.now() / 1000);
  const son = await env.DB.prepare("SELECT COUNT(*) AS n FROM iletisim WHERE ip_ozet = ? AND tarih > ?").bind(ip, simdi - 3600).first();
  if (son.n >= 5) return json({ hata: "Çok fazla mesaj gönderildi. Biraz sonra tekrar deneyin." }, 429);
  await env.DB.prepare("INSERT INTO iletisim (ad, eposta, konu, mesaj, ip_ozet, tarih) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(ad, eposta, konu, mesaj, ip, simdi).run();
  return json({ mesaj: "Mesajınız alındı. En kısa sürede e-postayla döneceğiz." });
}

// Before db/ek-2026-10-15.sql is applied the table does not exist; answer politely instead of a 500.
export async function onRequestPost(ctx) {
  try { return await isle(ctx); } catch (h) { return json({ hata: "Form şu an kapalı. Biraz sonra tekrar deneyin." }, 503); }
}
