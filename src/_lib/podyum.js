// Runway (podyum) data for basiclink outfit posts.
// A post with looks carries, besides urunler[], a front-matter list:
//   looklar:
//     - ad: Gri                                   # look name shown on the card
//       gorsel: /img/insta/<slug>/look-gri.webp   # background-removed model photo
//       urunler: ["4456/999/802", ...]            # product codes (urunler[].kod) in this look, in list order
//       pinler:                                   # only pieces the photo shows; x, y in % of the photo
//         - { kod: "4456/999/802", x: 58, y: 40 }
// Outfit posts (tag kombinlerim) without looklar fall back to one look per carousel slide; other posts get no runway.
// Bad data throws, so a typo in a code fails the build instead of rendering an empty card.

const lookUrunleri = (look, urunler = [], slug = "") =>
  (look.urunler || []).map((kod) => {
    const u = urunler.find((x) => String(x.kod) === String(kod));
    if (!u) throw new Error(`podyum: ${slug} look "${look.ad}" has unknown kod ${kod}`);
    return u;
  });

const pinler = (look, urunler = [], slug = "") =>
  (look.pinler || []).map((p) => {
    if (!(look.urunler || []).map(String).includes(String(p.kod)))
      throw new Error(`podyum: ${slug} look "${look.ad}" pin ${p.kod} is not in look urunler`);
    for (const k of ["x", "y"])
      if (typeof p[k] !== "number" || p[k] < 0 || p[k] > 100)
        throw new Error(`podyum: ${slug} look "${look.ad}" pin ${p.kod} ${k} must be a number in 0-100`);
    const [urun] = lookUrunleri({ ad: look.ad, urunler: [p.kod] }, urunler, slug);
    return { x: p.x, y: p.y, urun };
  });

const podyumLooklari = (data = {}) => {
  const slug = data.page?.fileSlug || "";
  const urunler = data.urunler || [];
  if (Array.isArray(data.looklar) && data.looklar.length)
    return data.looklar.map((l) => ({
      ad: l.ad, gorsel: l.gorsel, urunler: lookUrunleri(l, urunler, slug), pinler: pinler(l, urunler, slug), slayt: false,
    }));
  if (!(data.tags || []).includes("kombinlerim")) return [];
  return Array.from({ length: data.slaytlar || 0 }, (_, i) => ({
    ad: "", gorsel: `/img/insta/${slug}/${i + 1}.webp`, urunler, pinler: [], slayt: true,
  }));
};

// Homepage showcase: the newest post with looks, else the newest outfit post, else null.
const vitrinPostu = (postlar = []) => {
  const yeni = [...postlar].sort((a, b) => b.date - a.date);
  return yeni.find((p) => p.data.looklar?.length) || yeni.find((p) => (p.data.tags || []).includes("kombinlerim")) || null;
};

module.exports = { lookUrunleri, pinler, podyumLooklari, vitrinPostu };
