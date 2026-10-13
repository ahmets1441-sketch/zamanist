// Ortak hesap: kur, vergi iadesi, gümrük ve Türkiye fiyatıyla karşılaştırma.
// Hesaplayıcı sayfası ve saat sayfaları bunu kullanır.
window.Zamanist = (() => {
  const GUMRUK_SINIRI_EUR = 430;   // 15 yaş üstü yolcu başına vergisiz sınır
  const MAKTU_SINIR_EUR = 1500;    // bu tutara kadar ticari olmayan eşyada maktu vergi
  const MAKTU_ORAN_AB_DISI = 0.60; // AB dışından gelen eşya

  const kurlar = {};

  async function kurGetir(kod) {
    if (kurlar[kod]) return kurlar[kod];
    try {
      const r = await fetch(`https://api.frankfurter.dev/v1/latest?base=${kod}&symbols=TRY,EUR`);
      const d = await r.json();
      kurlar[kod] = { TRY: d.rates.TRY, EUR: d.rates.EUR, tarih: d.date };
    } catch (e) {
      const r = await fetch(`https://open.er-api.com/v6/latest/${kod}`);
      const d = await r.json();
      kurlar[kod] = { TRY: d.rates.TRY, EUR: d.rates.EUR, tarih: d.time_last_update_utc.slice(5, 16) };
    }
    return kurlar[kod];
  }

  // fiyat: oradaki vergiler dahil etiket fiyatı. iadeli: mağazadan pasaportla alışveriş mi.
  function hesapla({ fiyat, ulke, kur, trFiyat, iadeli = true }) {
    const vergisiz = fiyat / (1 + ulke.kdvOrani);
    const iadeVar = iadeli && ulke.kdvOrani > 0 && vergisiz >= ulke.taxFreeAlt;
    const iade = iadeVar ? fiyat - vergisiz : 0;
    const net = fiyat - iade;
    const netTl = net * kur.TRY;
    const netEur = net * kur.EUR;

    let gumruk = "alti";
    let gumrukTl = 0;
    if (netEur > MAKTU_SINIR_EUR) gumruk = "belirsiz";
    else if (netEur > GUMRUK_SINIRI_EUR) { gumruk = "maktu"; gumrukTl = netTl * MAKTU_ORAN_AB_DISI; }

    let karar = null, farkVergisiz = null, farkVergili = null;
    if (trFiyat > 0) {
      farkVergisiz = trFiyat - netTl;
      farkVergili = trFiyat - netTl - gumrukTl;
      karar = farkVergisiz <= 0 ? "turkiye"
        : gumruk === "belirsiz" ? "belirsiz"
        : farkVergili > 0 ? "yurtdisi"
        : "turkiye-gumruk";
    }
    return { fiyat, iadeVar, iade, net, netTl, netEur, gumruk, gumrukTl, farkVergisiz, farkVergili, karar };
  }

  const tl = (n) => n.toLocaleString("tr-TR", { maximumFractionDigits: 0 }) + " TL";
  const para = (n, kod) => n.toLocaleString("tr-TR", { maximumFractionDigits: 0 }) + " " + kod;
  const euro = (n) => Math.round(n).toLocaleString("tr-TR") + " €";
  const yuzde = (fark, trFiyat) => Math.round((fark / trFiyat) * 100);
  const fark = (f, trFiyat) => f >= 0 ? `${tl(f)} ucuz (%${yuzde(f, trFiyat)})` : `${tl(-f)} pahalı`;

  const GUMRUK_METNI = {
    alti: () => "430 € sınırının altında. Yanınızda getirirseniz vergi çıkmaz.",
    maktu: (s) => `430 € sınırını aşıyor. Gümrükte yaklaşık %60 vergi ödemeniz gerekir: en fazla ${tl(s.gumrukTl)}.`,
    belirsiz: () => "1.500 € üstü. Maktu vergi uygulanmaz, normal gümrük vergileri hesaplanır ve tutar yüksek olabilir.",
  };

  const KARAR = {
    yurtdisi: ["iyi", "Oradan almak daha avantajlı."],
    turkiye: ["kotu", "Türkiye'den almak daha mantıklı."],
    "turkiye-gumruk": ["kotu", "Gümrük vergisiyle birlikte Türkiye'den almak daha mantıklı."],
    belirsiz: ["orta", "Gümrük vergisi tahmin edilemiyor. Fark, ödeyeceğiniz vergiden büyükse avantajlı."],
  };
  const kararHtml = (k) => k ? `<p class="karar ${KARAR[k][0]}">${KARAR[k][1]}</p>` : "";

  return { kurGetir, hesapla, tl, para, euro, fark, GUMRUK_METNI, KARAR, kararHtml };
})();
