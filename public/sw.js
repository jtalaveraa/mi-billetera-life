/* =============================================================================
 * Mi Billetera Lite — Service Worker
 * Estrategia: Cache First, Network Fallback (sobre el App Shell).
 *
 *   install  -> precachea los archivos estáticos del App Shell.
 *   activate -> elimina las cachés de versiones anteriores.
 *   fetch    -> responde desde caché; si no existe, va a la red y guarda copia.
 * ========================================================================== */

const CACHE_VERSION = 'v1.0.9';
const CACHE_NAME = `mi-billetera-lite-${CACHE_VERSION}`;

/**
 * App Shell: todo lo necesario para renderizar la interfaz sin red.
 * Las rutas son relativas al scope del Service Worker, por lo que funcionan
 * igual en la raíz del dominio que en /mi-billetera-lite/ (GitHub Pages).
 */
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './assets/app.js',
  './assets/app.css',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-64.png',
];

/* ------------------------------ INSTALL ---------------------------------- */
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Se cachea archivo por archivo para que un 404 puntual no tire
      // la instalación completa del Service Worker.
      const results = await Promise.allSettled(
        APP_SHELL.map(async (url) => {
          const request = new Request(url, { cache: 'reload' });
          const response = await fetch(request);
          if (!response.ok) throw new Error(`${url} -> HTTP ${response.status}`);
          await cache.put(url, response);
        })
      );
      results
        .filter((r) => r.status === 'rejected')
        .forEach((r) => console.warn('[SW] No se pudo precachear:', r.reason));

      console.log(`[SW] App Shell cacheado en "${CACHE_NAME}"`);
      // Activa esta versión sin esperar a que se cierren las pestañas abiertas.
      await self.skipWaiting();
    })()
  );
});

/* ------------------------------ ACTIVATE --------------------------------- */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith('mi-billetera-lite-') && key !== CACHE_NAME)
          .map((key) => {
            console.log('[SW] Eliminando caché antigua:', key);
            return caches.delete(key);
          })
      );
      await self.clients.claim();
      console.log('[SW] Service Worker activo:', CACHE_VERSION);
    })()
  );
});

/* -------------------------------- FETCH ---------------------------------- */
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Solo se interceptan GET del mismo origen.
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navegaciones (recargar con F5, abrir la app instalada, deep links):
  // se responde siempre con el index.html del App Shell si está en caché.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        // ignoreVary: algunos servidores responden con "Vary: Origin" y sin esta
        // opcion la coincidencia en cache fallaria al recargar sin red.
        const cached = await caches.match('./index.html', { ignoreSearch: true, ignoreVary: true });
        if (cached) return cached;
        try {
          return await fetch(request);
        } catch (error) {
          return new Response(
            '<h1>Sin conexión</h1><p>Abre la aplicación una vez con internet para poder usarla offline.</p>',
            { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        }
      })()
    );
    return;
  }

  // Resto de recursos estáticos: Cache First, Network Fallback.
  event.respondWith(
    (async () => {
      const cached = await caches.match(request, { ignoreSearch: true, ignoreVary: true });
      if (cached) return cached;

      try {
        const response = await fetch(request);
        // Se guarda una copia para las siguientes visitas (runtime caching).
        if (response && response.ok && response.type === 'basic') {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, response.clone());
        }
        return response;
      } catch (error) {
        return new Response('Recurso no disponible sin conexión', {
          status: 504,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }
    })()
  );
});

/* --------------------------- MENSAJES DEL CLIENTE ------------------------- */
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
