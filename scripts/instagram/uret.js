// node scripts/instagram/uret.js post.json -> out/<n>.png, 1080x1350 slides for @basiclinkk.
// post.json: {baslik, alt, tarih, satici?, urunler:[{dosya, marka, ad, kod, fiyat, eskiFiyat?, fiyatNot?, link}]}, "dosya" relative to post.json.
// satici: the shop the prices and photos come from, when it is not the brand itself.
// Needs playwright (npx playwright install chromium); product photos are trimmed white-background shots.
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
const veri = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const kok = path.dirname(path.resolve(process.argv[2]));
const tl = (n) => n.toLocaleString("tr-TR", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 }) + " TL";
const k = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const src = (u) => "file://" + path.join(kok, u.dosya);
const U = veri.urunler;
const parca = (xs, n) => xs.reduce((a, x, i) => (i % n ? a[a.length - 1].push(x) : a.push([x]), a), []);

const kapak = `<section class="slayt kapak">
  <div class="marka-ust"><img class="logo-img" src="file://${path.join(__dirname, "logo-b-yuvarlak.png")}"><span class="yazi">basiclink<i>.</i></span></div>
  <h1>${k(veri.baslik)}</h1>
  <p class="alt">${k(veri.alt)}</p>
  <div class="kapak-urunler">${U.slice(0, 3).map((u, i) => `<img class="ku${i}" src="${src(u)}">`).join("")}</div>
  <p class="kaydir">Kaydır →</p>
</section>`;
const urunSlayt = (grup, no) => `<section class="slayt liste">
  <div class="marka-ust"><img class="logo-img" src="file://${path.join(__dirname, "logo-b-yuvarlak.png")}"><span class="yazi">basiclink<i>.</i></span></div>
  ${grup.map((u, i) => `<div class="satir ${i % 2 ? "ters" : ""}">
    <img src="${src(u)}">
    <div class="etiket"><span class="m" lang="${/[çğıöşüİ]/i.test(u.marka) ? "tr" : "en"}">${k(u.marka)}</span><span class="ad">${k(u.ad)}</span><span class="kod">${k(u.kod)}</span>${u.eskiFiyat ? `<span class="eski"><s>${tl(u.eskiFiyat)}</s>${u.fiyatNot ? ` · ${k(u.fiyatNot)}` : ""}</span>` : ""}<span class="fiyat">${tl(u.fiyat)}</span></div>
  </div>`).join("")}
  <p class="sayfa">${no}</p>
</section>`;
const son = `<section class="slayt son">
  <img class="logo-img buyuk" src="file://${path.join(__dirname, "logo-b-yuvarlak.png")}">
  <p class="yazi">basiclink<i>.</i></p>
  <p class="hesap">@basiclinkk</p>
  <h2>Linkler ve güncel fiyatlar</h2>
  <p class="site">zamanist.com</p>
  <p>Profildeki linke dokun.</p>
  <p class="not">Fiyatlar ${k(veri.tarih)} tarihinde ${veri.satici ? k(veri.satici) + " sitesinde" : "markanın kendi sitesinde"} kontrol edildi. Fiyat ve stok değişebilir. Ürün görselleri: ${k(veri.satici || [...new Set(U.map((u) => u.marka))].join(", "))}.</p>
</section>`;
const gruplar = parca(U, 3);
const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0}
body{background:#888;font-family:Inter,sans-serif}
.slayt{width:1080px;height:1350px;position:relative;overflow:hidden;background:#F4F4F2;color:#111;margin-bottom:20px}
.marka-ust{position:absolute;top:44px;right:56px;display:flex;align-items:center;gap:12px}
.marka-ust .yazi{font:700 30px "Space Grotesk";letter-spacing:-.02em;color:#111}
.marka-ust i,.son .yazi i{font-style:normal;color:#CFA65A}
.logo-img{width:44px;height:44px}
.logo-img.buyuk{width:150px;height:150px;margin-bottom:10px}
.logo{display:inline-grid;place-items:center;width:40px;height:40px;border-radius:50%;border:2px solid #CFA65A;font:700 22px "Playfair Display";color:#1B3358;letter-spacing:0}
.kapak h1{position:absolute;left:62px;top:130px;font:800 118px/0.95 Inter;text-transform:uppercase;letter-spacing:-.05em;max-width:900px}
.kapak .alt{position:absolute;left:66px;top:390px;font:500 40px Inter;color:#666}
.kapak-urunler img{position:absolute;mix-blend-mode:multiply;width:600px}
.kapak-urunler img{width:540px}
.ku0{left:40px;bottom:560px;transform:rotate(-4deg)}
.ku1{right:40px;bottom:330px;transform:rotate(3deg)}
.ku2{left:90px;bottom:110px;transform:rotate(-2deg)}
.kaydir{position:absolute;right:60px;bottom:52px;font:600 26px Inter;color:#111}
.liste{padding:120px 56px 60px;display:flex;flex-direction:column;justify-content:space-around}
.satir{display:flex;align-items:center;gap:20px;height:370px}
.satir.ters{flex-direction:row-reverse}
.satir img{width:560px;height:370px;object-fit:contain;mix-blend-mode:multiply}
.etiket{display:flex;flex-direction:column;gap:6px;flex:1}
.satir.ters .etiket{text-align:right}
.etiket .m{font:600 22px Inter;letter-spacing:.2em;text-transform:uppercase;color:#888}
.etiket .ad{font:700 34px/1.15 Inter;letter-spacing:-.02em}
.etiket .kod{font:500 24px Inter;color:#888;letter-spacing:.04em}
.etiket .fiyat{font:700 46px Inter;margin-top:6px}
.etiket .eski{font:500 24px Inter;color:#B23A2E;margin-top:6px}
.etiket .eski s{color:#888}
.sayfa{position:absolute;left:60px;top:52px;font:600 22px Inter;color:#888}
.son{background:#111;color:#EEE;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:18px;padding:80px}
.son .logo.buyuk{width:120px;height:120px;font-size:64px;color:#fff;border-width:3px;margin-bottom:20px}
.son .yazi{font:700 56px "Space Grotesk";letter-spacing:-.02em;color:#fff;margin-top:-6px}
.son .hesap{font:600 30px Inter;letter-spacing:.04em;color:#999;margin:-6px 0 30px}
.son h2{font:800 68px Inter;letter-spacing:-.04em;color:#fff}
.son .site{font:700 60px Inter;color:#CFA65A;letter-spacing:-.02em}
.son p{font:500 34px Inter}
.son .not{font:400 24px Inter;color:#888;margin-top:60px;max-width:760px}
</style></head><body>${kapak}${gruplar.map((g, i) => urunSlayt(g, `${i + 1}/${gruplar.length}`)).join("")}${son}</body></html>`;
fs.writeFileSync(path.join(kok, "post.html"), html);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  await p.goto("file://" + path.join(kok, "post.html"), { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready);
  fs.mkdirSync(path.join(kok, "out"), { recursive: true });
  const s = await p.$$(".slayt");
  for (const [i, el] of s.entries()) await el.screenshot({ path: path.join(kok, "out", `${i + 1}.png`) });
  await b.close();
  console.log(s.length, "slayt");
})();
