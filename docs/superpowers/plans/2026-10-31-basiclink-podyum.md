# Basiclink podyum Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Basiclink the first screen of zamanist.com and turn outfit pages into an interactive runway (looks, pins, "Bu kombinde" list), on the `yeni-duzen` preview.

**Architecture:**
- **Data.** Per-look data lives in each post's front matter (`looklar`). A small CommonJS module, `src/_lib/podyum.js`, validates and resolves it, and is exposed as Eleventy filters.
- **Markup.** One Nunjucks include, `src/_includes/podyum.njk`, renders the runway for both the outfit page and the homepage showcase. The runway is a native horizontal scroll-snap strip, so it works without JS.
- **Behaviour.** `src/js/podyum.js` adds the active-look state, arrows, pins and progress.
- **Styling.** `src/css/podyum.css` holds the styles and transitions, with a `prefers-reduced-motion` fallback.

**Tech Stack:** Eleventy 3 (CommonJS config `eleventy.config.js`), Nunjucks, plain CSS and vanilla JS. Tests use `node:test` (built in, no new dependency) against the built `_site/`. Browser checks use `playwright-core` from `~/zamanist-insta/araclar` (outside the repo) with the cached Chromium at `~/.cache/ms-playwright/chromium-1140/chrome-linux/chrome`.

**Spec:** `docs/superpowers/specs/2026-10-31-basiclink-podyum-design.md`

## Global Constraints

- No total outfit price anywhere. Page text must not contain "Toplam", "toplam" or "normalde". Prices appear only next to their item.
- Existing `/basiclink/<slug>/` URLs must keep working, with the same permalinks.
- Pins only go on pieces the look photo shows. For the Zara post, that means the blazer and the trousers.
- Touch targets ≥ 44 px. Text over photos needs a solid or near-solid backing.
- Animations use CSS transitions only, and are disabled under `@media (prefers-reduced-motion: reduce)`.
- Brand: `#111` dark, `#CFA65A` gold, Playfair Display headings, Inter body. Reuse `style.css` variables where they exist (`--fg`, `--muted`, `--line`, `--kart`).
- Work on `yeni-duzen` only. Never push to `main`; production needs the owner's approval.
- Git identity: `-c user.name=ahmets1441-sketch -c user.email=ahmets1441-sketch@users.noreply.github.com`. Push: `git -c credential.helper= -c credential.helper='!/home/ahmet/bin/gh auth git-credential' push origin yeni-duzen`.
- Visual reference: the mockup at https://claude.ai/artifact/38iTaBRw8HKQi16avtqMUq (desktop and phone artboards).

## Review Focus

1. A look lists a `kod` that is not in `urunler`, or a pin's `x`/`y` falls outside 0–100. The build must fail with a message naming the post and the code, not silently render an empty card. Task 1 tests this.
2. JS is blocked or fails, as can happen in the Instagram in-app browser. Every look photo and every "Ürüne git" link must still be in the HTML and reachable by scrolling. Task 3 tests this.
3. Long product names in the pin card at 390 px width must wrap, and the page must have no horizontal overflow. Task 3's browser check covers this.
4. With `prefers-reduced-motion: reduce`, there must be no transition durations above 0 on runway elements. Task 3's browser check covers this.
5. A post with exactly one look shows no arrows and no progress bar. Task 4 tests this by rendering `podyum.njk` directly with a one-look input, so no test post enters the site.

---

### Task 1: Look data model, validation and the test harness

**Files:**
- Create: `src/_lib/podyum.js`
- Create: `tests/podyum-veri.test.cjs`
- Modify: `eleventy.config.js` (register filters)
- Modify: `package.json` (add `"test": "node --test tests/"`)
- Modify: `src/basiclink/zara-indiriminden-blazer-kombinleri.md` (add `looklar`)

**Interfaces:**
- Produces: `lookUrunleri(look, urunler, slug) -> Array<urun>`. It returns `urunler` entries in the order of `look.urunler` (a list of `kod` strings). It throws `Error("podyum: <slug> look \"<ad>\" has unknown kod <kod>")` on a miss.
- Produces: `pinler(look, urunler, slug) -> Array<{x:number, y:number, urun}>`. It throws on an unknown `kod`, on `x`/`y` that are not numbers in 0–100, and on a pin whose `kod` is not in `look.urunler`.
- Produces: `podyumLooklari(data) -> Array<{ad, gorsel, urunler, pinler, slayt:boolean}>`. When `data.looklar` exists, it returns resolved looks. Otherwise, for posts tagged `kombinlerim`, it returns one look per slide: `ad: ""`, `gorsel: /img/insta/<slug>/<n>.webp`, `urunler: data.urunler`, `pinler: []`, `slayt: true`. Otherwise it returns `[]`. `data.page.fileSlug` gives the slug.
- Filters registered with the same names: `lookUrunleri`, `pinler`, `podyumLooklari`.
- Front-matter shape (document it in a header comment of `src/_lib/podyum.js`):

