// Japonca ilan başlıklarını sadeleştirir ve önemli bilgileri Türkçe etiketlere çevirir.
window.Japonca = (() => {
  const SOZLUK = [
    [/レディース|婦人/, "Kadın"], [/メンズ|紳士/, "Erkek"], [/ユニセックス|男女兼用/, "Unisex"],
    [/自動巻|オートマ/, "Otomatik"], [/手巻/, "Kurmalı"], [/クオーツ|クォーツ/, "Quartz"],
    [/ソーラー/, "Solar"], [/電波/, "Radyo ayarlı"], [/Bluetooth|ブルートゥース/i, "Bluetooth"],
    [/国内正規/, "Japonya resmi garantili"], [/正規品|正規販売店|正規取扱/, "Resmi garantili"],
    [/海外モデル|並行輸入/, "Yurt dışı modeli (paralel ithal)"], [/逆輸入/, "Geri ithal model"],
    [/限定/, "Sınırlı üretim"], [/新作|新品/, "Yeni"], [/在庫あり|即納/, "Stokta"], [/予約/, "Ön sipariş"],
    [/チタン/, "Titanyum"], [/ステンレス|メタルバンド|ブレス/, "Çelik bilezik"], [/レザー|革ベルト|本革/, "Deri kayış"], [/ラバー|ウレタン/, "Kauçuk kayış"],
    [/ブルー|青/, "Mavi"], [/ブラック|黒/, "Siyah"], [/ホワイト|白/, "Beyaz"], [/グリーン|緑/, "Yeşil"],
    [/シルバー/, "Gümüş"], [/ゴールド/, "Altın"], [/イエロー/, "Sarı"], [/グレー/, "Gri"], [/ネイビー/, "Lacivert"], [/コンビ/, "Çift renk"],
    [/ノベルティ|特典/, "Hediyeli"], [/無金利|分割手数料無料/, "Faizsiz taksit"],
  ];
  const REKLAM = /送料無料|ポイント\d*倍|最大\d+[^ ]*|クーポン[^ ]*|\d+%?OFF[^ ]*|\d+円OFF[^ ]*|ラッピング無料|あす楽|翌日配送/gi;

  function temizle(baslik) {
    return baslik
      .replace(/【[^】]*】|〔[^〕]*〕|［[^］]*］|\[[^\]]*\]|≪[^≫]*≫|＜[^＞]*＞/g, " ")
      .replace(REKLAM, " ")
      .replace(/[★☆◆◇■□●○※！!]+/g, " ")
      .replace(/[　\s]+/g, " ")
      .trim();
  }

  // Reklam köşeli parantezlerindeki kelimeler (ör. 【限定クーポン】) etiket üretmesin diye temiz başlık kullanılır.
  function etiketler(hamBaslik) {
    const baslik = temizle(hamBaslik);
    const bulunan = [];
    for (const [desen, tr] of SOZLUK) if (desen.test(baslik) && !bulunan.includes(tr)) bulunan.push(tr);
    const mm = baslik.match(/(\d{2}(?:\.\d)?)\s*(?:mm|MM|ミリ)/);
    if (mm) bulunan.unshift(`${mm[1]} mm`);
    return bulunan;
  }

  return { temizle, etiketler };
})();
