// Official Japanese list price from the brand's own site, found by model code.
// Only brands whose product URL can be built from the code are supported.
const UA = "Mozilla/5.0 (compatible; ZamanistBot/1.0; +https://zamanist.com)";

const sade = (s) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

// Swatch Group sites serve /ja-jp/<sku>.html (lowercase, no dots).
const SWATCH = [
  { marka: "Tissot", ad: "ティソ", desen: /^T\d{12,13}$/, url: (k) => `https://www.tissotwatches.com/ja-jp/${k.toLowerCase()}.html` },
  { marka: "Hamilton", ad: "ハミルトン", desen: /^H\d{8}$/, url: (k) => `https://www.hamiltonwatch.com/ja-jp/${k.toLowerCase()}.html` },
  { marka: "Longines", ad: "ロンジン", desen: /^L\d{8,9}$/, url: (k) => `https://www.longines.com/ja-jp/${k.toLowerCase()}.html` },
  { marka: "Mido", ad: "ミドー", desen: /^M\d{12,13}$/, url: (k) => `https://www.midowatches.com/ja-jp/${k.toLowerCase()}.html` },
  { marka: "Certina", ad: "サーチナ", desen: /^C\d{12,13}$/, url: (k) => `https://www.certina.com/ja-jp/${k.toLowerCase()}.html` },
  { marka: "Rado", ad: "ラドー", desen: /^R\d{8,13}$/, url: (k) => `https://www.rado.com/ja-jp/${k.toLowerCase()}.html` },
];

// Casio Japan: casio.com/jp/watches/<line>/product.<MODEL>/ ; Japanese models end in JF/JR.
const CASIO_SERILER = ["gshock", "oceanus", "edifice", "protrek", "babyg", "casio"];
function casioAdaylar(q) {
  const m = q.toUpperCase().replace(/\s+/g, "");
  if (!/^[A-Z]{1,6}-?[A-Z0-9]{2,}(-[A-Z0-9]+)*$/.test(m)) return [];
  const kodlar = /(JF|JR|JA)$/.test(m) ? [m] : [m.replace(/-?\d?[A-Z]{2}$/, (s) => s) + "JF", m + "JF"].filter((v, i, a) => a.indexOf(v) === i);
  return kodlar.flatMap((k) => CASIO_SERILER.map((s) => ({ marka: "Casio", ad: "カシオ", url: `https://www.casio.com/jp/watches/${s}/product.${k}/` })));
}

function fiyatOku(html) {
  for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      const veriler = [].concat(JSON.parse(m[1]));
      for (const d of veriler.flatMap((x) => x["@graph"] || [x])) {
        if (d["@type"] !== "Product") continue;
        const o = [].concat(d.offers || [])[0] || {};
        const fiyat = Number(o.price || o.lowPrice);
        if (fiyat > 0 && (!o.priceCurrency || o.priceCurrency === "JPY")) return { fiyat, urunAdi: d.name || null };
      }
    } catch (e) {}
  }
  const p = html.match(/"price"\s*:\s*"?(\d{3,7})"?[^}]{0,80}"priceCurrency"\s*:\s*"JPY"/) ||
            html.match(/"priceCurrency"\s*:\s*"JPY"[^}]{0,80}"price"\s*:\s*"?(\d{3,7})/);
  return p ? { fiyat: Number(p[1]), urunAdi: (html.match(/<meta property="og:title" content="([^"]+)"/) || [])[1] || null } : null;
}

async function dene(aday) {
  try {
    const r = await fetch(aday.url, { headers: { "User-Agent": UA, "Accept-Language": "ja" }, redirect: "follow", cf: { cacheTtl: 21600 } });
    if (!r.ok) return { url: aday.url, durum: r.status };
    const bulunan = fiyatOku(await r.text());
    return bulunan ? { ...aday, ...bulunan, url: r.url, desen: undefined } : { url: aday.url, durum: "fiyat yok" };
  } catch (e) {
    return { url: aday.url, durum: String(e.message) };
  }
}

export async function onRequestGet({ request }) {
  const u = new URL(request.url);
  const q = (u.searchParams.get("q") || "").trim().slice(0, 60);
  const kod = sade(q);
  const adaylar = [...SWATCH.filter((b) => b.desen.test(kod)).map((b) => ({ marka: b.marka, ad: b.ad, url: b.url(kod) })), ...casioAdaylar(q)];
  if (!adaylar.length) return Response.json({ bulundu: false, neden: "desteklenmeyen" });

  const sonuclar = await Promise.all(adaylar.slice(0, 8).map(dene));
  const bulunan = sonuclar.find((s) => s.fiyat);
  const govde = bulunan
    ? { bulundu: true, marka: bulunan.marka, markaJp: bulunan.ad, fiyat: bulunan.fiyat, urunAdi: bulunan.urunAdi, link: bulunan.url }
    : { bulundu: false, neden: "bulunamadi" };
  if (u.searchParams.has("hata")) govde.denemeler = sonuclar;
  return Response.json(govde, { headers: { "Cache-Control": "public, max-age=21600" } });
}
