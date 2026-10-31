// /basiclink/ is the single home for outfits; /kombinlerim/ forwards to it.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { sayfa, kok } = require("./_site.cjs");

test("/basiclink/ lists Instagram outfits, editorial outfits and a separate picks group", () => {
  const h = sayfa("basiclink");
  const ayrim = h.indexOf('id="secki"');
  assert.ok(ayrim > 0, "no picks group");
  const kombin = h.slice(0, ayrim), secki = h.slice(ayrim);
  for (const u of ["/basiclink/zara-indiriminden-blazer-kombinleri/", "/basiclink/pazar-kahvesi-kombini/", "/kombinlerim/lacivert-blazer-polo/"])
    assert.ok(kombin.includes(`href="${u}"`), "missing outfit " + u);
  assert.ok(secki.includes('href="/basiclink/alinir-mi-casio-mtp-b220/"'));
  assert.ok(!kombin.includes('href="/basiclink/alinir-mi-casio-mtp-b220/"'), "non-outfit listed with outfits");
});

test("/kombinlerim/ forwards to /basiclink/ and articles keep their URLs", () => {
  assert.match(sayfa("kombinlerim"), /http-equiv="refresh" content="0; url=\/basiclink\/"/);
  assert.match(fs.readFileSync(path.join(kok, "src/_redirects"), "utf8"), /^\/kombinlerim\/? \/basiclink\/ 301$/m);
  assert.ok(sayfa("kombinlerim/lacivert-blazer-polo").includes("<h1"));
});
