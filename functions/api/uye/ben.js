// The signed-in member and the brands they follow; { uye: null } when signed out.
import { json, uyeBul, takipler, hazir } from "../../../lib/uye.js";

export async function onRequestGet({ request, env }) {
  if (!hazir(env)) return json({ uye: null, kapali: true });
  const uye = await uyeBul(request, env);
  if (!uye) return json({ uye: null, google: Boolean(env.GOOGLE_CLIENT_ID) });
  return json({
    uye: { eposta: uye.eposta, ad: uye.ad, epostaIzni: Boolean(uye.eposta_izni) },
    takip: await takipler(env, uye.id),
  });
}
