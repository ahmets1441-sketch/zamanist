// node shopify.mjs <domain> <regex on title/type/tags> [pages] -> discounted men's products as JSON lines
const [alan, desen, sayfa = 6] = process.argv.slice(2);
const UA = { headers: { "User-Agent": "ZamanistBot/1.0 (+https://zamanist.com)" } };
const re = new RegExp(desen, "i");
const out = [];
const bekle = (ms) => new Promise((ok) => setTimeout(ok, ms));
for (let s = 1; s <= sayfa; s++) {
  let r;
  for (let deneme = 0; deneme < 4; deneme++) {
    r = await fetch(`https://${alan}/products.json?limit=250&page=${s}`, UA);
    if (r.status !== 429) break;
    await bekle(15000 * (deneme + 1)); // polite back-off when the store asks us to slow down
  }
  if (!r.ok) { console.error("HTTP", r.status); break; }
  await bekle(3000);
  const { products } = await r.json();
  if (!products.length) break;
  for (const p of products) {
    const metin = `${p.title} ${p.product_type} ${(p.tags || []).join(" ")}`;
    if (!re.test(metin) || /kadın|kız çocuk|women/i.test(metin)) continue;
    const v = p.variants.filter((v) => v.available);
    if (!v.length) continue;
    const fiyat = Math.min(...v.map((x) => +x.price)), eski = Math.max(...v.map((x) => +(x.compare_at_price || 0)));
    out.push({ ad: p.title, tur: p.product_type, fiyat, eski, indirim: eski > fiyat ? Math.round((1 - fiyat / eski) * 100) : 0, kod: v[0].sku, bedenler: v.map((x) => x.option1).join(","), gorsel: p.images[0]?.src, link: `https://${alan}/products/${p.handle}` });
  }
}
out.sort((a, b) => b.indirim - a.indirim);
for (const x of out) console.log(JSON.stringify(x));
console.error(out.length, "ürün");
