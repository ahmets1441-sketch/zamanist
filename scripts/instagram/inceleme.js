// node scripts/instagram/inceleme.js inceleme.json -> out/<n>.png, an "Alınır mı?" review carousel (1080x1350).
// inceleme.json: {ust, baslik, fiyatEtiket, kapak, ozellikler:[[deger, etiket]], ozellikGorsel, artilar:[], eksiler:[],
//   renkler:[{dosya, kod, ad, fiyat, eskiFiyat?, stok}], karar:{baslik, evet, hayir, secim}, tarih, kaynak}
// "ust" is printed as written (write it in capitals). Image paths are relative to inceleme.json; product photos are white-background shots.
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
const v = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const kok = path.dirname(path.resolve(process.argv[2]));
const tl = (n) => n.toLocaleString("tr-TR", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 }) + " TL";
const k = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const img = (d) => "file://" + path.join(kok, d);
const logo = "file://" + path.join(__dirname, "logo-b-yuvarlak.png");
const ust = `<div class="marka-ust"><img class="logo-img" src="${logo}"><span class="yazi">basiclink<i>.</i></span></div>`;
const toplam = 6;
const no = (n) => `<p class="sayfa">${n}/${toplam}</p>`;
const liste = (xs, isaret) => `<ul class="madde">${xs.map((x) => `<li><span class="is">${isaret}</span><span>${k(x)}</span></li>`).join("")}</ul>`;

const slaytlar = [
`<section class="slayt kapak">${ust}
  <p class="ust-yazi">${k(v.ust)}</p>
  <h1>Alınır<br>mı?</h1>
  <p class="model">${k(v.baslik)}</p>
  <p class="cip">${k(v.fiyatEtiket)}</p>
  <img class="kapak-saat" src="${img(v.kapak)}">
  <p class="kaydir">Kaydır →</p>
</section>`,
`<section class="slayt ozet">${ust}${no(2)}
  <h2>Kısaca</h2>
  <div class="ozet-ic"><div class="izgara">${v.ozellikler.map(([d, e]) => `<div class="kutu"><b>${k(d)}</b><span>${k(e)}</span></div>`).join("")}</div>
  <img src="${img(v.ozellikGorsel)}"></div>
</section>`,
`<section class="slayt arti">${ust}${no(3)}<h2>Artıları</h2>${liste(v.artilar, "+")}</section>`,
`<section class="slayt eksi">${ust}${no(4)}<h2>Eksileri</h2>${liste(v.eksiler, "–")}</section>`,
`<section class="slayt renk">${ust}${no(5)}<h2>Renkler ve fiyatlar</h2>
  <div class="renkler">${v.renkler.map((r) => `<div class="r"><img src="${img(r.dosya)}"><b>${k(r.ad)}</b><span class="kod">${k(r.kod)}</span>${r.eskiFiyat ? `<s>${tl(r.eskiFiyat)}</s>` : ""}<span class="f">${tl(r.fiyat)}</span><span class="stok ${r.stok ? "" : "yok"}">${r.stok ? "Stokta" : "Stokta yok"}</span></div>`).join("")}</div>
  <p class="dip">Fiyatlar ${k(v.tarih)} · ${k(v.kaynak)}</p>
</section>`,
`<section class="slayt karar">
  <img class="logo-img" src="${logo}">
  <h2>${k(v.karar.baslik)}</h2>
  <div class="kk"><p><b>Al:</b> ${k(v.karar.evet)}</p><p><b>Alma:</b> ${k(v.karar.hayir)}</p></div>
  <div class="secim"><span>Bizim seçimimiz</span><p>${k(v.karar.secim)}</p></div>
  <p class="hikaye-not">Linkler story'de ve zamanist.com'da</p>
  <p class="not">Saati biz test etmedik. Bilgiler ${k(v.kaynak)} ürün sayfaları ve yayımlanan tanıtımlardan derlendi; fiyatlar ${k(v.tarih)} tarihli. Görseller: ${k(v.kaynak)}.</p>
  <p class="hesap">@basiclinkk</p>
</section>`];

