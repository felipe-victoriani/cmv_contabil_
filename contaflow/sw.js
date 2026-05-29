/* =============================================
   sw.js — Service Worker (PWA)
   Estratégia: Cache-first para assets estáticos,
   Network-first para Firebase/APIs externas.
   ============================================= */

const CACHE_NAME = "contaflow-v1";

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/main.js",
  "/manifest.json",
  "/styles/reset.css",
  "/styles/tokens.css",
  "/styles/typography.css",
  "/styles/animations.css",
  "/styles/global.css",
  "/components/modal/modal.css",
  "/components/toast/toast.css",
  "/components/topbar/topbar.css",
  "/components/topbar/topbar.js",
  "/components/modal/modal.js",
  "/components/toast/toast.js",
  "/components/icon/icon.js",
  "/pages/login/login.css",
  "/pages/login/login.js",
  "/pages/home/home.css",
  "/pages/home/home.js",
  "/pages/clientes/clientes.css",
  "/pages/clientes/clientes.js",
  "/pages/documentos/documentos.css",
  "/pages/documentos/documentos.js",
  "/pages/prazos/prazos.css",
  "/pages/prazos/prazos.js",
  "/pages/kanban/kanban.css",
  "/pages/kanban/kanban.js",
  "/router/router.js",
  "/store/app.store.js",
  "/config/firebase.js",
  "/services/auth.service.js",
  "/services/clientes.service.js",
  "/services/documentos.service.js",
  "/services/prazos.service.js",
  "/services/tarefas.service.js",
  "/services/usuarios.service.js",
  "/utils/css.utils.js",
  "/utils/date.utils.js",
  "/utils/frases.utils.js",
  "/utils/mask.utils.js",
  "/utils/sanitize.utils.js",
  "/utils/validators.js",
  "/images/favicon.svg",
  "/images/logo_cmv.jpeg",
];

// Hosts externos que nunca devem ser interceptados (Firebase, CDNs)
const BYPASS_HOSTS = [
  "firebaseapp.com",
  "firebase.google.com",
  "firebaseio.com",
  "googleapis.com",
  "gstatic.com",
  "fonts.googleapis.com",
  "unpkg.com",
];

function shouldBypass(url) {
  return BYPASS_HOSTS.some((host) => url.hostname.includes(host));
}

// ── Install: pré-cacheamento dos assets estáticos ──
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

// ── Activate: remove caches antigos ──
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

// ── Fetch: cache-first para assets locais, bypass para externos ──
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Ignorar requests que não são GET
  if (event.request.method !== "GET") return;

  // Ignorar Firebase, fontes e CDNs externos
  if (shouldBypass(url)) return;

  // Ignorar chrome-extension e outros esquemas
  if (!["http:", "https:"].includes(url.protocol)) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          // Cachear apenas respostas válidas de assets locais
          if (
            response.ok &&
            response.type === "basic" &&
            url.origin === self.location.origin
          ) {
            const cloned = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(event.request, cloned));
          }
          return response;
        })
        .catch(() => {
          // Fallback para navegação offline: retornar index.html
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
        });
    }),
  );
});
