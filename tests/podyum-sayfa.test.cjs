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
