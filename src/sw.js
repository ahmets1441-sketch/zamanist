// Offline support: pages are fetched fresh when online and served from the cache when not.
const SURUM = "zamanist-v1";
const ONCE = ["/", "/css/style.css", "/js/site.js", "/js/uye.js", "/js/buyut.js", "/img/logo.svg", "/404.html"];
self.addEventListener("install", (e) => e.waitUntil(caches.open(SURUM).then((c) => c.addAll(ONCE)).then(() => self.skipWaiting())));
self.addEventListener("activate", (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== SURUM).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin || u.pathname.startsWith("/api/") || u.pathname.startsWith("/admin/")) return;
  // Images: cache first. Everything else: network first, cache as fallback.
  if (r.destination === "image") {
    e.respondWith(caches.match(r).then((h) => h || fetch(r).then((y) => { const k = y.clone(); caches.open(SURUM).then((c) => c.put(r, k)); return y; })));
    return;
  }
  e.respondWith(fetch(r).then((y) => { if (y.ok) { const k = y.clone(); caches.open(SURUM).then((c) => c.put(r, k)); } return y; })
    .catch(() => caches.match(r).then((h) => h || (r.mode === "navigate" ? caches.match("/404.html") : undefined))));
});