```yaml
looklar:
  - ad: Gri
    gorsel: /img/insta/zara-indiriminden-blazer-kombinleri/look-gri.webp
    urunler: ["4456/999/802", "4457/999/802", "2893/319/800", "2000/822/800"]
    pinler:
      - { kod: "4456/999/802", x: 58, y: 40 }
      - { kod: "4457/999/802", x: 44, y: 78 }
```

- [ ] **Step 1: Write failing tests** in `tests/podyum-veri.test.cjs`:
  - `lookUrunleri` returns 4 products in look order for the Gri look.
  - `lookUrunleri` throws with a message containing `unknown kod 9999/999/999`.
  - `pinler` throws for `x: 120` and for a pin `kod` not in `look.urunler`.
  - `podyumLooklari` on `{tags:["kombinlerim"], slaytlar:3, urunler:[…], page:{fileSlug:"kahverengi-hirka-kombini"}}` returns 3 looks with `slayt === true` and `gorsel === "/img/insta/kahverengi-hirka-kombini/2.webp"` for index 1.
  - `podyumLooklari` returns `[]` for `{tags:[], slaytlar:2}`.
- [ ] **Step 2:** Run `npm test`. Expected: FAIL, with "Cannot find module '../src/_lib/podyum.js'".
- [ ] **Step 3:** Implement the three functions in `src/_lib/podyum.js` (`module.exports = { lookUrunleri, pinler, podyumLooklari }`) and register them as filters in `eleventy.config.js`.
- [ ] **Step 4:** Add the `looklar` block for all four Zara looks, using the table in the spec's "Answers from the review". Pins go on the blazer and the trousers only. Use `x: 58, y: 40` and `x: 44, y: 78` as starting values; Task 2 adjusts them to the cut-outs. Set `gorsel` to `/img/insta/zara-indiriminden-blazer-kombinleri/look-<gri|kum|kahve|yesil>.webp`.
- [ ] **Step 5:** Run `npm test && npx @11ty/eleventy --quiet`. Expected: all tests pass and the build succeeds.
- [ ] **Step 6:** Commit: "Add runway look data model and validation".

### Task 2: Look cut-outs

**Files:**
- Create: `~/zamanist-insta/araclar/dekupe.mjs` (outside the repo, not committed)
- Create: `src/img/insta/zara-indiriminden-blazer-kombinleri/look-{gri,kum,kahve,yesil}.webp`
- Modify: the Zara post `pinler` values, if the cut-out framing moves the garments

**Interfaces:**
- Consumes: the source photos `~/zamanist-insta/zara-takim/img/look-*.jpg`.
- Produces: transparent-background webp files, max 900 px tall, about 4:5, with the model centred and feet near the bottom. These are referenced by Task 1's `gorsel` paths.

- [ ] **Step 1:** Install `@imgly/background-removal-node` in `~/zamanist-insta/araclar`. This is free, local and downloads its own model. Write `dekupe.mjs <in.jpg> <out.webp>`: remove the background, trim, fit into 720×900 with transparent padding, and save as webp at quality 85.
- [ ] **Step 2:** Run the script on the four photos.
- [ ] **Step 3:** Check each output by viewing it. Expected: the model is intact (hair, hands, shoes), there are no wall remnants, and each file is under 150 KB.
- [ ] **Step 4:** Adjust the pin `x`/`y` so they sit on the blazer chest and the trouser thigh in each cut-out. Re-run `npm test`.
- [ ] **Step 5:** Commit: "Add background-removed Zara look images".

### Task 3: Runway include, script and styles on outfit pages with looks

**Files:**
- Create: `src/_includes/podyum.njk`
- Create: `src/js/podyum.js`
- Create: `src/css/podyum.css`
- Modify: `src/_includes/insta-post.njk` (branch: when `podyumLooklari` returns looks with `slayt == false`, render the runway; otherwise keep the current markup for now)
- Create: `tests/podyum-sayfa.test.cjs`
- Create: `tests/e2e/podyum.e2e.cjs` (run manually with `NODE_PATH=~/zamanist-insta/araclar/node_modules node tests/e2e/podyum.e2e.cjs`; it serves `_site` on port 8811)

