// node scripts/instagram/hikaye.js post.json -> out/hikaye.png, one 1080x1920 story listing every product.
// Each row leaves an empty slot on the right for an Instagram link sticker; the image itself cannot hold links.
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
const veri = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const kok = path.dirname(path.resolve(process.argv[2]));
const tl = (n) => n.toLocaleString("tr-TR", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 }) + " TL";
const k = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const logo = "file://" + path.join(__dirname, "logo-b-yuvarlak.png");
const U = veri.urunler;

const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0}
.h{width:1080px;height:1920px;background:#F4F4F2;color:#111;font-family:Inter,sans-serif;padding:150px 56px 170px;display:flex;flex-direction:column}
.ust{display:flex;align-items:center;gap:12px;margin-bottom:26px}
.ust img{width:48px;height:48px}.ust span{font:700 32px "Space Grotesk";letter-spacing:-.02em}.ust i{font-style:normal;color:#CFA65A}
h1{font:800 76px/1 Inter;letter-spacing:-.04em;text-transform:uppercase}
.alt{font:500 32px Inter;color:#666;margin:14px 0 30px}
.liste{flex:1;display:flex;flex-direction:column;justify-content:space-between}
.satir{display:flex;align-items:center;gap:18px;height:236px;border-top:1px solid #DDD;padding-top:8px}
.satir img{width:300px;height:200px;object-fit:contain;mix-blend-mode:multiply}
.bilgi{flex:1;display:flex;flex-direction:column;gap:4px;min-width:0}
.ad{font:700 30px/1.15 Inter;letter-spacing:-.02em}
.kod{font:500 22px Inter;color:#888}
.eski{font:500 22px Inter;color:#B23A2E}.eski s{color:#888}
.fiyat{font:800 38px Inter;letter-spacing:-.02em}
.yer{width:250px;height:90px;border:3px dashed #BBB;border-radius:20px;display:grid;place-items:center;font:600 24px Inter;color:#AAA}
.not{font:400 21px Inter;color:#888;margin-top:22px}
</style></head><body><section class="h">
<div class="ust"><img src="${logo}"><span>basiclink<i>.</i></span></div>
<h1>${k(veri.baslik)}</h1>
<p class="alt">${k(veri.alt)}</p>
<div class="liste">${U.map((u, i) => `<div class="satir">
  <img src="file://${path.join(kok, u.dosya)}">
  <div class="bilgi"><span class="ad">${k(u.ad)}</span><span class="kod">${k(u.kod)}</span>${u.eskiFiyat ? `<span class="eski"><s>${tl(u.eskiFiyat)}</s>${u.fiyatNot ? ` · ${k(u.fiyatNot)}` : ""}</span>` : ""}<span class="fiyat">${tl(u.fiyat)}</span></div>
  <div class="yer">Link ${i + 1}</div>
</div>`).join("")}</div>
<p class="not">Fiyatlar ${k(veri.tarih)} · ${k(veri.satici || "marka sitesi")}. Fiyat ve stok değişebilir.</p>
</section></body></html>`;
fs.writeFileSync(path.join(kok, "hikaye.html"), html);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto("file://" + path.join(kok, "hikaye.html"), { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready);
  fs.mkdirSync(path.join(kok, "out"), { recursive: true });
  await (await p.$(".h")).screenshot({ path: path.join(kok, "out", "hikaye.png") });
  await b.close();
})();