const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#888;font-family:Inter,sans-serif}
.slayt{width:1080px;height:1350px;position:relative;overflow:hidden;background:#F4F4F2;color:#111;margin-bottom:20px;padding:150px 70px 80px}
.marka-ust{position:absolute;top:44px;right:56px;display:flex;align-items:center;gap:12px}
.marka-ust .yazi{font:700 30px "Space Grotesk";letter-spacing:-.02em}
.marka-ust i{font-style:normal;color:#CFA65A}
.logo-img{width:44px;height:44px}
.sayfa{position:absolute;left:60px;top:52px;font:600 22px Inter;color:#888}
h2{font:900 92px/1 Inter;letter-spacing:-.05em;margin-bottom:50px}
.kapak{padding-top:120px}
.ust-yazi{font:700 28px Inter;letter-spacing:.2em;color:#A07F3E}
.kapak h1{font:900 200px/.86 Inter;letter-spacing:-.06em;text-transform:uppercase;margin-top:24px}
.model{font:700 52px Inter;letter-spacing:-.03em;margin-top:34px}
.cip{display:inline-block;margin-top:26px;background:#111;color:#fff;font:700 34px Inter;padding:16px 30px;border-radius:999px}
.kapak-saat{position:absolute;right:-40px;bottom:-30px;height:860px;mix-blend-mode:multiply;transform:rotate(-8deg)}
.kaydir{position:absolute;left:70px;bottom:60px;font:600 26px Inter}
.ozet,.arti,.eksi{display:flex;flex-direction:column}
.ozet-ic{flex:1;display:flex;gap:30px;align-items:center}
.izgara{display:grid;grid-template-columns:1fr 1fr;gap:18px;flex:1}
.kutu{background:#fff;border-radius:24px;padding:40px 30px;display:flex;flex-direction:column;gap:8px}
.kutu b{font:800 54px Inter;white-space:nowrap;letter-spacing:-.04em}
.kutu span{font:500 28px Inter;color:#777}
.ozet-ic img{width:340px;mix-blend-mode:multiply}
.madde{list-style:none;flex:1;display:flex;flex-direction:column;justify-content:center;gap:56px;padding-bottom:60px}
.madde li{display:flex;gap:30px;align-items:flex-start;font:600 46px/1.25 Inter;letter-spacing:-.02em}
.madde .is{flex:none;width:72px;height:72px;margin-top:-4px;border-radius:50%;display:grid;place-items:center;font:800 44px/1 Inter}
.arti .is{background:#CFA65A;color:#111}
.eksi .is{background:#111;color:#fff}
.renkler{display:grid;grid-template-columns:repeat(3,1fr);gap:26px 20px}
.r{display:flex;flex-direction:column;align-items:center;text-align:center;gap:4px}
.r img{height:300px;mix-blend-mode:multiply;margin-bottom:10px}
.r b{font:700 24px/1.2 Inter}
.r .kod{font:500 19px Inter;color:#888}
.r s{font:500 20px Inter;color:#999}
.r .f{font:800 32px Inter;letter-spacing:-.02em}
.r .stok{font:600 18px Inter;color:#2E7D32}.r .stok.yok{color:#B23A2E}
.dip{position:absolute;left:70px;bottom:50px;font:500 20px Inter;color:#888}
.karar{background:#111;color:#EEE;display:flex;flex-direction:column;align-items:center;text-align:center;padding:110px 80px 70px}
.karar .logo-img{width:90px;height:90px;margin-bottom:30px}
.karar h2{color:#fff;font-size:96px;margin-bottom:40px}
.kk{display:flex;flex-direction:column;gap:22px;font:500 34px/1.35 Inter;max-width:900px}
.kk b{color:#CFA65A}
.secim{margin-top:44px;border:2px solid #CFA65A;border-radius:28px;padding:30px 40px;max-width:900px}
.secim span{font:700 22px Inter;letter-spacing:.2em;text-transform:uppercase;color:#CFA65A}
.secim p{font:700 36px/1.3 Inter;color:#fff;margin-top:12px}
.hikaye-not{margin-top:40px;font:700 32px Inter;color:#111;background:#CFA65A;border-radius:999px;padding:18px 40px}
.karar .not{margin-top:auto;font:400 21px/1.4 Inter;color:#888;max-width:860px}
.karar .hesap{font:600 24px Inter;color:#999;margin-top:14px}
</style></head><body>${slaytlar.join("")}</body></html>`;
fs.writeFileSync(path.join(kok, "inceleme.html"), html);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  await p.goto("file://" + path.join(kok, "inceleme.html"), { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready);
  fs.mkdirSync(path.join(kok, "out"), { recursive: true });
  const s = await p.$$(".slayt");
  for (const [i, el] of s.entries()) await el.screenshot({ path: path.join(kok, "out", `${i + 1}.png`) });
  await b.close();
  console.log(s.length, "slayt");
})();
