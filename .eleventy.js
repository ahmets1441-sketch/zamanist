const bolumler = require("./src/_data/bolumler.json");
const ulkeler = require("./src/_data/ulkeler.json");

// URL slug with Turkish letters mapped to plain ones (ü -> u, not ue). The same rule is in src/js/indirim.js.
const tslug = (t) => String(t).toLocaleLowerCase("tr").replace(/[çğıöşü]/g, (c) => ({ ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" })[c])
  .normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/admin");
  eleventyConfig.addPassthroughCopy("src/img");
  eleventyConfig.addPassthroughCopy("src/_redirects");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/sw.js");
  // Every article in every section, newest first (feed, related articles, tags).
  eleventyConfig.addCollection("yazilar", (api) =>
    api.getFilteredByGlob(bolumler.map((b) => `src/${b.slug}/*.md`)).sort((x, y) => y.date - x.date)
  );
  for (const b of bolumler) {
    eleventyConfig.addCollection(b.slug, (api) => {
      const yazilar = api.getFilteredByGlob(`src/${b.slug}/*.md`);
      return b.siralama === "isim"
        ? yazilar.sort((x, y) => x.data.title.localeCompare(y.data.title, "tr"))
        : yazilar.sort((x, y) => y.date - x.date);
    });
  }
  // {% foto "slug", "caption" %}: an open-licence photo from src/_data/gorseller.json with its credit.
  const kacis = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  eleventyConfig.addShortcode("foto", function (slug, aciklama = "", sinif = "") {
    const g = this.ctx.gorseller[slug];
    if (!g) throw new Error(`foto: no photo "${slug}" in gorseller.json`);
    const lisans = g.lisansLink ? `<a href="${kacis(g.lisansLink)}" rel="license nofollow noopener" target="_blank">${kacis(g.lisans)}</a>` : kacis(g.lisans);
    const kucuk = g.en > 600 ? ` srcset="${g.src.replace(/\.webp$/, "-600.webp")} 600w, ${g.src} ${g.en}w" sizes="(max-width: 40rem) 100vw, 72rem"` : "";
    return `<figure class="foto ${sinif}"><img src="${g.src}"${kucuk} width="${g.en}" height="${g.boy}" alt="${kacis(aciklama)}" loading="lazy">` +
      `<figcaption>${aciklama ? kacis(aciklama) + " · " : ""}Foto: <a href="${kacis(g.kaynak)}" rel="nofollow noopener" target="_blank">${kacis(g.yazar)}</a>, ${lisans}</figcaption></figure>`;
  });
  eleventyConfig.addFilter("ulkeBul", (liste, kod) => liste.find((u) => u.kod === kod) || ulkeler[0]);
  eleventyConfig.addFilter("sayi", (n) => Number(n).toLocaleString("tr-TR", { minimumFractionDigits: Number.isInteger(Number(n)) ? 0 : 2, maximumFractionDigits: 2 }));
  // About 200 words a minute for Turkish prose.
  eleventyConfig.addFilter("okumaSuresi", (html) => Math.max(1, Math.round(String(html).replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length / 200)));
  eleventyConfig.addFilter("bolumAdi", (url) => (bolumler.find((b) => url.startsWith(`/${b.slug}/`)) || {}).ad);
  eleventyConfig.addFilter("bolumSlug", (url) => (bolumler.find((b) => url.startsWith(`/${b.slug}/`)) || {}).slug);
  // Up to n other articles, those sharing the most tags first, then the same section, then newest.
  eleventyConfig.addFilter("ilgili", (yazilar, sayfa, n = 3) => {
    const etiket = new Set(sayfa.data?.etiketler || []);
    const bolum = sayfa.url.split("/")[1];
    const puan = (y) => (y.data.etiketler || []).filter((e) => etiket.has(e)).length * 2 + (y.url.split("/")[1] === bolum ? 1 : 0);
    return yazilar.filter((y) => y.url !== sayfa.url).map((y) => [puan(y), y]).sort((a, b) => b[0] - a[0] || b[1].date - a[1].date).slice(0, n).map((x) => x[1]);
  });
  eleventyConfig.addCollection("etiketListesi", (api) => {
    const say = new Map();
    for (const y of api.getAll()) for (const e of y.data.etiketler || []) say.set(e, (say.get(e) || 0) + 1);
    return [...say].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "tr")).map(([ad, adet]) => ({ ad, adet }));
  });
  eleventyConfig.addFilter("tslug", tslug);
  // Cards show photos at most ~400px wide: use the 600px copy made by scripts/gorsel-kucult.mjs when there is one.
  const fs = require("node:fs");
  eleventyConfig.addFilter("kucukGorsel", (src) => {
    const k = String(src || "").replace(/\.webp$/, "-600.webp");
    return src && k !== src && fs.existsSync(`src${k}`) ? k : src;
  });
  eleventyConfig.addFilter("yil", () => new Date().getFullYear());
  eleventyConfig.addFilter("head", (arr, n) => arr.slice(0, n));
  eleventyConfig.addFilter("tarih", (d) =>
    new Date(d).toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" })
  );
  // Site search: index the built pages with Pagefind, plus the release and sale lists,
  // whose cards are drawn in the browser and so are not in the HTML.
  eleventyConfig.on("eleventy.after", async ({ dir }) => {
    const { createIndex, close } = await import("pagefind");
    const { index } = await createIndex({ forceLanguage: "tr" });
    await index.addDirectory({ path: dir.output });
    for (const x of require("./src/_data/sinirliSeri.json").cikislar) {
      await index.addCustomRecord({
        url: `/sinirli-seri/#${tslug(x.baslik)}`, language: "tr",
        content: [x.baslik, x.marka, x.referans, x.ozellik, x.not, ...(x.modeller || [])].filter(Boolean).join(". "),
        meta: { title: x.baslik, image: x.gorsel || ""  },
      });
    }
    for (const x of require("./src/_data/indirimler.json").indirimler) {
      await index.addCustomRecord({
        url: `/indirimler/#${tslug(x.baslik)}`, language: "tr",
        content: [x.baslik, x.markalar.join(", "), x.oran, x.not].filter(Boolean).join(". "),
        meta: { title: x.baslik },
      });
    }
    await index.writeFiles({ outputPath: `${dir.output}/pagefind` });
    await close();
  });
  return { dir: { input: "src", output: "_site" }, markdownTemplateEngine: "njk" };
};
