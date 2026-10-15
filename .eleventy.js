const bolumler = require("./src/_data/bolumler.json");
const ulkeler = require("./src/_data/ulkeler.json");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/admin");
  eleventyConfig.addPassthroughCopy("src/img");
  eleventyConfig.addPassthroughCopy("src/_redirects");
  eleventyConfig.addPassthroughCopy("src/js");
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
    return `<figure class="foto ${sinif}"><img src="${g.src}" width="${g.en}" height="${g.boy}" alt="${kacis(aciklama)}" loading="lazy">` +
      `<figcaption>${aciklama ? kacis(aciklama) + " · " : ""}Foto: <a href="${kacis(g.kaynak)}" rel="nofollow noopener" target="_blank">${kacis(g.yazar)}</a>, ${lisans}</figcaption></figure>`;
  });
  eleventyConfig.addFilter("ulkeBul", (liste, kod) => liste.find((u) => u.kod === kod) || ulkeler[0]);
  eleventyConfig.addFilter("sayi", (n) => Number(n).toLocaleString("tr-TR"));
  eleventyConfig.addFilter("head", (arr, n) => arr.slice(0, n));
  eleventyConfig.addFilter("tarih", (d) =>
    new Date(d).toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" })
  );
  return { dir: { input: "src", output: "_site" }, markdownTemplateEngine: "njk" };
};
