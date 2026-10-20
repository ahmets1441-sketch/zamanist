// node scripts/instagram/kombin.js post.json -> out/<n>.png (1080x1350 carousel) and out/hikaye-<n>.png (1080x1920 stories: 0 = cover, then one per product) for an outfit post.
// post.json: {ust, baslik, tarih, referans:{dosya, kaynak}, urunler:[{dosya, zemin, marka, ad, kod, fiyat, eskiFiyat?, fiyatNot?, satici, link}]}
// "zemin" is the photo's own background colour; each product sits on a tile of that colour so shop photos with grey or white
// backgrounds both look clean. The reference photo is the look being recreated and is credited on the cover.
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
const veri = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const kok = path.dirname(path.resolve(process.argv[2]));
const tl = (n) => n.toLocaleString("tr-TR", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 }) + " TL";
const k = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const src = (d) => "file://" + path.join(kok, d);
const lang = (s) => (/[çğıöşüİ]/i.test(s) ? "tr" : "en");
const logo = "file://" + path.join(__dirname, "logo-b-yuvarlak.png");
const U = veri.urunler;
const saticilar = [...new Set(U.map((u) => u.satici))];
const ust = `<div class="marka-ust"><img src="${logo}"><span>basiclink<i>.</i></span></div>`;
const eski = (u) => u.eskiFiyat || u.fiyatNot ? `<span class="eski">${u.eskiFiyat ? `<s>${tl(u.eskiFiyat)}</s>` : ""}${u.eskiFiyat && u.fiyatNot ? " · " : ""}${u.fiyatNot ? k(u.fiyatNot) : ""}</span>` : "";
const karo = (u, sinif = "") => `<div class="karo ${sinif}" style="background:${u.zemin}"><img src="${src(u.dosya)}"></div>`;

// Cover and story: the reference look next to the pieces laid out flat, each labelled with its brand and code. No prices.
// Every product carries "kesik" (a cut-out PNG from kes.mjs) and "kapak" {x, y, w, lx, ly}: its place and its label's place
// on the 1080x1350 cover; the story reuses the same layout shifted down by "dy".
const serili = (dy) => `<div class="marka-ust sol" style="top:${44 + dy}px"><img src="${logo}"><span>basiclink<i>.</i></span></div>
  <figure class="ref" style="top:${110 + dy}px"><img src="${src(veri.referans.dosya)}"><figcaption>İlham fotoğrafı: ${k(veri.referans.kaynak)}</figcaption></figure>
  ${U.map((u) => `<img class="parca" src="${src(u.kesik)}" style="left:${u.kapak.x}px;top:${u.kapak.y + dy}px;width:${u.kapak.w}px">
  <span class="ad-etiket" style="left:${u.kapak.lx}px;top:${u.kapak.ly + dy}px"><b lang="${lang(u.marka)}">${k(u.marka)}</b>${u.kod ? `<small>${k(u.kod)}</small>` : ""}</span>`).join("")}`;
