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
  eleventyConfig.addFilter("ulkeBul", (liste, kod) => liste.find((u) => u.kod === kod) || ulkeler[0]);
  eleventyConfig.addFilter("sayi", (n) => Number(n).toLocaleString("tr-TR"));
  eleventyConfig.addFilter("head", (arr, n) => arr.slice(0, n));
  eleventyConfig.addFilter("tarih", (d) =>
    new Date(d).toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" })
  );
  return { dir: { input: "src", output: "_site" }, markdownTemplateEngine: "njk" };
};
