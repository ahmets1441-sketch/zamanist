// Builds the site once per test process and reads pages from _site.
const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const kok = path.join(__dirname, "..");
let kuruldu = false;
const sayfa = (url) => {
  if (!kuruldu) {
    execSync("npx @11ty/eleventy --quiet", { cwd: kok, stdio: "pipe" });
    kuruldu = true;
  }
  return fs.readFileSync(path.join(kok, "_site", url, "index.html"), "utf8");
};
const say = (html, re) => (html.match(re) || []).length;
// Visible text only: drop scripts, styles and tags.
const metin = (html) => html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ");
const podyumBolumu = (html) => {
  const i = html.indexOf('data-podyum');
  if (i < 0) return "";
  const bas = html.lastIndexOf("<section", i);
  return html.slice(bas, html.indexOf("</section>", i) + 10);
};

module.exports = { sayfa, say, metin, podyumBolumu, kok };
