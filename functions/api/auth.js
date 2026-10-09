// Decap CMS GitHub login, step 1: send the browser to GitHub's consent page.
export async function onRequestGet({ request, env }) {
  const state = crypto.randomUUID();
  const callback = new URL("/api/callback", request.url).toString();
  const github = new URL("https://github.com/login/oauth/authorize");
  github.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  github.searchParams.set("redirect_uri", callback);
  github.searchParams.set("scope", "public_repo,user");
  github.searchParams.set("state", state);
  return new Response(null, {
    status: 302,
    headers: {
      Location: github.toString(),
      "Set-Cookie": `decap_state=${state}; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
    },
  });
}
