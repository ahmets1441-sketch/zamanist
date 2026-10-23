// eBay Browse API item search. Needs env EBAY_CLIENT_ID and EBAY_CLIENT_SECRET (production keyset).
// One adapter serves every eBay marketplace. The country entry in ulkeler.json carries
// "ebay": { "pazar": "EBAY_DE", "konum": "DE", "dil": "de-DE", "site": "www.ebay.de" }.
const TOKEN_URL = "https://api.ebay.com/identity/v1/oauth2/token";
const ARAMA_URL = "https://api.ebay.com/buy/browse/v1/item_summary/search";

const AKSESUAR = /\b(strap|band|armband|bracelet only|ersatz|replacement|laces|schnürsenkel|lacets|lacci|insoles?|einlegesohle|semelles?|shoe ?tree|cleaner|box only|nur karton|leerkarton|empty box)\b/i;
// Generic resale words; eBay also reports condition separately.
const IKINCI_EL = /\b(used|gebraucht|getragen|occasion|usato|usado|pre-?owned)\b/i;

export const ad = "eBay";

export function hazir(env) {
  return Boolean(env.EBAY_CLIENT_ID && env.EBAY_CLIENT_SECRET);
}

// Application tokens last two hours; keep one per isolate.
let token = null;
async function erisimAnahtari(env) {
  if (token && token.bitis > Date.now() + 60_000) return token.deger;
  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + btoa(`${env.EBAY_CLIENT_ID}:${env.EBAY_CLIENT_SECRET}`),
    },
    body: "grant_type=client_credentials&scope=" + encodeURIComponent("https://api.ebay.com/oauth/api_scope"),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error_description || `eBay token ${r.status}`);
  token = { deger: d.access_token, bitis: Date.now() + d.expires_in * 1000 };
  return token.deger;
}

async function istek(q, ulke, env) {
  const url = new URL(ARAMA_URL);
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "40");
  // Fixed-price listings from sellers located in that country: auctions have no price yet.
  url.searchParams.set("filter", `buyingOptions:{FIXED_PRICE},itemLocationCountry:${ulke.ebay.konum},priceCurrency:${ulke.para}`);
  const r = await fetch(url, {
    headers: {
      Authorization: "Bearer " + (await erisimAnahtari(env)),
      "X-EBAY-C-MARKETPLACE-ID": ulke.ebay.pazar,
      "Accept-Language": ulke.ebay.dil,
    },
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.errors?.[0]?.message || `eBay ${r.status}`);
  return d.itemSummaries || [];
}

function tur(i, ikinciEl) {
  if (ikinciEl) return "ikinciel";
  // Brand outlets and authorized dealers run eBay stores as business sellers; there is no flag for it,
  // so everything else counts as a marketplace listing.
  return "pazar";
}

export async function ara({ adaylar, env, ulke }) {
  let items = [], sorgu = null;
  for (const aday of adaylar.slice(0, 3)) {
    const q = aday.replace(/\s+/g, " ").trim();
    if (q.length < 2) continue;
    items = await istek(q, ulke, env);
    sorgu = q;
    if (items.length) break;
  }
  const teklifler = items
    .filter((i) => i.price?.currency === ulke.para)
    .map((i) => {
      const ikinciEl = (i.conditionId && !/^1000$/.test(i.conditionId)) || IKINCI_EL.test(i.title);
      const kargo = (i.shippingOptions || [])[0]?.shippingCost;
      return {
        kaynak: ad,
        ad: i.title,
        fiyat: Number(i.price.value),
        para: i.price.currency,
        // US listings show the price before sales tax; eBay adds it at checkout by delivery address.
        vergiDahil: !ulke.satisVergisi,
        kargoDahil: kargo ? Number(kargo.value) === 0 : false,
        magaza: i.seller?.username || "eBay satıcısı",
        magazaLink: i.seller?.username ? `https://${ulke.ebay.site}/usr/${encodeURIComponent(i.seller.username)}` : null,
        puan: i.seller?.feedbackPercentage ? Number(i.seller.feedbackPercentage) / 20 : null,
        yorumSayisi: i.seller?.feedbackScore || 0,
        link: i.itemAffiliateWebUrl || i.itemWebUrl,
        resim: i.image?.imageUrl || i.thumbnailImages?.[0]?.imageUrl || null,
        ikinciEl,
        aksesuar: AKSESUAR.test(i.title),
        tur: tur(i, ikinciEl),
      };
    });
  return { teklifler, sorgu };
}