**Interfaces:**
- Consumes: the `podyumLooklari`, `lookUrunleri` and `pinler` filters from Task 1.
- Produces: `{% include "podyum.njk" %}`, which expects the variables `looks` (from `podyumLooklari`), `baslik` (string) and `sayfaLinki` (string or null; when set, it renders a "Kombin sayfasını aç" link).
- Markup contract that later tasks and tests rely on:
  - root `section.podyum[data-podyum]`
  - `ol.podyum-serit` (scroll-snap) holding `li.podyum-look` with `data-index`
  - `button.podyum-pin[aria-expanded][aria-controls]` per pin, controlling `div.podyum-kart[hidden]`, which contains `a.podyum-git[href]`
  - `div.podyum-liste` holding `ul[data-look=<index>]` per look; inactive lists are `hidden` only after JS runs
  - `button.podyum-onceki` and `button.podyum-sonraki`, plus `div.podyum-ilerleme`; all omitted when there is only one look
- Behaviour in `podyum.js`:
  - Arrows and scroll update the active index. Use an `IntersectionObserver` with a threshold of 0.6 on `.podyum-look`.
  - The active look gets `.aktif`. Only the active look's pins are focusable.
  - A pin toggles its card. Esc and clicks outside close it.
  - The "Bu kombinde" list shows the active look's products.
  - `podyum.css` is linked from `insta-post.njk` and `index.njk` only, not from `base.njk`.

- [ ] **Step 1: Write failing build tests** in `tests/podyum-sayfa.test.cjs`. Each test reads `_site/basiclink/zara-indiriminden-blazer-kombinleri/index.html` after a build:
  - It has exactly 4 `li.podyum-look` and 8 `button.podyum-pin`.
  - Every `urunler[].link` of the post appears as an `href` inside `.podyum` (this covers the no-JS case).
  - The page text has no match for `/toplam|normalde/i`.
- [ ] **Step 2:** Run `npm test`. Expected: FAIL (0 `podyum-look`).
- [ ] **Step 3:** Implement `podyum.njk` and the branch in `insta-post.njk`.
  - Desktop layout follows the mockup: the runway on the left, the "Bu kombinde" panel on the right.
  - The phone layout stacks them: a full-width strip with about 78% card width so the next look peeks in, then the list.
- [ ] **Step 4:** Implement `podyum.css`.
  - Inactive looks: `opacity .5; transform: scale(.9)`. Transition 450 ms `cubic-bezier(.2,.8,.2,1)`.
  - Pin card: fade and slide in over 200 ms.
  - Reduced-motion block: `transition: none`.
- [ ] **Step 5:** Implement `podyum.js` (wrap it in an IIFE and init every `[data-podyum]`).
- [ ] **Step 6:** Run `npm test`. Expected: PASS.
- [ ] **Step 7: Write and run** `tests/e2e/podyum.e2e.cjs` at a 390×844 viewport and at 1280×900. It asserts that:
  - clicking `.podyum-sonraki` moves `.aktif` to `data-index="1"`
  - clicking the first visible pin sets `aria-expanded="true"` and makes its `.podyum-kart` visible
  - pressing Esc hides the card
  - `document.documentElement.scrollWidth <= innerWidth`
  - with `reducedMotion: 'reduce'`, `getComputedStyle(look).transitionDuration === '0s'`
  - the console has no errors

  Expected: it prints `e2e ok`.
- [ ] **Step 8:** Commit: "Render outfit pages as an interactive runway".

### Task 4: Slide fallback for older outfit posts, old layout for non-outfits

**Files:**
- Modify: `src/_includes/insta-post.njk` (looks with `slayt == true` also render `podyum.njk`, with no pins and an empty-title chip; posts with no looks keep the current markup)
- Modify: `src/_includes/podyum.njk` (with one look: no arrows and no progress)
- Modify: `tests/podyum-sayfa.test.cjs`

**Interfaces:**
- Consumes: `podyumLooklari`, which returns `slayt: true` looks (Task 1).

