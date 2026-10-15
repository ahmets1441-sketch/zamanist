// Reads the home pages listed in src/_data/kampanyaKaynaklari.json and records the discount
// headlines they show ("%70'e varan indirim") in src/_data/otomatikKampanyalar.json.
// Runs daily from .github/workflows/kampanya-tara.yml; honours robots.txt and identifies itself.
import { readFile, writeFile } from "node:fs/promises";

const UA = "ZamanistBot/1.0 (+https://zamanist.com)";
const CIKTI = "src/_data/otomatikKampanyalar.json";
const bugun = new Date().toISOString().slice(0, 10);

// Minimal robots.txt check: the "*" or ZamanistBot group, longest matching rule wins.
async function izinli(url) {
  const u = new URL(url);
  const r = await fetch(`${u.origin}/robots.txt`, { headers: { "User-Agent": UA } }).catch(() => null);
  if (!r || r.status >= 500) return false;
  if (!r.ok) return true;
  const gruplar = [];
  let g = null, kural = false;
  for (const satir of (await r.text()).split(/\r?\n/)) {
    const [a, ...b] = satir.replace(/#.*/, "").split(":");
    const ad = a.trim().toLowerCase(), deger = b.join(":").trim();
    if (ad === "user-agent") {
      if (!g || kural) { g = { ajanlar: [], kurallar: [] }; gruplar.push(g); kural = false; }
      g.ajanlar.push(deger.toLowerCase());
    } else if ((ad === "allow" || ad === "disallow") && g) {
      kural = true;
      if (deger) g.kurallar.push({ izin: ad === "allow", yol: deger });
    }
  }
  const grup = gruplar.find((x) => x.ajanlar.includes("zamanistbot")) || gruplar.find((x) => x.ajanlar.includes("*"));
  if (!grup) return true;
  const yol = u.pathname + u.search;
  const eslesen = grup.kurallar
    .filter((k) => new RegExp("^" + k.yol.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\\\$$/, "$")).test(yol))
    .sort((x, y) => y.yol.length - x.yol.length || Number(y.izin) - Number(x.izin));
  return eslesen.length ? eslesen[0].izin : true;
}

const metin = (html) =>
  html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&rsquo;/g, "'")
    .replace(/\s+/g, " ");

// Headlines that state a rate together with "indirim". Card-, app- and coupon-only offers are skipped:
// they are not a sale everyone gets.
// "İ" does not case-fold to "i" in JavaScript, so the dotted capital is spelled out.
const KALIP = /((?:[\p{L}&'’.]+\s){0,3})%\s?(\d{2})[^%]{0,30}?[iİI]nd[iİI]r[iİI]m/giu;
const VARAN = /%\s?\d{2}\s?['’]?\s?[eyEYaA]{0,2}\s?(?:varan|VARAN|Varan)/;
const HARIC = /card|kart|app|uygulama|kupon|kod|ilk alışveriş|öğrenci|üyelere|sepette \d|ikinci ürün|2\.\s?ürün|ve üzeri|ikili|üçlü|\d['’]?l[iı] al|alımda|alışverişler için/i;

function basliklar(t) {
  const bulunan = [];
  for (const m of t.matchAll(KALIP)) {
    const oran = Number(m[2]);
    const cumle = m[0].trim().replace(/\s+/g, " ");
    if (oran < 20 || oran > 90 || HARIC.test(cumle.toLocaleLowerCase("tr"))) continue;
    const varan = cumle.match(VARAN)?.[0];
    bulunan.push({ oran, etiket: varan ? varan.replace(/\s+/g, "").replace(/['’]/, "'").replace(/varan$/i, " varan").toLocaleLowerCase("tr") : `%${oran}`, metin: cumle.slice(0, 90) });
  }
  return bulunan.sort((a, b) => b.oran - a.oran);
}

const kaynaklar = JSON.parse(await readFile("src/_data/kampanyaKaynaklari.json", "utf8"));
let onceki = [];
try { onceki = JSON.parse(await readFile(CIKTI, "utf8")).kampanyalar || []; } catch {}

const kampanyalar = [];
for (const k of kaynaklar) {
  try {
    if (!(await izinli(k.url))) { console.log(`${k.marka}: robots.txt izin vermiyor`); continue; }
    const getir = () => fetch(k.url, { headers: { "User-Agent": UA, "Accept-Language": "tr-TR" }, redirect: "follow" });
    let r = await getir();
    // Throttled: wait once as asked (Retry-After, capped at a minute), then give up for today.
    if (r.status === 429) {
      await new Promise((ok) => setTimeout(ok, Math.min(60, Number(r.headers.get("Retry-After")) || 20) * 1000));
      r = await getir();
    }
    if (!r.ok) { console.log(`${k.marka}: HTTP ${r.status}`); continue; }
    const b = basliklar(metin(await r.text()));
    if (!b.length) { console.log(`${k.marka}: indirim başlığı yok`); continue; }
    const eski = onceki.find((x) => x.grup === k.grup);
    const en = b[0];
    kampanyalar.push({
      baslik: `${k.marka} indirimi`,
      grup: k.grup,
      markalar: [k.marka],
      kategori: k.kategori,
      oran: en.etiket,
      ornekler: [...new Set(b.map((x) => x.metin))].slice(0, 3),
      link: k.url,
      ilkGorulme: eski?.ilkGorulme || bugun,
      kontrol: bugun,
    });
    console.log(`${k.marka}: %${en.oran} — ${en.metin}`);
  } catch (h) {
    console.log(`${k.marka}: ${h.message}`);
  }
  await new Promise((r) => setTimeout(r, 1500));
}

await writeFile(CIKTI, JSON.stringify({ guncelleme: bugun, kampanyalar }, null, 2) + "\n");
