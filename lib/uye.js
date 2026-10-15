// Shared helpers for the membership endpoints in functions/api/uye.
export const OTURUM_CEREZI = "zs";
const OTURUM_GUN = 30;
export const TAKIP_SINIRI = 100;

export const json = (data, status = 200, ek = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...ek },
  });

export const cerez = (request, ad) =>
  (request.headers.get("Cookie") || "").match(new RegExp(`(?:^|;\\s*)${ad}=([^;]+)`))?.[1] || null;

async function sha256(metin) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(metin));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

const rastgele = () => {
  const b = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...b)).replace(/[+/=]/g, (c) => ({ "+": "-", "/": "_", "=": "" })[c]);
};

export function hazir(env) {
  return Boolean(env.DB);
}

// State-changing requests must come from our own pages (the session cookie is SameSite=Lax too).
export function ayniKaynak(request) {
  const o = request.headers.get("Origin");
  return !o || o === new URL(request.url).origin;
}

export async function oturumAc(env, uyeId) {
  const token = rastgele();
  const bitis = Date.now() + OTURUM_GUN * 864e5;
  await env.DB.prepare("INSERT INTO oturumlar (hash, uye_id, bitis) VALUES (?, ?, ?)").bind(await sha256(token), uyeId, bitis).run();
  return `${OTURUM_CEREZI}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${OTURUM_GUN * 86400}`;
}

export const oturumSil = () => `${OTURUM_CEREZI}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;

export async function oturumKapat(request, env) {
  const token = cerez(request, OTURUM_CEREZI);
  if (token) await env.DB.prepare("DELETE FROM oturumlar WHERE hash = ?").bind(await sha256(token)).run();
}

// The signed-in member, or null.
export async function uyeBul(request, env) {
  const token = cerez(request, OTURUM_CEREZI);
  if (!token || !env.DB) return null;
  return env.DB.prepare(
    "SELECT u.id, u.eposta, u.ad, u.eposta_izni FROM oturumlar o JOIN uyeler u ON u.id = o.uye_id WHERE o.hash = ? AND o.bitis > ?"
  ).bind(await sha256(token), Date.now()).first();
}

export async function takipler(env, uyeId) {
  const { results } = await env.DB.prepare("SELECT anahtar FROM takipler WHERE uye_id = ? ORDER BY olusturma").bind(uyeId).all();
  return results.map((r) => r.anahtar);
}

// Follow keys are brand or group names from the discount calendar.
export const gecerliAnahtar = (a) => typeof a === "string" && a.trim().length > 0 && a.length <= 60;
