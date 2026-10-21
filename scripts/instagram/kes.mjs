// node scripts/instagram/kes.mjs <in.jpg> <out.png> [tolerance] : cuts a product photo out of its plain studio background.
// Flood-fills from the image border over pixels close to the border colour and makes them transparent, so a white
// T-shirt on a grey background keeps its own whites. Needs sharp (NODE_PATH or a local install).
import sharp from "sharp";
const [giris, cikis, tol = "12"] = process.argv.slice(2);
const { data, info } = await sharp(giris).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: w, height: h } = info, T = Number(tol);
// Background colour: average of the four corners.
const kose = [0, w - 1, (h - 1) * w, h * w - 1];
const zemin = [0, 1, 2].map((c) => kose.reduce((a, i) => a + data[i * 4 + c], 0) / 4);
const yakin = (i) => Math.abs(data[i * 4] - zemin[0]) <= T && Math.abs(data[i * 4 + 1] - zemin[1]) <= T && Math.abs(data[i * 4 + 2] - zemin[2]) <= T;
const gorulen = new Uint8Array(w * h), yigin = [];
for (let x = 0; x < w; x++) yigin.push(x, (h - 1) * w + x);
for (let y = 0; y < h; y++) yigin.push(y * w, y * w + w - 1);
while (yigin.length) {
  const i = yigin.pop();
  if (gorulen[i] || !yakin(i)) continue;
  gorulen[i] = 1;
  data[i * 4 + 3] = 0;
  const x = i % w;
  if (x > 0) yigin.push(i - 1);
  if (x < w - 1) yigin.push(i + 1);
  if (i >= w) yigin.push(i - w);
  if (i < w * (h - 1)) yigin.push(i + w);
}
// Crop to what is left, then soften the cut edge by a pixel so it does not look jagged.
let [x0, y0, x1, y1] = [w, h, 0, 0];
for (let i = 0; i < w * h; i++) if (data[i * 4 + 3]) { const x = i % w, y = (i - x) / w; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
const alfa = await sharp(data, { raw: info }).extractChannel(3).blur(0.6).raw().toBuffer();
for (let i = 0; i < w * h; i++) data[i * 4 + 3] = alfa[i];
await sharp(data, { raw: info }).extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 }).png().toFile(cikis);
console.log(cikis, "zemin", zemin.map(Math.round).join(","));
