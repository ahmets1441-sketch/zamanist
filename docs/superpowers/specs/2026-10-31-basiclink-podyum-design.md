# Basiclink podyum: Basiclink-first homepage and runway outfit pages

Date: 2026-10-31. Status: approved in conversation, pending the written-design review.

## Why

Zamanist's main traffic source is now the @basiclinkk Instagram account. People arrive from three kinds of links:

- the bio link,
- a post or story link to one outfit,
- the zamanist.com homepage.

The owner wants the site to read as a Basiclink site first. Overseas price comparison, watches and cars are secondary.

The owner also wants outfit pages to feel like the "Try the Look" runway in an Instagram reel they shared (velvetica.studio, Shopify "Runway" page). On that page, models stand side by side and the centre one is large. You swipe between looks, and you tap a pin on a garment to see the piece.

Success means this: a visitor who taps an Instagram link sees the outfit within the first screen, can reach every product's shop link in one tap, and the site looks professional with smooth transitions.

## Goals

1. **Homepage order.** Basiclink comes first and takes the whole first screen.
   1. A Basiclink showcase (vitrin) of the latest outfit post, in the runway layout below.
   2. Earlier Basiclink posts as cover cards that link to their pages.
   3. Discounts (indirimler) and limited releases (sınırlı seri). This placement is Claude's call; the owner did not object.
   4. Secondary sections in smaller form: the overseas price search (yurt dışı fiyat), watches (saat) and cars (otomobil), plus the existing bolumler sections.
2. **Navigation.** "basiclink." is the first menu item and is visually emphasised.
3. **Bio link.** The bio link lands on the homepage showcase, at the top. A dedicated anchor or URL is fine; the builder chooses.
4. **Outfit pages.** `/basiclink/<slug>/` becomes the runway layout:
   - Several looks: a horizontal runway. The active look is large and the others are smaller and faded. Use arrows on desktop and swipe on phones. Show a progress indicator.
   - A single look: one large look.
   - The active look carries "+" pins on the garments it actually wears. Tapping a pin opens a small card with type, model code, price, the old price if any, and an "Ürüne git" link.
   - A "Bu kombinde" list per look covers every piece, including pieces the photo does not show (for example the sweater and boots in the Zara post). Each row has a thumbnail, type, code, price and a link button.
   - A button opens the full outfit page from the homepage showcase.
5. **Same URLs.** Existing outfit pages keep their URLs and switch to the new layout. Instagram links already shared must keep working.
6. **Transitions.** Animate look changes, pin cards and section reveals on scroll. Use CSS transitions and `prefers-reduced-motion` fallbacks. It should look polished, not flashy.
7. **Phone first.** Most visitors come from the Instagram in-app browser on phones. The phone layout is the primary one.

## Non-goals

- No change to the overseas price, calculator or account features themselves. They only move down the page.
- No new Instagram API work. Publishing stays a separate track.
- No automatic daily outfit agent (Rümeysa). That is a separate project that will feed this page format later.

## Anti-goals

These would make the work a failure even if it technically works.

- Any total outfit price on the page. The owner's rule: prices only next to each item, never "normalde X, şimdi Y" totals.
- A heavy homepage that loads slowly on phones in the Instagram in-app browser. Keep the first screen light, so the runway photos must be properly sized webp images.
- Breaking existing `/basiclink/<slug>/` links.
- Pins on pieces the photo does not show.
- Unreadable text over photos, or touch targets under 44 px.

## Constraints

- Stack: Eleventy 3 static site on Cloudflare Pages, Nunjucks templates, plain CSS and vanilla JS. No framework.
- Work on branch `yeni-duzen`. Preview: https://yeni-duzen.zamanist.pages.dev. Production is `main`, and it takes cherry-picks only with the owner's explicit approval each time.
- Post data lives in the front matter of `src/basiclink/*.md` (layout `src/_includes/insta-post.njk`). Today it holds `title`, `ozet`, `kapak`, `slaytlar` (the carousel slide count, with images at `/img/insta/<slug>/<n>.webp`), `tags: [kombinlerim]`, `kontrol`, `satici`, and `urunler[]` (`marka`, `ad`, `kod`, `fiyat`, `eskiFiyat`, `fiyatNot`, `gorsel`, `link`). Product thumbnails live in `/img/insta/urun/`.
- Existing posts:
  - `kahverengi-hirka-kombini`, `pazar-kahvesi-kombini`, `kisin-al-yazin-giy`, `sonbahar-botlari`: one look, or no look at all.
  - `alinir-mi-casio-mtp-b220`: a product review, not an outfit.
  - `zara-indiriminden-blazer-kombinleri`: four looks.