const kapak = `<section class="slayt kapak">
  ${serili(0)}
  <div class="kapak-yazi">${veri.ust ? `<p class="kicker">${k(veri.ust)}</p>` : ""}<h1>${k(veri.baslik)}</h1><p class="kaydir">Kaydır →</p></div>
</section>`;
const parca = (xs, n) => xs.reduce((a, x, i) => (i % n ? a[a.length - 1].push(x) : a.push([x]), a), []);
const gruplar = parca(U, 3);
const liste = (g, no) => `<section class="slayt liste">
  ${ust}<p class="sayfa">${no}</p>
  ${g.map((u) => `<div class="satir">${karo(u)}
    <div class="etiket"><span class="m" lang="${lang(u.marka)}">${k(u.marka)}</span><span class="ad">${k(u.ad)}</span>${u.kod ? `<span class="kod">${k(u.kod)}</span>` : ""}${eski(u)}<span class="fiyat">${tl(u.fiyat)}</span>${u.satici !== u.marka ? `<span class="kod">${k(u.satici)}</span>` : ""}</div>
  </div>`).join("")}
</section>`;
const son = `<section class="slayt son">
  <img class="buyuk" src="${logo}">
  <p class="yazi">basiclink<i>.</i></p>
  <p class="hesap">@basiclinkk</p>
  <p class="hikaye-not">Ürün linkleri story'de</p>
  <h2>Linkler ve güncel fiyatlar</h2>
  <p class="site">zamanist.com</p>
  <p>Profildeki linke dokun.</p>
  <p class="not">Fiyatlar ${k(veri.tarih)} tarihinde ${k(saticilar.join(", "))} sitelerinde kontrol edildi; sepette indirimler sepet fiyatıyla yazıldı. Fiyat ve stok değişebilir. Ürün görselleri satıcı sitelerinden, ilham fotoğrafı ${k(veri.referans.kaynak)}.</p>
</section>`;
// Stories: Instagram allows one link sticker per story, so the first story is the cover layout (its slot links the site page)
// and every product gets its own story with an empty slot for that product's link sticker.
const hikaye = `<section class="hikaye kapak">
  ${serili(150)}
  <div class="kapak-yazi" style="bottom:auto;top:1330px">${veri.ust ? `<p class="kicker">${k(veri.ust)}</p>` : ""}<h1>${k(veri.baslik)}</h1></div>
  <div class="yer">Kombinin sayfası · buraya dokun</div>
  <p class="h-not">Her parçanın linki sonraki story'lerde → · İlham fotoğrafı: ${k(veri.referans.kaynak)}.</p>
</section>`;
const hikayeUrun = (u, i) => `<section class="hikaye h-urun">
  <div class="marka-ust sol" style="top:150px"><img src="${logo}"><span>basiclink<i>.</i></span></div>
  <p class="h-sira">${k(veri.baslik)} · ${i + 1}/${U.length}</p>
  <div class="h-gorsel"><img src="${src(u.kesik)}"></div>
  <div class="h-bilgi">
    <b lang="${lang(u.marka)}">${k(u.marka)}</b>
    <span class="ad">${k(u.ad)}</span>
    ${u.kod ? `<span class="kod">${k(u.kod)}</span>` : ""}
    <span class="fiyat">${tl(u.fiyat)}</span>
    ${eski(u)}
    ${u.satici !== u.marka ? `<span class="kod">Satıcı: ${k(u.satici)}</span>` : ""}
  </div>
  <div class="yer">Ürüne git · buraya dokun</div>
  <p class="h-not">Fiyat ${k(veri.tarih)} tarihinde ${k(u.satici)} sitesinde kontrol edildi; değişebilir.</p>
</section>`;

