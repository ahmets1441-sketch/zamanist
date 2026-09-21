module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addCollection("haberler", (api) =>
    api.getFilteredByGlob("src/haberler/*.md").sort((a, b) => b.date - a.date)
  );
  eleventyConfig.addCollection("biyografiler", (api) =>
    api.getFilteredByGlob("src/biyografiler/*.md").sort((a, b) => a.data.title.localeCompare(b.data.title, "tr"))
  );
  eleventyConfig.addFilter("head", (arr, n) => arr.slice(0, n));
  eleventyConfig.addFilter("tarih", (d) =>
    new Date(d).toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" })
  );
  return { dir: { input: "src", output: "_site" }, markdownTemplateEngine: "njk" };
};