- The homepage is `src/index.njk`. Its current order is: hero header, then the yurt dışı search, then Basiclink, then sınırlı seri, then indirimler, then bolumler.
- Brand: dark #111 header, gold #CFA65A, Playfair Display headings and Inter body text, as on the live site.
- Instagram assets are made with scripts in `~/zamanist-insta/` (the `uret.js` and `kombin.js` patterns). Background removal for model photos must run locally or for free, with no paid API.
- Design mockups approved in conversation: https://claude.ai/artifact/38iTaBRw8HKQi16avtqMUq (desktop and phone artboards, interactive).

## Decided

- The runway lives on the outfit pages and as the homepage's first section (the latest post). The owner confirmed this: "basiclink anasayfada da en başta olsun".
- Existing outfit pages are converted, not kept side by side. This is Claude's call, because the owner answered "süper olur bu şekilde yapalım" to the full plan without picking either option.
- Old single-look posts need a fallback. They have no per-look data, so the runway shows their carousel slides as cards. This is Claude's call.
- The model photos should be background-removed cut-outs on a light, even ground, to get the reel's runway feel. Until a cut-out exists, the original photo in a rounded card is acceptable. The mockup shows that state.

## Answers from the review

- **Zara look photos.** Each look's full-body model photo exists in `~/zamanist-insta/zara-takim/img/` as `look-gri.jpg`, `look-kum.jpg`, `look-kahve.jpg` and `look-yesil.jpg`. The look-to-product mapping comes from `~/zamanist-insta/zara-takim/urunler.json` and `uret.js`:

  | Look | Blazer | Pantolon | Kazak | Bot |
  |---|---|---|---|---|
  | Gri | 4456/999/802 | 4457/999/802 | 2893/319/800 | 2000/822/800 |
  | Kum | 4456/999/081 | 4457/999/081 | 2621/302/251 | 2000/822/700 |
  | Kahve | 4456/999/707 | 4457/999/707 | 2893/319/719 | 2000/822/700 |
  | Yeşil | 4457/232/500 | 4404/232/500 | 2621/302/251 | 2000/822/800 |

  Only the blazer and the trousers are worn in the photos, so pins go on those two only.
- **Scope.** Work ends at the `yeni-duzen` preview. Production is a separate cherry-pick that needs the owner's approval.
- **Homepage hero header (Claude's call).** The current header ("Saat, stil, sneaker ve otomobil" with quick links) is removed. Its brand line becomes a small kicker above the showcase heading. The quick links move into the secondary area.
- **Mockup (Claude's call).** The mockup is the visual reference for layout, pin card, side list and phone strip, and the build should look close to it. The spec's rules win where they differ, for example cut-outs instead of walled photos.
- **Non-outfit posts (Claude's call).**
  - Posts without the `kombinlerim` tag keep today's `insta-post.njk` layout: the Casio review, `sonbahar-botlari` and `kisin-al-yazin-giy`. The template branches on whether the post has `looklar`.
  - Outfit posts without `looklar` (`kahverengi-hirka-kombini`, `pazar-kahvesi-kombini`) use the slide fallback.
  - The homepage showcase picks the newest post that has `looklar`, else the newest `kombinlerim` post.

## Data the builder must add (new front-matter shape)

Posts with looks gain a `looklar` list. Each look has a name, a photo or cut-out, the product indexes it uses, and pin positions as percentages for the pieces the photo shows. Products are matched to looks by `kod`, so no data is duplicated. The exact field names are left to the builder, but they must be documented in `insta-post.njk`'s header comment.

## Left to the builder

- Exact CSS and JS structure, and whether the homepage showcase and the outfit page share one include.
- The background-removal tool. It must be local or free; `kes.mjs` flood fill fails on shadowed walls.
- How the bio link anchor is named.
- Scroll-reveal implementation details, within the reduced-motion rule.
- How older posts are migrated, as long as their URLs and content survive.