const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0}
body{background:#888;font-family:Inter,sans-serif}
.slayt{width:1080px;height:1350px;position:relative;overflow:hidden;background:#F4F4F2;color:#111;margin-bottom:20px}
.marka-ust{position:absolute;top:44px;right:56px;display:flex;align-items:center;gap:12px}
.marka-ust img{width:44px;height:44px}
.marka-ust span,.son .yazi{font:700 30px "Space Grotesk";letter-spacing:-.02em}
.marka-ust i,.son .yazi i{font-style:normal;color:#CFA65A}
.karo{border-radius:22px;display:flex;align-items:center;justify-content:center;overflow:hidden}
.karo img{width:100%;height:100%;min-width:0;min-height:0;object-fit:contain}
.kicker{font:700 26px Inter;letter-spacing:.3em;color:#B08A44}
.kapak{background:#E9E7E2}
.marka-ust.sol{left:44px;right:auto}
.ref{position:absolute;left:40px;top:110px;width:380px;height:600px;margin:0;border-radius:18px;overflow:hidden;box-shadow:0 14px 30px rgba(0,0,0,.18)}
.ref img{width:100%;height:100%;object-fit:cover}
.ref figcaption{position:absolute;left:12px;bottom:12px;font:500 17px Inter;color:#fff;background:rgba(0,0,0,.45);padding:5px 10px;border-radius:7px}
.parca{position:absolute;filter:drop-shadow(0 10px 12px rgba(0,0,0,.16))}
.ad-etiket{position:absolute;display:flex;flex-direction:column;gap:4px;color:#222}
.ad-etiket b{font:700 28px/1 "Playfair Display";letter-spacing:.01em;text-transform:uppercase}
.ad-etiket small{font:500 19px Inter;color:#555;letter-spacing:.02em}
.kapak-yazi{position:absolute;left:470px;right:44px;bottom:48px}
.kapak h1{font:800 64px/0.98 Inter;letter-spacing:-.045em;margin-top:12px;text-wrap:balance}
.kaydir{font:600 24px Inter;margin-top:18px;text-align:right}
.liste{padding:130px 56px 56px;display:flex;flex-direction:column;gap:28px}
.sayfa{position:absolute;left:60px;top:52px;font:600 22px Inter;color:#888}
.satir{display:flex;gap:34px;align-items:center;height:370px}
.satir .karo{width:420px;height:370px;padding:22px;flex:none}
.etiket{display:flex;flex-direction:column;gap:6px;flex:1;min-width:0}
.etiket .m{font:600 22px Inter;letter-spacing:.2em;text-transform:uppercase;color:#888}
.etiket .ad{font:700 36px/1.15 Inter;letter-spacing:-.02em}
.etiket .kod{font:500 23px Inter;color:#888}
.etiket .eski{font:500 24px Inter;color:#B23A2E;margin-top:6px}.etiket .eski s{color:#888}
.etiket .fiyat{font:800 50px Inter;letter-spacing:-.02em;margin-top:4px}
.son{background:#111;color:#EEE;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:18px;padding:80px}
.son .buyuk{width:150px;height:150px;margin-bottom:10px}
.son .yazi{font-size:56px;color:#fff;margin-top:-6px}
.son .hesap{font:600 30px Inter;letter-spacing:.04em;color:#999;margin:-6px 0 30px}
.son h2{font:800 68px Inter;letter-spacing:-.04em;color:#fff}
.son .site{font:700 60px Inter;color:#CFA65A;letter-spacing:-.02em}
.son p{font:500 34px Inter}
.son .hikaye-not{font:700 40px Inter;color:#111;background:#CFA65A;border-radius:999px;padding:22px 48px;margin-bottom:34px}
.son .not{font:400 24px Inter;color:#888;margin-top:60px;max-width:800px}
.hikaye{width:1080px;height:1920px;position:relative;overflow:hidden;color:#111}
.hikaye .yer{position:absolute;left:56px;right:56px;top:1580px;height:120px;border:3px dashed #CFA65A;border-radius:28px;display:grid;place-items:center;font:700 30px Inter;color:#B08A44}
.h-urun{background:#E9E7E2}
.h-sira{position:absolute;right:56px;top:160px;font:600 24px Inter;color:#777}
.h-gorsel{position:absolute;left:90px;right:90px;top:260px;height:820px;display:flex;align-items:center;justify-content:center}
.h-gorsel img{max-width:100%;max-height:100%;width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 16px 18px rgba(0,0,0,.16))}
.h-bilgi{position:absolute;left:56px;right:56px;top:1130px;display:flex;flex-direction:column;gap:8px}
.h-bilgi b{font:700 44px/1 "Playfair Display";text-transform:uppercase}
.h-bilgi .ad{font:700 42px/1.15 Inter;letter-spacing:-.02em}
.h-bilgi .kod{font:500 26px Inter;color:#666}
.h-bilgi .fiyat{font:800 76px Inter;letter-spacing:-.03em;margin-top:10px}
.h-bilgi .eski{font:500 28px Inter;color:#B23A2E}.h-bilgi .eski s{color:#888}
.h-not{position:absolute;left:56px;right:56px;top:1716px;font:400 20px Inter;color:#888}
</style></head><body>${kapak}${gruplar.map((g, i) => liste(g, `${i + 1}/${gruplar.length}`)).join("")}${son}${hikaye}${U.map(hikayeUrun).join("")}</body></html>`;
fs.writeFileSync(path.join(kok, "post.html"), html);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  await p.goto("file://" + path.join(kok, "post.html"), { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready);
  fs.mkdirSync(path.join(kok, "out"), { recursive: true });
  const s = await p.$$(".slayt");
  for (const [i, el] of s.entries()) await el.screenshot({ path: path.join(kok, "out", `${i + 1}.png`) });
  const h = await p.$$(".hikaye");
  for (const [i, el] of h.entries()) await el.screenshot({ path: path.join(kok, "out", `hikaye-${i}.png`) });
  await b.close();
  console.log(s.length, "slayt +", h.length, "story");
})();
