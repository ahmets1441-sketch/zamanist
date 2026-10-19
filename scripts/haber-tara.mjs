// Reads the news feeds in scripts/haber-kaynaklari.json and lists the last day's launch and reveal
// headlines as Markdown, so new cars, watches and sneakers are not missed. Nothing is published:
// the daily workflow opens a GitHub issue with the list, and an editor checks the official source
// before anything goes on the site.
// node scripts/haber-tara.mjs [hours=30] > adaylar.md
import { readFile } from "node:fs/promises";
import { UA, izinli } from "./robots.mjs";

const saat = Number(process.argv[2] || 30);
const sinir = Date.now() - saat * 3600e3;

// Headlines that announce something new; opinion pieces and auction round-ups rarely match.
const YENI = /\b(unveil|reveal|debut|launch|introduc|announc|premiere|first look|teaser|teased|limited|edition|release|drop|collab|concept|new)\w*/i;
// Brands the site already covers get a star so they stand out.
const ONEMLI = /\b(porsche|ferrari|lamborghini|mclaren|tesla|bmw|mercedes|amg|audi|aston martin|bugatti|rimac|koenigsegg|toyota|honda|casio|g-shock|seiko|citizen|orient|tissot|hamilton|tudor|rolex|omega|swatch|tag heuer|longines|cartier|patek|audemars|grand seiko|nike|jordan|adidas|new balance|asics|salomon|converse|vans|puma)\b/i;

const coz = (t = "") => t.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, "")
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d))).replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&apos;|&#039;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
const alan = (xml, ad) => coz((xml.match(new RegExp(`<${ad}[^>]*>([\\s\\S]*?)</${ad}>`)) || [])[1]);

function ogeler(xml) {
  return [...xml.matchAll(/<(item|entry)[\s>][\s\S]*?<\/\1>/g)].map(([x]) => ({
    baslik: alan(x, "title"),
    link: alan(x, "link") || (x.match(/<link[^>]*href="([^"]+)"/) || [])[1] || "",
    tarih: Date.parse(alan(x, "pubDate") || alan(x, "published") || alan(x, "updated") || alan(x, "dc:date")),
  }));
}

const kaynaklar = JSON.parse(await readFile(new URL("./haber-kaynaklari.json", import.meta.url), "utf8"));
const gruplar = new Map(), hatalar = [];
for (const k of kaynaklar) {
  try {
    if (!(await izinli(k.url))) { hatalar.push(`${k.ad}: robots.txt izin vermiyor`); continue; }
    const r = await fetch(k.url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20000) });
    if (!r.ok) { hatalar.push(`${k.ad}: HTTP ${r.status}`); continue; }
    for (const o of ogeler(await r.text())) {
      if (!o.baslik || !o.link || !(o.tarih >= sinir) || !YENI.test(o.baslik)) continue;
      // Broad feeds ("sadeceOnemli") only count when a brand we follow is in the headline.
      if (k.sadeceOnemli && !ONEMLI.test(o.baslik)) continue;
      if (!gruplar.has(k.konu)) gruplar.set(k.konu, []);
      gruplar.get(k.konu).push({ ...o, kaynak: k.ad, onemli: ONEMLI.test(o.baslik) });
    }
  } catch (h) { hatalar.push(`${k.ad}: ${h.message}`); }
}

let md = "";
for (const [konu, xs] of gruplar) {
  const gorulen = new Set();
  const liste = xs.filter((x) => !gorulen.has(x.link) && gorulen.add(x.link))
    .sort((a, b) => b.onemli - a.onemli || b.tarih - a.tarih);
  md += `## ${konu} (${liste.length})\n\n` + liste.map((x) => `- ${x.onemli ? "★ " : ""}[${x.baslik}](${x.link}) · ${x.kaynak}`).join("\n") + "\n\n";
}
if (md) md += `★: sitede takip ettiğimiz markalar. Son ${saat} saat. Yayınlamadan önce resmi kaynaktan doğrulayın.\n`;
if (hatalar.length) md += `\n<details><summary>Okunamayan kaynaklar</summary>\n\n${hatalar.map((h) => `- ${h}`).join("\n")}\n</details>\n`;
process.stdout.write(md);
