// Rakuten Ichiba (Japan) item search. Needs env RAKUTEN_APP_ID and RAKUTEN_ACCESS_KEY.
const RAKUTEN = "https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701";

// Chain electronics/discount stores: their physical branches offer tax-free shopping.
const ZINCIRLER = /ビックカメラ|ヨドバシ|Joshin|ジョーシン|エディオン|ノジマ|コジマ|ソフマップ|ヤマダ|ケーズ|ドン・キホーテ|ABCマート|アルペン|ゼビオ/i;
const IKINCI_EL = /中古|USED|ユーズド|良品|美品|質屋/i;
const AKSESUAR = {
  saat: /適合|互換|交換用|替えベルト|替えバンド|ベルトのみ|バンドのみ/,
  ayakkabi: /靴紐|シューレース|インソール|中敷|シューケア|クリーナー|防水スプレー|シューキーパー|シューズケース|ソックス/,
};

function tur(i, ikinciEl) {
  if (ikinciEl) return "ikinciel";
  if (/公式/.test(i.shopName)) return "resmi";
  if (ZINCIRLER.test(i.shopName)) return "zincir";
  if (/正規品|正規販売店|正規取扱|国内正規|メーカー保証/.test(i.itemName)) return "yetkili";
  return "pazar";
}

export const ad = "Rakuten Ichiba";

export function hazir(env) {
  return Boolean(env.RAKUTEN_APP_ID && env.RAKUTEN_ACCESS_KEY);
}

export async function ara({ q, urunTuru, env, origin }) {
  const url = new URL(RAKUTEN);
  url.searchParams.set("applicationId", env.RAKUTEN_APP_ID);
  url.searchParams.set("accessKey", env.RAKUTEN_ACCESS_KEY);
  url.searchParams.set("keyword", q);
  url.searchParams.set("hits", "30");
  url.searchParams.set("availability", "1");
  url.searchParams.set("formatVersion", "2");
  const r = await fetch(url, { headers: { Referer: origin + "/", Origin: origin } });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error_description || d.error || `Rakuten ${r.status}`);
  const aksesuar = AKSESUAR[urunTuru] || AKSESUAR.saat;
  return (d.Items || []).map((i) => {
    const ikinciEl = IKINCI_EL.test(i.itemName);
    return {
      kaynak: ad,
      ad: i.itemName,
      fiyat: i.itemPrice,
      para: "JPY",
      vergiDahil: i.taxFlag === 0,
      kargoDahil: i.postageFlag === 0,
      magaza: i.shopName,
      magazaLink: i.shopUrl,
      puan: i.reviewAverage || null,
      yorumSayisi: i.reviewCount || 0,
      link: i.itemUrl,
      resim: (i.mediumImageUrls || [])[0] || null,
      ikinciEl,
      aksesuar: aksesuar.test(i.itemName),
      tur: tur(i, ikinciEl),
    };
  });
}
