// Turns what a Turkish shopper types ("Pure Star Beyaz Erkek Deri Sneaker 102273737_100")
// into keywords a foreign marketplace understands ("Golden Goose Pure Star").

// Turkish descriptive words: foreign listings never contain them, and marketplace search
// requires every word to match.
const TURKCE = new Set(`beyaz siyah lacivert kırmızı kirmizi mavi yeşil yesil gri kahverengi kahve bej krem pembe mor sarı sari turuncu
  altın altin gümüş gumus bordo haki füme fume renkli çok renk
  erkek kadın kadin bayan bay unisex çocuk cocuk genç
  deri süet suet kumaş kumas tekstil hakiki suni çelik celik kauçuk kaucuk silikon
  ayakkabı ayakkabi ayakkabısı ayakkabisi sneaker sneakers spor günlük gunluk bot botu terlik sandalet
  kol saati saati saat kordon kordonlu kayış kayisi otomatik kurmalı quartz
  model yeni orijinal original indirimli ürün urun ve ile için icin`.split(/\s+/));

// Brand names as people type them, and the spelling marketplaces use.
const MARKALAR = [
  [/golden ?goose|ggdb/i, "Golden Goose"], [/nike/i, "Nike"], [/adidas/i, "adidas"], [/new ?balance/i, "New Balance"],
  [/asics/i, "asics"], [/onitsuka/i, "Onitsuka Tiger"], [/converse/i, "Converse"], [/vans/i, "Vans"], [/puma/i, "Puma"],
  [/salomon/i, "Salomon"], [/hoka/i, "HOKA"], [/lacoste/i, "Lacoste"], [/reebok/i, "Reebok"], [/common projects/i, "Common Projects"],
  [/rolex/i, "Rolex"], [/omega/i, "Omega"], [/seiko/i, "Seiko"], [/casio|g-?shock/i, "Casio"], [/citizen/i, "Citizen"],
  [/hamilton/i, "Hamilton"], [/tissot/i, "Tissot"], [/longines/i, "Longines"], [/orient/i, "Orient"], [/tag ?heuer/i, "TAG Heuer"],
];

// Famous model names that identify the brand when the shopper leaves it out.
const MODELLER = [
  [/pure[- ]?star|ball[- ]?star|mid[- ]?star|hi[- ]?star|super-star|slide star/i, "Golden Goose"],
  [/air ?force|air ?max|\bdunk\b|jordan|cortez|blazer|vomero|pegasus/i, "Nike"],
  [/stan ?smith|samba|gazelle|superstar|\bcampus\b|spezial|ultra ?boost|handball/i, "adidas"],
  [/\b(2002r|1906r|990v\d|992|993)\b/i, "New Balance"],
  [/gel-|kayano|nimbus|gt-2160/i, "asics"],
  [/mexico ?66|serrano|corsair/i, "Onitsuka Tiger"],
  [/chuck ?(taylor|70)|\ball ?star\b/i, "Converse"],
  [/old ?skool|sk8-?hi/i, "Vans"],
  [/xt-6|speedcross/i, "Salomon"],
  [/clifton|bondi/i, "HOKA"],
  [/submariner|datejust|daytona|gmt-master|explorer ii/i, "Rolex"],
  [/speedmaster|seamaster|constellation/i, "Omega"],
  [/presage|prospex|seiko 5/i, "Seiko"],
  [/khaki field|khaki aviation|jazzmaster/i, "Hamilton"],
  [/\bprx\b|le locle|seastar/i, "Tissot"],
  [/promaster|attesa/i, "Citizen"],
  [/bambino/i, "Orient"],
];

// Retailer stock numbers ("102273737_100") mean nothing abroad.
const MAGAZA_KODU = /^\d{6,}([_-]\d+)?$/;

const kelimeler = (q) =>
  q.replace(/[^\p{L}\p{N}\-_]+/gu, " ").split(" ").filter(Boolean);

// Model code inside a query, e.g. "DX5883-100" or "GMW-BZ5000GD-9JF".
export const modelKodu = (q) =>
  kelimeler(q).find((w) => /\d/.test(w) && /[A-Za-z]/.test(w) && w.replace(/[-_]/g, "").length >= 6) || null;

// Ordered keyword candidates; the source tries them until one returns listings.
export function sorguAdaylari(q) {
  const temiz = kelimeler(q).filter((w) => !TURKCE.has(w.toLocaleLowerCase("tr")) && !MAGAZA_KODU.test(w));
  const metin = temiz.join(" ");
  const markaVar = MARKALAR.find(([d]) => d.test(metin));
  const eklenecek = !markaVar && (MODELLER.find(([d]) => d.test(metin)) || [])[1];
  const ana = eklenecek ? `${eklenecek} ${metin}` : metin;
  const kod = modelKodu(metin);
  const marka = markaVar ? markaVar[1] : eklenecek;
  // Without the brand, the first two remaining words are usually the model name.
  const markasiz = temiz.filter((w) => !(markaVar && markaVar[0].test(w)));
  const kisa = marka && markasiz.length > 2 ? `${marka} ${markasiz.slice(0, 2).join(" ")}` : null;
  const adaylar = [ana, kod, kisa].filter((x) => x && x.replace(/\s/g, "").length >= 2);
  return { adaylar: [...new Set(adaylar)], eklenenMarka: eklenecek || null, cikarilan: kelimeler(q).length - temiz.length };
}
