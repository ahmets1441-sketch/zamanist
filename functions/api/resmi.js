// Official list price from the brand's own site in the chosen country, found by model code.
// Only brands whose product URL can be built from the code are supported. Each country names the
// brands' locale paths in src/_data/ulkeler.json "resmiYerel"; a brand without one is skipped there.
import ulkeler from "../../src/_data/ulkeler.json";

// Nike pages are found by style code (DX5883-100).
// Casio blocks automated requests (403) and Hamilton/Longines URLs need a slug: those fall back to
// the brand's official Rakuten store in /api/ara.
const UA = "Mozilla/5.0 (compatible; ZamanistBot/1.0; +https://zamanist.com)";

const sade = (s) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

// Swatch Group sites serve /<locale>/<sku>.html (lowercase, no dots), e.g. ja-jp or en-us.
const SWATCH = [
  { marka: "Tissot", ad: "ティソ", desen: /^T\d{12,13}$/, site: "www.tissotwatches.com" },
  { marka: "Hamilton", ad: "ハミルトン", desen: /^H\d{8}$/, site: "www.hamiltonwatch.com" },
  { marka: "Longines", ad: "ロンジン", desen: /^L\d{8,9}$/, site: "www.longines.com" },
  { marka: "Mido", ad: "ミドー", desen: /^M\d{12,13}$/, site: "www.midowatches.com" },
  { marka: "Certina", ad: "サーチナ", desen: /^C\d{12,13}$/, site: "www.certina.com" },
  { marka: "Rado", ad: "ラドー", desen: /^R\d{8,13}$/, site: "www.rado.com" },
];

// Seiko Japan: /jp-ja/products/<collection>/<code>; the list price sits in data-dataLayer-price.
const SEIKO_KOLEKSIYONLAR = ["5sports", "presage", "prospex", "astron", "kingseiko", "seikoselection", "lukia", "dolceandexceline"];
const SEIKO_DESEN = /^S[A-Z]{3}\d{3}$/;
const seikoAdaylar = (k, yer) => SEIKO_KOLEKSIYONLAR.map((c) => ({ marka: "Seiko", ad: "セイコー", kod: k, url: `https://www.seikowatches.com/${yer}/products/${c}/${k.toLowerCase()}` }));

// Nike: /<country>/t/<any slug>/<style code> (no country segment in the US) redirects to the product page (robots.txt allows /t/).
// The page JSON holds list price (initialPrice) and today's price (currentPrice) per style code.
const NIKE_DESEN = /^([A-Z]{2}\d{4}|\d{6})(\d{3})$/;
const nikeAday = (k, yer) => {
  const [, a, b] = k.match(NIKE_DESEN);
  return { marka: "Nike", ad: "ナイキ", kod: `${a}-${b}`, nike: true, url: `https://www.nike.com/${yer ? yer + "/" : ""}t/x/${a}-${b}` };
};

// Golden Goose: /<country>/<language>/cod-<STYLE.MATERIAL.COLOUR>.html redirects to the product page; price is in JSON-LD.
const GG_DESEN = /^(G[A-Z]{2}\d{5})(F\d{6})(\d{5})$/;
const ggAday = (k, yer) => {
  const [, a, b, c] = k.match(GG_DESEN);
  return { marka: "Golden Goose", ad: "ゴールデングース", kod: `${a}.${b}.${c}`, url: `https://www.goldengoose.com/${yer}/cod-${a}.${b}.${c}.html` };
};

function nikeOku(html, kod, para = "JPY") {
  const m = html.match(new RegExp(`/${kod}","canonicalUrl"[\\s\\S]{0,600}?"currency":"${para}","currentPrice":([\\d.]+),"initialPrice":([\\d.]+)`));
  if (!m) return null;
  const ad = (html.match(/<meta property="og:title" content="([^"]+)"/) || [])[1] || "";
  const urunAdi = ad.replace(/&#x27;/g, "'").replace(/&amp;/g, "&") + " " + kod;
  const [simdi, liste] = [Number(m[1]), Number(m[2])];
  return { fiyat: liste, urunAdi, ...(simdi < liste ? { indirimli: simdi } : {}) };
}

function fiyatOku(html, kod, para) {
  // Seiko: take the button that belongs to this exact model, not related products on the page.
  const seiko = kod && html.match(new RegExp(`data-dataLayer-id="${kod}"[^>]*?data-dataLayer-price="(\\d{3,7})"[^>]*?data-dataLayer-brand="([^"]*)"`, "i"));
  if (seiko) return { fiyat: Number(seiko[1]), urunAdi: `セイコー ${seiko[2]} ${kod}` };
  for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      const veriler = [].concat(JSON.parse(m[1]));
      for (const d of veriler.flatMap((x) => x["@graph"] || [x])) {
        if (d["@type"] !== "Product") continue;
        const o = [].concat(d.offers || [])[0] || {};
        const fiyat = Number(o.price || o.lowPrice);
        if (fiyat > 0 && (!o.priceCurrency || o.priceCurrency === para)) return { fiyat, urunAdi: d.name || null };
      }
    } catch (e) {}
  }
  const p = html.match(new RegExp(`"price"\\s*:\\s*"?(\\d{2,7}(?:\\.\\d+)?)"?[^}]{0,80}"priceCurrency"\\s*:\\s*"${para}"`)) ||
            html.match(new RegExp(`"priceCurrency"\\s*:\\s*"${para}"[^}]{0,80}"price"\\s*:\\s*"?(\\d{2,7}(?:\\.\\d+)?)`));
  return p ? { fiyat: Number(p[1]), urunAdi: (html.match(/<meta property="og:title" content="([^"]+)"/) || [])[1] || null } : null;
}

