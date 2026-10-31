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
    }
    console.log("e2e ok");
  } finally {
    await tarayici.close();
    sunucu?.close();
  }
})().catch((e) => { console.error(e.message); process.exit(1); });
