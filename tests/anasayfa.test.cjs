// Built homepage: Basiclink summary first, secondary sections last, no totals.
const test = require("node:test");
const assert = require("node:assert/strict");
const { sayfa, metin } = require("./_site.cjs");
const { vitrinPostu } = require("../src/_lib/podyum.js");

const ana = () => sayfa("");
const main = (h) => h.slice(h.indexOf('<main'), h.indexOf('</main>'));

test("the first section of main is a compact Basiclink summary, not the runway", () => {
  const m = main(ana());
  const ilk = m.match(/<section[^>]*>/)[0];
  assert.match(ilk, /id="basiclink"/);
  const ozet = m.slice(m.indexOf(ilk), m.indexOf('id="anaIndirim"'));
  assert.ok(!ozet.includes("data-podyum"), "runway still on the homepage");
  assert.match(ozet, /<h1[^>]*>/);
  assert.ok(ozet.includes('href="/basiclink/"'));
});

test("sections come in the Basiclink-first order", () => {
  const m = main(ana());
  const sira = ["basiclink", "anaIndirim", "anaCikis", "ikinci-plan"].map((id) => m.indexOf(`id="${id}"`));
  assert.ok(sira.every((i) => i >= 0), "missing section: " + sira);
  assert.deepEqual([...sira].sort((a, b) => a - b), sira);
});

test("old hero is gone and the overseas search sits in the secondary area", () => {
  const m = main(ana());
  assert.ok(!m.includes("ana-giris"));
  assert.ok(m.indexOf('id="yurtdisi"') > m.indexOf('id="ikinci-plan"'));
});

test("summary shows the newest Basiclink posts of every kind, without totals", () => {
  const m = main(ana());
  const ozet = m.slice(m.indexOf('id="basiclink"'), m.indexOf('id="anaIndirim"'));
  assert.ok(ozet.includes('href="/basiclink/zara-indiriminden-blazer-kombinleri/"'), "newest outfit missing");
  assert.ok(ozet.includes('href="/basiclink/alinir-mi-casio-mtp-b220/"'), "pick post missing");
  assert.ok(!ozet.includes('href="/kombinlerim/'), "editorial outfits belong on /basiclink/, not the summary");
  assert.equal((ozet.match(/class="ozet-kart"/g) || []).length, 4);
  // Titles are post content (the older hirka title carries a total, kept on purpose); the summary adds no price text of its own.
  assert.doesNotMatch(metin(ozet), /normalde|TL\s*yerine/i);
  assert.ok(!m.includes('id="kombinler"'), "separate outfit grid still on homepage");
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

test("menu has no separate Kombinler link", () => {
  const h = ana();
  assert.ok(!/<a [^>]*href="\/kombinlerim\/"/.test(h), "a /kombinlerim/ link is still on the page");
});
