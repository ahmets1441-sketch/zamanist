// Unit tests for the runway look data in src/_lib/podyum.js.
const test = require("node:test");
const assert = require("node:assert/strict");
const { lookUrunleri, pinler, podyumLooklari } = require("../src/_lib/podyum.js");

const urunler = [
  { kod: "4456/999/802", ad: "Blazer" },
  { kod: "4457/999/802", ad: "Pantolon" },
  { kod: "2893/319/800", ad: "Kazak" },
  { kod: "2000/822/800", ad: "Bot" },
];
const gri = {
  ad: "Gri",
  gorsel: "/img/x.webp",
  urunler: ["4456/999/802", "4457/999/802", "2893/319/800", "2000/822/800"],
  pinler: [{ kod: "4456/999/802", x: 58, y: 40 }, { kod: "4457/999/802", x: 44, y: 78 }],
};

test("lookUrunleri returns products in look order", () => {
  const r = lookUrunleri({ ...gri, urunler: ["2000/822/800", "4456/999/802"] }, urunler, "zara");
  assert.deepEqual(r.map((u) => u.ad), ["Bot", "Blazer"]);
  assert.equal(lookUrunleri(gri, urunler, "zara").length, 4);
});

test("lookUrunleri throws on an unknown kod", () => {
  assert.throws(() => lookUrunleri({ ...gri, urunler: ["9999/999/999"] }, urunler, "zara"), /zara.*Gri.*unknown kod 9999\/999\/999/);
});

test("pinler resolves products and rejects bad pins", () => {
  const p = pinler(gri, urunler, "zara");
  assert.equal(p.length, 2);
  assert.equal(p[0].urun.ad, "Blazer");
  assert.equal(p[1].y, 78);
  assert.throws(() => pinler({ ...gri, pinler: [{ kod: "4456/999/802", x: 120, y: 40 }] }, urunler, "zara"), /0.100/);
  assert.throws(() => pinler({ ...gri, urunler: ["4456/999/802"], pinler: [{ kod: "4457/999/802", x: 1, y: 1 }] }, urunler, "zara"), /not in look/);
});

test("podyumLooklari resolves looklar", () => {
  const r = podyumLooklari({ looklar: [gri], urunler, tags: ["kombinlerim"], page: { fileSlug: "zara" } });
  assert.equal(r.length, 1);
  assert.equal(r[0].slayt, false);
  assert.equal(r[0].urunler.length, 4);
  assert.equal(r[0].pinler.length, 2);
});

test("podyumLooklari falls back to slides for outfit posts", () => {
  const r = podyumLooklari({ tags: ["kombinlerim"], slaytlar: 3, urunler, page: { fileSlug: "kahverengi-hirka-kombini" } });
  assert.equal(r.length, 3);
  assert.ok(r.every((l) => l.slayt === true && l.pinler.length === 0 && l.urunler.length === 4));
  assert.equal(r[1].gorsel, "/img/insta/kahverengi-hirka-kombini/2.webp");
});

test("podyumLooklari returns nothing for non-outfit posts", () => {
  assert.deepEqual(podyumLooklari({ tags: [], slaytlar: 2, urunler, page: { fileSlug: "x" } }), []);
  assert.deepEqual(podyumLooklari({ slaytlar: 2, page: { fileSlug: "x" } }), []);
});
