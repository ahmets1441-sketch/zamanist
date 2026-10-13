// Official Japanese list price from the brand's own site, found by model code.
// Only brands whose product URL can be built from the code are supported.
// Casio blocks automated requests (403) and Hamilton/Longines URLs need a slug: those fall back to
// the brand's official Rakuten store in /api/ara.
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

// Seiko Japan: /jp-ja/products/<collection>/<code>; the list price sits in data-dataLayer-price.
const SEIKO_KOLEKSIYONLAR = ["5sports", "presage", "prospex", "astron", "kingseiko", "seikoselection", "lukia", "dolceandexceline"];
const SEIKO_DESEN = /^S[A-Z]{3}\d{3}$/;
const seikoAdaylar = (k) => SEIKO_KOLEKSIYONLAR.map((c) => ({ marka: "Seiko", ad: "セイコー", kod: k, url: `https://www.seikowatches.com/jp-ja/products/${c}/${k.toLowerCase()}` }));

function fiyatOku(html, kod) {
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
    const bulunan = fiyatOku(await r.text(), aday.kod);
    return bulunan ? { ...aday, ...bulunan, url: r.url } : { url: aday.url, durum: "fiyat yok" };
  } catch (e) {
    return { url: aday.url, durum: String(e.message) };
  }
}

export async function onRequestGet({ request }) {
  const u = new URL(request.url);
  const q = (u.searchParams.get("q") || "").trim().slice(0, 60);
  // All adapters below read Japanese brand sites; other countries get their own later.
  if ((u.searchParams.get("ulke") || "japonya") !== "japonya") return Response.json({ bulundu: false, neden: "desteklenmeyen" });
  // The query may hold brand and model words too ("TISSOT T1292102203100 CLASSIC DREAM"): try each token.
  const kodlar = [...new Set([sade(q), ...q.split(/[\s,/]+/).map(sade)])].filter((k) => k.length >= 5);
  const adaylar = [
    ...SWATCH.flatMap((b) => kodlar.filter((k) => b.desen.test(k)).map((k) => ({ marka: b.marka, ad: b.ad, url: b.url(k) }))),
    ...kodlar.filter((k) => SEIKO_DESEN.test(k)).flatMap(seikoAdaylar),
  ];
  if (!adaylar.length) return Response.json({ bulundu: false, neden: "desteklenmeyen" });

  const sonuclar = await Promise.all(adaylar.slice(0, 10).map(dene));
  const bulunan = sonuclar.find((s) => s.fiyat);
  const govde = bulunan
    ? { bulundu: true, marka: bulunan.marka, markaJp: bulunan.ad, fiyat: bulunan.fiyat, urunAdi: bulunan.urunAdi, link: bulunan.url }
    : { bulundu: false, neden: "bulunamadi" };
  if (u.searchParams.has("hata")) govde.denemeler = sonuclar;
  return Response.json(govde, { headers: { "Cache-Control": "public, max-age=21600" } });
}
