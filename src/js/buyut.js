// Click a photo in an article or on a release card to see it large; arrows move between photos.
(() => {
  const SECICI = "main .foto img, main .cikis-gorsel img, main article > img.kapak";
  let liste = [], sira = 0;
  const d = document.createElement("dialog");
  d.className = "buyut";
  d.innerHTML = `<button type="button" class="buyut-kapat" aria-label="Kapat">✕</button>
    <button type="button" class="buyut-ok onceki" aria-label="Önceki">‹</button>
    <figure><img alt=""><figcaption></figcaption></figure>
    <button type="button" class="buyut-ok sonraki" aria-label="Sonraki">›</button>`;
  const img = d.querySelector("img"), alt = d.querySelector("figcaption");

  function goster(i) {
    sira = (i + liste.length) % liste.length;
    const k = liste[sira];
    img.src = k.currentSrc || k.src;
    img.alt = k.alt;
    alt.innerHTML = k.closest("figure")?.querySelector("figcaption")?.innerHTML || "";
    d.querySelectorAll(".buyut-ok").forEach((b) => (b.hidden = liste.length < 2));
  }

  document.addEventListener("click", (e) => {
    const k = e.target.closest(SECICI);
    if (!k) return;
    liste = [...document.querySelectorAll(SECICI)];
    if (!d.isConnected) document.body.append(d);
    goster(liste.indexOf(k));
    d.showModal();
  });
  d.addEventListener("click", (e) => {
    if (e.target.closest(".onceki")) goster(sira - 1);
    else if (e.target.closest(".sonraki")) goster(sira + 1);
    else if (e.target === d || e.target.closest(".buyut-kapat")) d.close();
  });
  d.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") goster(sira - 1);
    if (e.key === "ArrowRight") goster(sira + 1);
  });
  // Swipe on phones.
  let x0 = null;
  d.addEventListener("touchstart", (e) => (x0 = e.touches[0].clientX), { passive: true });
  d.addEventListener("touchend", (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) goster(sira + (dx < 0 ? 1 : -1));
    x0 = null;
  });
})();
