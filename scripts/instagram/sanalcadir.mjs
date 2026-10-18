// node scripts/instagram/sanalcadir.mjs <url>... : name, price, basket price and gallery of sanalcadir.com products (robots.txt allows product pages).
import fs from "node:fs";
const UA = "ZamanistBot/1.0 (+https://zamanist.com)";
const urls = process.argv.slice(2);
const out = [];
for (const url of urls) {
  const h = await (await fetch(url, { headers: { "User-Agent": UA } })).text();
  const al = (re) => (h.match(re) || [])[1];
  const ad = al(/og:title" content="([^"]+)"/);
  const fiyat = Number(al(/price:amount" content="([\d.]+)"/));
  const sepet = al(/Sepette<\/div> <div class="pipe-wrapper">\|<\/div> <span>([^<]+)/);
  const oran = al(/Sepette %(\d+) İndirim/);
  const kod = al(/>(\d{3}-\d{6,8})\.-</) || (url.match(/-(\d{3}-\d{6,8})-\d+\/?$/) || [])[1];
  const galeri = [...new Set([...h.matchAll(/(https:\/\/[^"]+?\/products\/[\d/]+\/[a-f0-9-]+)_size1400x1400_quality90_cropCenter\.jpg/g)].map((m) => m[1]))];
  out.push({ url, ad, kod, fiyat, sepet, oran, galeri });
  await new Promise((r) => setTimeout(r, 1500));
}
fs.writeFileSync("urunler.json", JSON.stringify(out, null, 1));
for (const u of out) console.log(u.kod, "|", u.ad, "|", u.fiyat, "|", u.sepet, "|", u.oran, "| galeri", u.galeri.length);
