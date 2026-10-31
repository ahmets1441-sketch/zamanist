// Runway behaviour for every [data-podyum]: the active look follows scrolling and the arrows, a pin opens its product
// card (Esc or a click elsewhere closes it), and the "Bu kombinde" list shows the active look's products.
(() => {
  const azHareket = matchMedia("(prefers-reduced-motion: reduce)");
  for (const kok of document.querySelectorAll("[data-podyum]")) {
    const serit = kok.querySelector(".podyum-serit");
    const looks = [...kok.querySelectorAll(".podyum-look")];
    const listeler = [...kok.querySelectorAll(".podyum-liste ul[data-look]")];
    const cizgiler = [...kok.querySelectorAll(".podyum-ilerleme span")];
    let aktif = 0, hedef = null;

    const kapat = () => kok.querySelectorAll('.podyum-pin[aria-expanded="true"]').forEach((p) => {
      p.setAttribute("aria-expanded", "false");
      document.getElementById(p.getAttribute("aria-controls")).hidden = true;
    });
    const sec = (i) => {
      if (i !== aktif) kapat();
      aktif = i;
      looks.forEach((l, j) => {
        l.classList.toggle("aktif", j === i);
        l.querySelectorAll(".podyum-pin").forEach((p) => { p.tabIndex = j === i ? 0 : -1; });
      });
      listeler.forEach((u) => { u.hidden = u.dataset.look !== "hepsi" && Number(u.dataset.look) !== i; });
      cizgiler.forEach((c, j) => c.classList.toggle("aktif", j === i));
    };
    const git = (i) => {
      const n = (i + looks.length) % looks.length, l = looks[n];
      hedef = n;
      serit.scrollTo({ left: l.offsetLeft - (serit.clientWidth - l.offsetWidth) / 2, behavior: azHareket.matches ? "auto" : "smooth" });
      sec(n);
    };

    kok.querySelector(".podyum-onceki")?.addEventListener("click", () => git(aktif - 1));
    kok.querySelector(".podyum-sonraki")?.addEventListener("click", () => git(aktif + 1));
    looks.forEach((l, j) => l.addEventListener("click", (e) => {
      if (j !== aktif && !e.target.closest(".podyum-kart")) { e.preventDefault(); git(j); }
    }));
    kok.querySelectorAll(".podyum-pin").forEach((p) => p.addEventListener("click", (e) => {
      e.stopPropagation();
      const acik = p.getAttribute("aria-expanded") === "true";
      kapat();
      if (!acik) { p.setAttribute("aria-expanded", "true"); document.getElementById(p.getAttribute("aria-controls")).hidden = false; }
    }));
    document.addEventListener("click", (e) => { if (!e.target.closest(".podyum-kart, .podyum-pin")) kapat(); });
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      // Focus inside the card would vanish with it: hand it back to the pin that opened it.
      const kart = document.activeElement?.closest(".podyum-kart");
      const pin = kart && kok.querySelector(`.podyum-pin[aria-controls="${kart.id}"]`);
      kapat();
      pin?.focus();
    });

    // Swiping: when scrolling settles, the look nearest the strip's centre becomes active. A scroll started by git()
    // keeps its target, since the first and last looks cannot always reach the centre.
    let bekle;
    serit.addEventListener("scroll", () => {
      clearTimeout(bekle);
      bekle = setTimeout(() => {
        if (hedef !== null) { sec(hedef); hedef = null; return; }
        const orta = serit.scrollLeft + serit.clientWidth / 2;
        let en = 0;
        looks.forEach((l, j) => {
          if (Math.abs(l.offsetLeft + l.offsetWidth / 2 - orta) < Math.abs(looks[en].offsetLeft + looks[en].offsetWidth / 2 - orta)) en = j;
        });
        sec(en);
      }, 120);
    }, { passive: true });
    kok.classList.add("hazir");
    sec(0);
  }
})();
