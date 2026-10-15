// Member sign-in with Google, step 2: trade the code for the verified e-mail, create the member, open a session.
import { cerez, oturumAc } from "../../../lib/uye.js";

const geri = (request, hata, ek = []) => {
  const hedef = new URL("/uyelik/", request.url);
  if (hata) hedef.searchParams.set("hata", hata);
  const h = new Headers({ Location: hedef.toString() });
  h.append("Set-Cookie", "uye_state=; Path=/api/uye; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
  ek.forEach((c) => h.append("Set-Cookie", c));
  return new Response(null, { status: 302, headers: h });
};

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state || state !== cerez(request, "uye_state")) return geri(request, "istek");

  const t = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: new URL("/api/uye/google-donus", request.url).toString(),
      grant_type: "authorization_code",
    }),
  });
  const token = await t.json();
  if (!token.access_token) return geri(request, "google");
  const k = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  }).then((r) => r.json());
  if (!k.sub || !k.email || !k.email_verified) return geri(request, "eposta");

  const eposta = k.email.toLowerCase();
  // A member found by e-mail gets linked to this Google account.
  const var_ = await env.DB.prepare("SELECT id FROM uyeler WHERE google_id = ? OR eposta = ?").bind(k.sub, eposta).first();
  const id = var_?.id || crypto.randomUUID();
  if (var_) {
    await env.DB.prepare("UPDATE uyeler SET google_id = ?, eposta = ?, ad = COALESCE(ad, ?) WHERE id = ?").bind(k.sub, eposta, k.name || null, id).run();
  } else {
    await env.DB.prepare("INSERT INTO uyeler (id, google_id, eposta, ad, olusturma) VALUES (?, ?, ?, ?, ?)")
      .bind(id, k.sub, eposta, k.name || null, new Date().toISOString()).run();
  }
  return geri(request, null, [await oturumAc(env, id)]);
}
