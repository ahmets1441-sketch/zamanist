// Shared by the daily scanners: identify honestly and obey robots.txt.
export const UA = "ZamanistBot/1.0 (+https://zamanist.com)";

// Minimal robots.txt check: the "*" or ZamanistBot group, longest matching rule wins.
export async function izinli(url) {
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
