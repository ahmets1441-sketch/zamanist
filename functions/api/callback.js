// Decap CMS GitHub login, step 2: trade GitHub's code for a token and hand it to the CMS window.
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookie = request.headers.get("Cookie") || "";
  const saved = cookie.match(/(?:^|;\s*)decap_state=([^;]+)/)?.[1];

  if (!code || !state || state !== saved) {
    return page("error", { message: "Geçersiz giriş isteği. Lütfen tekrar deneyin." });
  }

  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": "zamanist-cms" },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  const data = await res.json();
  if (!data.access_token) {
    return page("error", { message: data.error_description || "GitHub girişi başarısız." });
  }
  return page("success", { token: data.access_token, provider: "github" });
}

// Decap's popup handshake: announce, wait for the CMS window to answer, then send the result to that origin only.
function page(status, content) {
  const message = `authorization:github:${status}:${JSON.stringify(content)}`;
  const html = `<!doctype html><html><body><script>
    const message = ${JSON.stringify(message)};
    const allowed = ["https://zamanist.com", "https://www.zamanist.com"];
    window.addEventListener("message", (e) => {
      if (!allowed.includes(e.origin)) return;
      window.opener.postMessage(message, e.origin);
    });
    window.opener.postMessage("authorizing:github", "*");
  </script></body></html>`;
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Set-Cookie": "decap_state=; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
    },
  });
}
