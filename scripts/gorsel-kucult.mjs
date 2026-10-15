// Writes a 600px-wide copy (name-600.webp) next to every photo in src/img/foto and src/img/cikis,
// used for phones and cards via srcset. Run after adding photos: node scripts/gorsel-kucult.mjs
import sharp from "sharp";
import fs from "node:fs";
for (const klasor of ["src/img/foto", "src/img/cikis"]) {
  for (const f of fs.readdirSync(klasor)) {
    if (!f.endsWith(".webp") || f.endsWith("-600.webp")) continue;
    const hedef = `${klasor}/${f.replace(/\.webp$/, "-600.webp")}`;
    if (fs.existsSync(hedef)) continue;
    const b = await sharp(`${klasor}/${f}`).resize({ width: 600, withoutEnlargement: true }).webp({ quality: 78 }).toFile(hedef);
    console.log(hedef, Math.round(b.size / 1024) + "KB");
  }
}
