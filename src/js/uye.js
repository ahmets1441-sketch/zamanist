// Membership state for pages: who is signed in and which brands they follow.
// Signed out, follows are kept in this browser and merged into the account after sign-in.
window.Uye = (() => {
  const YEREL = "takipMarkalar";
  const yerelOku = () => { try { return JSON.parse(localStorage.getItem(YEREL) || "[]"); } catch { return []; } };
  const yerelYaz = (l) => { try { localStorage.setItem(YEREL, JSON.stringify(l)); } catch {} };
  const gonder = (yol, veri) => fetch(yol, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(veri) })
    .then(async (r) => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.hata || "İşlem yapılamadı."); return d; });

  let durum = null;
  async function yukle() {
    let d = { uye: null };
    try { d = await fetch("/api/uye/ben", { credentials: "same-origin" }).then((r) => r.ok ? r.json() : { uye: null, kapali: true }); } catch { d = { uye: null, kapali: true }; }
    if (d.uye) {
      const yerel = yerelOku().filter((a) => !d.takip.includes(a));
      if (yerel.length) {
        try { d.takip = (await gonder("/api/uye/takip", { ekle: yerel })).takip; yerelYaz([]); } catch {}
      } else yerelYaz([]);
    } else d.takip = yerelOku();
    durum = d;
    document.querySelectorAll("[data-uye-link]").forEach((a) => { a.textContent = d.uye ? "Hesabım" : "Giriş"; });
    return d;
  }
  const hazir = yukle();

  async function takipDegistir(anahtar) {
    await hazir;
    const takipte = durum.takip.includes(anahtar);
    if (durum.uye) durum.takip = (await gonder("/api/uye/takip", { anahtar, takip: !takipte })).takip;
    else { durum.takip = takipte ? durum.takip.filter((x) => x !== anahtar) : [...durum.takip, anahtar]; yerelYaz(durum.takip); }
    return durum.takip;
  }

  return { hazir, takipDegistir, gonder, durum: () => durum };
})();
