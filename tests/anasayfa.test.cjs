// Built homepage: Basiclink showcase first, secondary sections last, no totals.
const test = require("node:test");
const assert = require("node:assert/strict");
const { sayfa, metin } = require("./_site.cjs");
const { vitrinPostu } = require("../src/_lib/podyum.js");

const ana = () => sayfa("");
const main = (h) => h.slice(h.indexOf('<main'), h.indexOf('</main>'));

test("the first section of main is the Basiclink showcase with a runway", () => {
  const m = main(ana());
  const ilk = m.match(/<section[^>]*>/)[0];
  assert.match(ilk, /id="basiclink"/);
  const govde = m.slice(m.indexOf(ilk), m.indexOf('id="kombinler"'));
  assert.ok(govde.includes("data-podyum"));
});

test("sections come in the Basiclink-first order", () => {
  const m = main(ana());
  const sira = ["basiclink", "kombinler", "anaIndirim", "anaCikis", "ikinci-plan"].map((id) => m.indexOf(`id="${id}"`));
  assert.ok(sira.every((i) => i >= 0), "missing section: " + sira);
  assert.deepEqual([...sira].sort((a, b) => a - b), sira);
});

test("old hero is gone and the overseas search sits in the secondary area", () => {
  const m = main(ana());
  assert.ok(!m.includes("ana-giris"));
  assert.ok(m.indexOf('id="yurtdisi"') > m.indexOf('id="ikinci-plan"'));
});

test("showcase links to its outfit page and shows no totals", () => {
  const h = ana();
  assert.match(h, /<a class="podyum-sayfa" href="\/basiclink\/zara-indiriminden-blazer-kombinleri\/">/);
  // The showcase itself; older post titles in the grid are existing content (see ledger, Task 4).
  const m = main(h);
  assert.doesNotMatch(metin(m.slice(m.indexOf('id="basiclink"'), m.indexOf('id="kombinler"'))), /toplam|normalde/i);
});

test("basiclink is the first menu link", () => {
  const h = ana();
  const nav = h.slice(h.indexOf("<nav"), h.indexOf("</nav>"));
  assert.match(nav.match(/<a [^>]*>/)[0], /class="menu-basiclink"/);
});

test("vitrinPostu prefers a post with looks over a newer one without", () => {
  const eski = { date: new Date("2026-10-01"), data: { tags: ["kombinlerim"], looklar: [{}] } };
  const yeni = { date: new Date("2026-10-20"), data: { tags: ["kombinlerim"] } };
  const diger = { date: new Date("2026-10-30"), data: { tags: [] } };
  assert.equal(vitrinPostu([eski, yeni, diger]), eski);
  assert.equal(vitrinPostu([yeni, diger]), yeni);
  assert.equal(vitrinPostu([diger]), null);
});

test("outfits live in one place on the homepage", () => {
  const m = main(ana());
  const blok = m.slice(m.indexOf('id="kombinler"'), m.indexOf('id="anaIndirim"'));
  assert.ok(blok.includes('href="/kombinlerim/lacivert-blazer-polo/"'), "editorial outfit missing from Tüm kombinler");
  assert.ok(blok.includes('href="/basiclink/pazar-kahvesi-kombini/"'), "Instagram outfit missing from Tüm kombinler");
  assert.ok(!m.includes('id="kombinlerim"'), "separate Kombinlerim section still on homepage");
});

test("menu has no separate Kombinler link", () => {
  const h = ana();
  assert.ok(!/<a [^>]*href="\/kombinlerim\/"/.test(h), "a /kombinlerim/ link is still on the page");
});
