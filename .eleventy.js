const bolumler = require("./src/_data/bolumler.json");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/admin");
  eleventyConfig.addPassthroughCopy("src/img");
  eleventyConfig.addPassthroughCopy("src/_redirects");
  for (const b of bolumler) {
    eleventyConfig.addCollection(b.slug, (api) => {
      const yazilar = api.getFilteredByGlob(`src/${b.slug}/*.md`);
      return b.siralama === "isim"
        ? yazilar.sort((x, y) => x.data.title.localeCompare(y.data.title, "tr"))
        : yazilar.sort((x, y) => y.date - x.date);
    });
  }
  eleventyConfig.addFilter("head", (arr, n) => arr.slice(0, n));
  eleventyConfig.addFilter("tarih", (d) =>
    new Date(d).toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" })
  );
  return { dir: { input: "src", output: "_site" }, markdownTemplateEngine: "njk" };
};
