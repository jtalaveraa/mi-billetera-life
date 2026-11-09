/**
 * Registro del Service Worker.
 *
 * Solo se registra en la build de producción (`npm run build` + `npm run preview`
 * o el sitio publicado): en modo desarrollo Vite sirve los módulos sin empaquetar
 * y una estrategia Cache First rompería el hot reload.
 */
export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('[PWA] Este navegador no soporta Service Workers.');
    return;
  }

  if (!import.meta.env.PROD) {
    console.info('[PWA] Service Worker desactivado en modo desarrollo. Usa "npm run build && npm run preview" para probar el modo offline.');
    return;
  }

  // Cuando se publica una versión nueva, el Service Worker entrante hace
  // skipWaiting() + claim() y pasa a controlar esta pestaña. Al detectar ese
  // cambio recargamos una sola vez para que la página use ya los archivos
  // nuevos, en vez de seguir mostrando los de la caché anterior.
  const habiaControlador = Boolean(navigator.serviceWorker.controller);
  let recargando = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!habiaControlador || recargando) return;
    recargando = true;
    window.location.reload();
  });

  window.addEventListener('load', () => {
    const swUrl = `${import.meta.env.BASE_URL}sw.js`;
    navigator.serviceWorker
      .register(swUrl, { scope: import.meta.env.BASE_URL })
      .then((registration) => {
        console.info('[PWA] Service Worker registrado. Scope:', registration.scope);
      })
      .catch((error) => {
        console.error('[PWA] Falló el registro del Service Worker:', error);
      });
  });
}
