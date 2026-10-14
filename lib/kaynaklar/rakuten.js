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
  // "韓国正規品" (Korean authorized) or parallel imports carry no Japanese warranty: not an authorized seller here.
  if (/正規品|正規販売店|正規取扱|国内正規|メーカー保証/.test(i.itemName) && !/韓国正規|海外正規|並行輸入/.test(i.itemName)) return "yetkili";
  return "pazar";
}

export const ad = "Rakuten Ichiba";

export function hazir(env) {
  return Boolean(env.RAKUTEN_APP_ID && env.RAKUTEN_ACCESS_KEY);
}

const bekle = (ms) => new Promise((r) => setTimeout(r, ms));

// Rakuten rejects the whole keyword when any half-width word is a single character ("Air Force 1"),
// and punctuation like "'07" only narrows the AND search.
export function anahtarKelime(q) {
  return q
    .replace(/[^\p{L}\p{N}\-]+/gu, " ")
    .split(" ")
    .filter((w) => w.length > 1 || /[^\x00-\x7F]/.test(w))
    .join(" ");
}

// Model code inside a longer query, e.g. "DX5883-100" in "Nike Air Force 1 '07 EasyOn DX5883-100".
export function modelKodu(q) {
  return q.split(/\s+/).find((w) => /\d/.test(w) && /[A-Za-z]/.test(w) && w.replace(/-/g, "").length >= 6) || null;
}

async function istek(keyword, env, origin) {
  const url = new URL(RAKUTEN);
  url.searchParams.set("applicationId", env.RAKUTEN_APP_ID);
  url.searchParams.set("accessKey", env.RAKUTEN_ACCESS_KEY);
  url.searchParams.set("keyword", keyword);
  url.searchParams.set("hits", "30");
  url.searchParams.set("availability", "1");
  url.searchParams.set("formatVersion", "2");
  // The API allows about one request per second; wait and retry once when throttled.
  for (let deneme = 0; ; deneme++) {
    const r = await fetch(url, { headers: { Referer: origin + "/", Origin: origin } });
    if (r.status === 429 && deneme < 2) { await bekle(1100); continue; }
    const d = await r.json();
    if (!r.ok) throw new Error(d.error_description || d.error || `Rakuten ${r.status}`);
    return d.Items || [];
  }
}

export async function ara({ q, urunTuru, env, origin }) {
  const keyword = anahtarKelime(q);
  if (keyword.length < 2) return [];
  let items = await istek(keyword, env, origin);
  // Long product names rarely match every word; fall back to the model code alone.
  const kod = modelKodu(keyword);
  if (!items.length && kod && kod !== keyword) {
    await bekle(1100);
    items = await istek(kod, env, origin);
  }
  const aksesuar = AKSESUAR[urunTuru] || AKSESUAR.saat;
  return items.map((i) => {
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
