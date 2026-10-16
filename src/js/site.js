// Site-wide behaviour: mobile menu, dark mode, back-to-top, newsletter, offline support.
(() => {
  const $ = (id) => document.getElementById(id);
  const sakla = (k, v) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} };
  const oku = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };

  // Mobile menu
  const bar = $("ustBar"), menu = $("menuDugme");
  menu.addEventListener("click", () => {
    const acik = bar.classList.toggle("menu-acik");
    menu.setAttribute("aria-expanded", acik);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && bar.classList.contains("menu-acik")) { bar.classList.remove("menu-acik"); menu.setAttribute("aria-expanded", false); menu.focus(); }
  });

  // Dark mode: follows the phone/computer setting until the visitor picks one.
  const kok = document.documentElement;
  const karanlikMi = () => (kok.dataset.tema || (matchMedia("(prefers-color-scheme: dark)").matches ? "karanlik" : "aydinlik")) === "karanlik";
  $("temaDugme").addEventListener("click", () => {
    const yeni = karanlikMi() ? "aydinlik" : "karanlik";
    kok.dataset.tema = yeni;
    sakla("tema", yeni);
  });

  // The header shrinks after scrolling; a button returns to the top on long pages.
  const yukari = $("yukari");
  let bekle = false;
  addEventListener("scroll", () => {
    if (bekle) return;
    bekle = true;
    requestAnimationFrame(() => {
      bar.classList.toggle("kucuk", scrollY > 80);
      yukari.hidden = scrollY < 900;
      bekle = false;
    });
  }, { passive: true });
  yukari.addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));

  // Newsletter sign-up
  const form = $("bultenForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const durum = form.querySelector(".bulten-durum");
    durum.textContent = "Kaydediliyor…";
    try {
      const r = await fetch("/api/bulten", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eposta: $("bultenEposta").value, izin: true }) });
      const j = await r.json();
      durum.textContent = j.mesaj || j.hata || "Bir sorun oldu.";
      if (r.ok) form.reset();
    } catch (h) { durum.textContent = "Şu an kaydedilemedi. Biraz sonra tekrar deneyin."; }
  });

  // Install as an app and keep recently viewed pages for weak connections.
  if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("/sw.js").catch(() => {});
})();
