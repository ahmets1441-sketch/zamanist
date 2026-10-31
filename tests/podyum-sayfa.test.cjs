// Built outfit pages: runway markup, links reachable without JS, no totals.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { sayfa, say, metin, podyumBolumu, kok } = require("./_site.cjs");

const ZARA = "basiclink/zara-indiriminden-blazer-kombinleri";

test("zara page renders 4 looks and 8 pins", () => {
  const h = sayfa(ZARA);
  assert.equal(say(h, /<li class="podyum-look[ "]/g), 4);
  assert.equal(say(h, /<button[^>]*class="podyum-pin[ "]/g), 8);
});

test("every product link of the zara post is inside the runway (works without JS)", () => {
  const md = fs.readFileSync(path.join(kok, "src", ZARA + ".md"), "utf8");
  const linkler = [...md.matchAll(/^\s+link: (\S+)$/gm)].map((m) => m[1].replace(/&/g, "&amp;"));
  assert.ok(linkler.length >= 13);
  const p = podyumBolumu(sayfa(ZARA));
  for (const l of linkler) assert.ok(p.includes(`href="${l}"`), "missing " + l);
});

test("zara page shows no totals", () => {
  assert.doesNotMatch(metin(sayfa(ZARA)), /toplam|normalde/i);
});

test("older outfit post uses the runway with its slides and no pins", () => {
  const h = sayfa("basiclink/kahverengi-hirka-kombini");
  assert.equal(say(h, /<li class="podyum-look[ "]/g), 3);
  assert.equal(say(h, /<button[^>]*class="podyum-pin[ "]/g), 0);
  const p = podyumBolumu(h);
  const md = fs.readFileSync(path.join(kok, "src/basiclink/kahverengi-hirka-kombini.md"), "utf8");
  for (const [, l] of md.matchAll(/^\s+link: (\S+)$/gm)) assert.ok(p.includes(`href="${l}"`), "missing " + l);
});

test("non-outfit posts keep the old layout", () => {
  for (const s of ["alinir-mi-casio-mtp-b220", "sonbahar-botlari"]) {
    const h = sayfa("basiclink/" + s);
    assert.ok(!h.includes("data-podyum"), s + " has a runway");
    assert.ok(h.includes("insta-slaytlar"), s + " lost its slides");
  }
});

test("a single look has no arrows or progress", () => {
  const nunjucks = require("nunjucks");
  const { podyumLooklari } = require("../src/_lib/podyum.js");
  const env = new nunjucks.Environment(new nunjucks.FileSystemLoader(path.join(kok, "src/_includes")));
  env.addFilter("sayi", (n) => String(n));
  const looks = podyumLooklari({ tags: ["kombinlerim"], slaytlar: 1, urunler: [], page: { fileSlug: "x" } });
  const h = env.render("podyum.njk", { looks, baslik: "Tek", sayfaLinki: "" });
  assert.equal(say(h, /<li class="podyum-look[ "]/g), 1);
  assert.ok(!h.includes("podyum-onceki") && !h.includes("podyum-ilerleme"));
});
