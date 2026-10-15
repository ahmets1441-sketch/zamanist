// Member sign-in with Google, step 1: send the browser to Google's consent page.
export async function onRequestGet({ request, env }) {
  if (!env.GOOGLE_CLIENT_ID || !env.DB) return new Response("Üyelik henüz açılmadı.", { status: 503 });
  const state = crypto.randomUUID();
  const google = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  google.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
  google.searchParams.set("redirect_uri", new URL("/api/uye/google-donus", request.url).toString());
  google.searchParams.set("response_type", "code");
  google.searchParams.set("scope", "openid email profile");
  google.searchParams.set("state", state);
  google.searchParams.set("prompt", "select_account");
  return new Response(null, {
    status: 302,
    headers: {
      Location: google.toString(),
      "Set-Cookie": `uye_state=${state}; Path=/api/uye; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
    },
  });
}