- [ ] **Step 1: Write failing tests:**
  - `kahverengi-hirka-kombini` has 3 `li.podyum-look`, 0 `button.podyum-pin`, and all 3 of its product links inside `.podyum`.
  - `alinir-mi-casio-mtp-b220` has no `.podyum` and still has `.insta-slaytlar`.
  - `sonbahar-botlari` has no `.podyum`.
  - Calling `podyumLooklari({tags:["kombinlerim"], slaytlar:1, urunler:[], page:{fileSlug:"x"}})` and rendering `podyum.njk` with it gives markup without `.podyum-onceki`. Render with a Nunjucks `Environment` pointed at `src/_includes`, so no temp post is needed.
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement the branch and the single-look case.
- [ ] **Step 4:** Run `npm test` and the e2e script against `kahverengi-hirka-kombini` (add the URL to its page list). Expected: PASS and `e2e ok`.
- [ ] **Step 5:** Commit: "Use runway with slide fallback for older outfit posts".

### Task 5: Basiclink-first homepage

**Files:**
- Modify: `src/index.njk`
- Modify: `src/css/style.css` (secondary-section sizing, scroll reveal)
- Modify: `src/js/site.js` (reveal observer)
- Create: `tests/anasayfa.test.cjs`

**Interfaces:**
- Consumes: `podyum.njk` with `sayfaLinki` set to the post URL. The `vitrinPostu` filter is defined here, in `src/_lib/podyum.js`: `vitrinPostu(basiclinkCollection) -> post`, the newest post with `data.looklar`, else the newest post tagged `kombinlerim`, else `null`.

New homepage order, top to bottom. The outer element IDs are fixed:
1. `section#basiclink`: a small kicker line ("Doğru parça, doğru fiyat"), the showcase heading (the post title), then the runway with `sayfaLinki`.
2. `section#onceki-kombinler`: the next 4 `collections.basiclink` posts as `.insta-izgara` cover cards, excluding the showcase post.
3. `#anaIndirim`, then `#anaCikis`. Move the existing blocks unchanged.
4. `section#ikinci-plan`, containing:
   - the yurt dışı search as a compact dark band. Keep `id="yurtdisi"` on it and drop the big SVG illustration.
   - the `bolumler` loop sections.

Remove `header.ana-giris`. The quick links move into `#ikinci-plan` as a small nav.

Scroll reveal: sections below the first get `.goster`. An `IntersectionObserver` in `site.js` adds `.gorundu`. CSS: `opacity 0 → 1, translateY(16px) → 0` over 500 ms. Content stays visible when JS is off: the hidden state only applies under `html.js .goster:not(.gorundu)`, and `html.js` is set by the existing inline script in `base.njk`, or added there if it is missing. Disabled under reduced motion.

- [ ] **Step 1: Write failing tests** in `tests/anasayfa.test.cjs` against `_site/index.html`:
  - The first `<section` inside `<main>` has `id="basiclink"` and contains `.podyum`.
  - The order of the IDs `basiclink`, `onceki-kombinler`, `anaIndirim`, `anaCikis` and `ikinci-plan` matches the list above.
  - There is no `ana-giris`.
  - `#yurtdisi` exists inside `#ikinci-plan`.
  - The showcase post's URL appears as the "Kombin sayfasını aç" href.
  - The page has no `/toplam|normalde/i`.
  - A unit test of `vitrinPostu` checks that a newer post without `looklar` loses to a post with `looklar`.
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement `vitrinPostu`, then the `index.njk` reorder, then the CSS and JS reveal.
- [ ] **Step 4:** Run `npm test` and the e2e script with `/` added (390 and 1280 widths, no horizontal overflow, pin works on the homepage, no console errors). Expected: PASS and `e2e ok`.
- [ ] **Step 5:** Confirm the menu: `_site/index.html` contains `class="menu-basiclink"` as the first menu link. It already does, so add this as a test line in `tests/anasayfa.test.cjs`.
- [ ] **Step 6:** Commit: "Make Basiclink the homepage's first screen".

### Task 6: Preview deploy and owner review

**Files:** none new.

- [ ] **Step 1:** Run `npm test` and `npx @11ty/eleventy --quiet` one final time. Expected: all pass.
- [ ] **Step 2:** Push `yeni-duzen`, then wait until `curl -s -o /dev/null -w '%{http_code}' https://yeni-duzen.zamanist.pages.dev/basiclink/zara-indiriminden-blazer-kombinleri/` returns 200 and the HTML contains `podyum-look`.
- [ ] **Step 3:** Run the e2e script against the preview origin instead of `localhost:8811`. The script takes `BASE_URL` from env. Expected: `e2e ok`.
- [ ] **Step 4:** Take phone-width screenshots of `/` and the Zara page from the preview and send them to the owner with the preview links. Production stays untouched until the owner approves.
