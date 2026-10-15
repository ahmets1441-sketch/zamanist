// Shared by the discount calendar and the home page box. Data comes from indirim-veri.njk.
window.Indirim = (() => {
  const GUN = 864e5;
  const bugun = new Date(new Date().toDateString());
  const tarih = (s) => (s ? new Date(s + "T00:00:00") : null);
  const anahtar = (x) => x.grup || x.baslik;

  // Without an end date, a sale counts as running until 14 days after it was last checked
  // (3 days for scan results), or 45 days after it started if never re-checked.
  function durumu(x) {
    const b = tarih(x.baslangic);
    const s = tarih(x.bitis) || (x.kontrol ? new Date(tarih(x.kontrol).getTime() + (x.otomatik ? 3 : 14) * GUN) : new Date(b.getTime() + 45 * GUN));
    if (bugun < b) return "yakinda";
    if (bugun <= s) return "devam";
    return "gecmis";
  }

  // Splits sales into running / upcoming / past. A scan result is shown only while running and
  // only when no hand-entered running sale exists for the same group.
  function grupla(liste) {
    const gruplar = { devam: [], yakinda: [], gecmis: [] };
    const elleSuren = new Set(liste.filter((x) => !x.otomatik && durumu(x) === "devam").map(anahtar));
    liste.forEach((x) => {
      const d = durumu(x);
      if (x.otomatik && (d !== "devam" || elleSuren.has(anahtar(x)))) return;
      gruplar[d].push(x);
    });
    gruplar.devam.sort((a, b) => (a.bitis || "9999").localeCompare(b.bitis || "9999"));
    gruplar.yakinda.sort((a, b) => a.baslangic.localeCompare(b.baslangic));
    gruplar.gecmis.sort((a, b) => b.baslangic.localeCompare(a.baslangic));
    return gruplar;
  }

  const kisa = (d) => d.toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
  function geriSayim(x) {
    const g = Math.round((tarih(x.baslangic) - bugun) / GUN);
    return g === 0 ? "Bugün başlıyor" : g === 1 ? "Yarın başlıyor" : `${g} gün kaldı`;
  }
  function bitisYazisi(x) {
    const g = Math.round((tarih(x.bitis) - bugun) / GUN);
    return g === 0 ? "Bugün son gün" : g === 1 ? "Yarın bitiyor" : `${kisa(tarih(x.bitis))} tarihine kadar (${g} gün)`;
  }

  // Brands the search page has an official site for (MARKA_SITELERI in src/ara/index.njk); a card
  // offers a "search abroad" link only for these, since a store name like Boyner finds nothing there.
  const YURTDISI = ["Casio", "Grand Seiko", "Seiko", "Citizen", "Orient", "Hamilton", "Tissot", "Longines", "Nike", "Adidas",
    "New Balance", "Asics", "Onitsuka Tiger", "Golden Goose", "Lacoste", "Puma", "Vans", "Converse", "Reebok", "Salomon",
    "Hoka", "Birkenstock", "Dr. Martens", "Timberland", "Mizuno"];
  const yurtdisiMarkalar = (x) => x.markalar.filter((m) => YURTDISI.includes(m));

  return { yurtdisiMarkalar, liste: window.INDIRIMLER || [], GUN, bugun, tarih, anahtar, durumu, grupla, kisa, geriSayim, bitisYazisi };
})();