// Turkish price from the same brand's Turkish site, so the user need not look it up.
async function trFiyati(aday) {
  if (!aday.nike) return null;
  const url = `https://www.nike.com/tr/t/x/${aday.kod}`;
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "tr" }, redirect: "follow", cf: { cacheTtl: 21600 } });
    const b = r.ok && nikeOku(await r.text(), aday.kod, "TRY");
    return b ? { fiyat: b.indirimli || b.fiyat, kaynak: "Nike Türkiye resmi sitesi", link: r.url } : null;
  } catch (e) {
    return null;
  }
}

async function dene(aday, ulke) {
  try {
    const r = await fetch(aday.url, { headers: { "User-Agent": UA, "Accept-Language": ulke.dil }, redirect: "follow", cf: { cacheTtl: 21600 } });
    if (!r.ok) return { url: aday.url, durum: r.status };
    const html = await r.text();
    const bulunan = aday.nike ? nikeOku(html, aday.kod, ulke.para) : fiyatOku(html, aday.kod, ulke.para);
    return bulunan ? { ...aday, ...bulunan, url: r.url } : { url: aday.url, durum: "fiyat yok" };
  } catch (e) {
    return { url: aday.url, durum: String(e.message) };
  }
}

export async function onRequestGet({ request }) {
  const u = new URL(request.url);
  const q = (u.searchParams.get("q") || "").trim().slice(0, 60);
  const ulke = ulkeler.find((x) => x.kod === (u.searchParams.get("ulke") || "japonya"));
  const yer = ulke?.resmiYerel;
  if (!yer) return Response.json({ bulundu: false, neden: "desteklenmeyen" });
  // The query may hold brand and model words too ("TISSOT T1292102203100 CLASSIC DREAM"): try each token.
  const kodlar = [...new Set([sade(q), ...q.split(/[\s,/]+/).map(sade)])].filter((k) => k.length >= 5);
  const adaylar = [
    ...(yer.swatch ? SWATCH.flatMap((b) => kodlar.filter((k) => b.desen.test(k)).map((k) => ({ marka: b.marka, ad: b.ad, url: `https://${b.site}/${yer.swatch}/${k.toLowerCase()}.html` }))) : []),
    ...(yer.seiko ? kodlar.filter((k) => SEIKO_DESEN.test(k)).flatMap((k) => seikoAdaylar(k, yer.seiko)) : []),
    ...("nike" in yer ? kodlar.filter((k) => NIKE_DESEN.test(k)).map((k) => nikeAday(k, yer.nike)) : []),
    ...(yer.gg ? kodlar.filter((k) => GG_DESEN.test(k)).map((k) => ggAday(k, yer.gg)) : []),
  ];
  if (!adaylar.length) return Response.json({ bulundu: false, neden: "desteklenmeyen" });

  const sonuclar = await Promise.all(adaylar.slice(0, 10).map((a) => dene(a, ulke)));
  const bulunan = sonuclar.find((s) => s.fiyat);
  const tr = bulunan && (await trFiyati(bulunan));
  const govde = bulunan
    ? { bulundu: true, tr, marka: bulunan.marka, markaJp: bulunan.ad, fiyat: bulunan.fiyat, indirimli: bulunan.indirimli || null, urunAdi: bulunan.urunAdi, link: bulunan.url }
    : { bulundu: false, neden: "bulunamadi" };
  if (u.searchParams.has("hata")) govde.denemeler = sonuclar;
  return Response.json(govde, { headers: { "Cache-Control": "public, max-age=21600" } });
}
