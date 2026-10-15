// Article page: share buttons and comments.
(() => {
  const $ = (id) => document.getElementById(id);
  const kacis = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  const yerel = document.querySelector(".paylas-yerel");
  if (navigator.share) {
    yerel.hidden = false;
    yerel.addEventListener("click", () => navigator.share({ title: document.title, url: location.href }).catch(() => {}));
  }
  document.querySelector(".paylas-kopyala").addEventListener("click", async (e) => {
    try { await navigator.clipboard.writeText(location.href); e.target.textContent = "Kopyalandı"; } catch (h) { prompt("Bağlantı:", location.href); }
  });

  const bolum = $("yorumlar"), sayfa = bolum.dataset.sayfa;
  const tarih = (t) => new Date(t * 1000).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  async function yukle() {
    try {
      const j = await (await fetch(`/api/yorum?sayfa=${encodeURIComponent(sayfa)}`)).json();
      if (j.kapali) { bolum.hidden = true; return; }
      $("yorumListe").innerHTML = j.yorumlar.length
        ? `<ul class="yorum-liste">${j.yorumlar.map((y) => `<li><strong>${kacis(y.ad)}</strong> <span class="meta">${tarih(y.tarih)}</span><p>${kacis(y.metin)}</p></li>`).join("")}</ul>`
        : '<p class="meta">Henüz yorum yok. İlk yorumu siz yazın.</p>';
    } catch (h) { $("yorumListe").innerHTML = '<p class="meta">Yorumlar şu an yüklenemedi.</p>'; }
  }
  yukle();
  document.addEventListener("DOMContentLoaded", () => Uye.hazir.then((d) => {
    if (d.kapali) return;
    if (d.uye) $("yorumForm").hidden = false; else $("yorumGiris").hidden = false;
  }));
  $("yorumForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    $("yorumDurum").textContent = "Gönderiliyor…";
    const r = await fetch("/api/yorum", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sayfa, metin: $("yorumMetin").value }) });
    const j = await r.json().catch(() => ({}));
    $("yorumDurum").textContent = j.mesaj || j.hata || "Gönderilemedi.";
    if (r.ok) $("yorumMetin").value = "";
  });
})();
