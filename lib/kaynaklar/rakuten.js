// Rakuten Ichiba (Japan) item search. Needs env RAKUTEN_APP_ID and RAKUTEN_ACCESS_KEY.
const RAKUTEN = "https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701";

// Chain electronics/discount stores: their physical branches offer tax-free shopping.
const ZINCIRLER = /ビックカメラ|ヨドバシ|Joshin|ジョーシン|エディオン|ノジマ|コジマ|ソフマップ|ヤマダ|ケーズ|ドン・キホーテ|ABCマート|アルペン|ゼビオ/i;
const IKINCI_EL = /中古|USED|ユーズド|良品|美品|質屋/i;
// Watch bands and shoe-care items that show up when searching for the product itself.
const AKSESUAR = /適合|互換|交換用|替えベルト|替えバンド|ベルトのみ|バンドのみ|靴紐|シューレース|インソール|中敷|シューケア|クリーナー|防水スプレー|シューキーパー|シューズケース|ソックス/;

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

// Tries the keyword candidates in order (full name, model code, brand + model) until one has listings.
export async function ara({ adaylar, env, origin }) {
  let items = [], sorgu = null;
  for (const [i, aday] of adaylar.slice(0, 4).entries()) {
    const keyword = anahtarKelime(aday);
    if (keyword.length < 2) continue;
    if (i > 0) await bekle(1100);
    items = await istek(keyword, env, origin);
    sorgu = keyword;
    if (items.length) break;
  }
  const teklifler = items.map((i) => {
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
      aksesuar: AKSESUAR.test(i.itemName),
      tur: tur(i, ikinciEl),
    };
  });
  return { teklifler, sorgu };
}
