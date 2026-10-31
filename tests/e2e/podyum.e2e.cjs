// Browser check of the runway. Not part of npm test (needs Chromium):
//   NODE_PATH=~/zamanist-insta/araclar/node_modules node tests/e2e/podyum.e2e.cjs [path ...]
// Serves _site on :8811 unless BASE_URL is set (e.g. the preview). Prints "e2e ok" or throws.
const { chromium } = require("playwright-core");
const http = require("node:http"), fs = require("node:fs"), path = require("node:path"), assert = require("node:assert/strict");

const SITE = path.join(__dirname, "..", "..", "_site");
const TUR = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".webp": "image/webp", ".png": "image/png", ".svg": "image/svg+xml", ".json": "application/json" };
const yollar = process.argv.slice(2).length ? process.argv.slice(2) : ["/basiclink/zara-indiriminden-blazer-kombinleri/"];

(async () => {
  let sunucu, BASE = process.env.BASE_URL;
  if (!BASE) {
    sunucu = http.createServer((q, r) => {
      let f = path.join(SITE, decodeURIComponent(q.url.split("?")[0]));
      if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
      if (!fs.existsSync(f)) { r.statusCode = 404; return r.end(); }
      r.setHeader("content-type", TUR[path.extname(f)] || "application/octet-stream");
      fs.createReadStream(f).pipe(r);
    }).listen(8811);
    BASE = "http://localhost:8811";
  }
  const tarayici = await chromium.launch({ executablePath: process.env.CHROME || path.join(process.env.HOME, ".cache/ms-playwright/chromium-1140/chrome-linux/chrome") });
  try {
    for (const yol of yollar) for (const [w, h] of [[390, 844], [1280, 900]]) {
      const p = await tarayici.newPage({ viewport: { width: w, height: h } });
      const hatalar = [];
      p.on("pageerror", (e) => hatalar.push(String(e)));
      p.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && hatalar.push(m.text()));
      await p.goto(BASE + yol, { waitUntil: "networkidle" });
      const kok = p.locator("[data-podyum]").first();
      await kok.waitFor();
      assert.ok(await kok.evaluate((e) => e.classList.contains("hazir")), "runway not initialised");
      const sonraki = kok.locator(".podyum-sonraki");
      if (await sonraki.count()) {
        await sonraki.click();
        await p.waitForTimeout(700);
        assert.equal(await kok.locator(".podyum-look.aktif").getAttribute("data-index"), "1", `${yol} ${w}: arrow did not move`);
      }
      const pin = kok.locator(".podyum-look.aktif .podyum-pin").first();
      if (await pin.count()) {
        await pin.click();
        assert.equal(await pin.getAttribute("aria-expanded"), "true");
        const kart = p.locator("#" + (await pin.getAttribute("aria-controls")));
        assert.ok(await kart.isVisible(), "pin card not visible");
        await p.keyboard.press("Escape");
        assert.ok(!(await kart.isVisible()), "Esc did not close the card");
      }
      // Keyboard: Esc inside an open card returns focus to its pin.
      const pin2 = kok.locator(".podyum-look.aktif .podyum-pin").first();
      if (await pin2.count()) {
        await pin2.focus();
        await p.keyboard.press("Enter");
        await p.locator("#" + (await pin2.getAttribute("aria-controls")) + " .podyum-git").focus();
        await p.keyboard.press("Escape");
        assert.ok(await pin2.evaluate((e) => e === document.activeElement), `${yol} ${w}: Esc lost focus`);
      }
      if (w >= 1000) {
        // Desktop: the runway fills the height of the product list beside it, no empty gap under the looks.
        const bosluk = await kok.evaluate((k) => k.querySelector(".podyum-liste").getBoundingClientRect().bottom - k.querySelector(".podyum-sahne").getBoundingClientRect().bottom);
        assert.ok(Math.abs(bosluk) < 40, `${yol} ${w}: runway and list bottoms differ by ${Math.round(bosluk)}px`);
        // The list is never a scroll box: the runway grows instead.
        assert.ok(await kok.evaluate((k) => { const l = k.querySelector(".podyum-liste"); return l.scrollHeight <= l.clientHeight + 1; }), `${yol} ${w}: product list scrolls`);
        // The "Kombin sayfasını aç" button stays visible even when the list scrolls.
        const cta = kok.locator(".podyum-sayfa");
        if (await cta.count()) assert.ok(await cta.evaluate((a) => { const r = a.getBoundingClientRect(), l = a.closest(".podyum-liste").getBoundingClientRect(); return r.bottom <= l.bottom + 1 && r.top >= l.top; }), `${yol} ${w}: page button hidden in the list`);
      }
      const tasma = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      assert.ok(tasma <= 0, `${yol} ${w}: horizontal overflow ${tasma}px`);
      assert.deepEqual(hatalar, [], `${yol} ${w}: console errors`);
      await p.screenshot({ path: path.join(SITE, "..", ".superpowers", `e2e-${w}-${yol.replace(/\W+/g, "_")}.png`) });
      await p.close();
      const az = await tarayici.newPage({ viewport: { width: w, height: h }, reducedMotion: "reduce" });
      await az.goto(BASE + yol, { waitUntil: "networkidle" });
      const sure = await az.locator("[data-podyum] .podyum-look").first().evaluate((e) => getComputedStyle(e).transitionDuration);
      assert.ok(sure.split(",").every((s) => parseFloat(s) === 0), `${yol}: transitions under reduced motion: ${sure}`);
      await az.close();
      // Dark mode: the list's link button must stand out from the card.
      const koyu = await tarayici.newPage({ viewport: { width: w, height: h }, colorScheme: "dark" });
      await koyu.goto(BASE + yol, { waitUntil: "networkidle" });
      const [btn, kart] = await koyu.locator("[data-podyum] .podyum-liste").first().evaluate((l) =>
        [getComputedStyle(l.querySelector(".podyum-git")).backgroundColor, getComputedStyle(l).backgroundColor]);
      assert.notEqual(btn, kart, `${yol}: dark mode button blends into card`);
      assert.doesNotMatch(btn, /rgb\((1[0-9]|2[0-9]|3[0-9]), \1, \1\)|rgb\(17, 17, 17\)/, `${yol}: dark mode button is near-black ${btn}`);
      await koyu.close();
      // No JS: pins would do nothing, so they are not shown; every link is still there.
      const jsYok = await tarayici.newPage({ viewport: { width: w, height: h }, javaScriptEnabled: false });
      await jsYok.goto(BASE + yol, { waitUntil: "networkidle" });
      const gorunurPin = await jsYok.locator(".podyum-pin:visible").count();
      assert.equal(gorunurPin, 0, `${yol} ${w}: ${gorunurPin} pins visible without JS`);
      assert.ok(await jsYok.locator(".podyum-liste .podyum-git").count() > 0);
      await jsYok.close();
    }
    console.log("e2e ok");
  } finally {
    await tarayici.close();
    sunucu?.close();
  }
})().catch((e) => { console.error(e.message); process.exit(1); });
