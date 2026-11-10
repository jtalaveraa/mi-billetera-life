# Mi Billetera Lite

PWA para registrar gastos diarios que **funciona al 100 % sin conexión**.
Práctica 2 – Unidad 1 (Aplicaciones Web Progresivas).

Construida con **React + Vite**, `manifest.json` propio, un **Service Worker escrito a mano**
(`install` / `activate` / `fetch` con estrategia *Cache First, Network Fallback*) y persistencia
local en **IndexedDB**.

---

## 1. Qué hace

| Requisito del enunciado | Dónde está implementado |
| --- | --- |
| Formulario: concepto, monto, categoría (Comida, Transporte, Servicios, Ocio, Otros) y botón guardar | [`src/components/ExpenseForm.jsx`](src/components/ExpenseForm.jsx) |
| Historial de gastos, del más reciente al más antiguo | [`src/components/ExpenseList.jsx`](src/components/ExpenseList.jsx) + `getGastos()` en [`src/db.js`](src/db.js) |
| Totalizador visual en la parte superior | [`src/components/SummaryCard.jsx`](src/components/SummaryCard.jsx) |
| Diseño responsivo *Mobile First* | [`src/styles.css`](src/styles.css) |
| Web App Manifest (`name`, `short_name`, `theme_color`, `background_color`, `display: standalone`) | [`public/manifest.json`](public/manifest.json) |
| Íconos 192×192 y 512×512, incluidos *maskable* | [`public/icons/`](public/icons) (generados por [`scripts/generate-icons.mjs`](scripts/generate-icons.mjs)) |
| Service Worker: `install` (cachea App Shell), `activate` (limpia cachés viejas), `fetch` (Cache First) | [`public/sw.js`](public/sw.js) |
| Persistencia local sin servidor | [`src/db.js`](src/db.js) — IndexedDB con respaldo automático a `localStorage` |
| HTTPS / localhost | GitHub Pages sirve con HTTPS; en desarrollo se usa `localhost` |

**Extras** incluidos: botón "Instalar", aviso visible cuando no hay conexión y filtro del
historial por categoría.

---

## 2. Cómo ejecutarlo

Requisitos: Node.js 18 o superior.

```bash
npm install
```

### Desarrollo (sin Service Worker)

```bash
npm run dev
```

Abre `http://localhost:5173`. El Service Worker se desactiva a propósito en modo desarrollo
(una estrategia *Cache First* rompería el hot reload); ver [`src/registerSW.js`](src/registerSW.js).

### Producción (con Service Worker, para probar el modo offline)

```bash
npm run build && npm run preview
```

Abre `http://localhost:4173`. Aquí sí se registra el Service Worker, así que es el modo
correcto para correr Lighthouse y las pruebas offline.

### Regenerar los íconos

```bash
node scripts/generate-icons.mjs
```

---

## 3. Cómo verificar los criterios de aceptación

Hazlo sobre `npm run preview` (localhost) o sobre la URL publicada en GitHub Pages.

1. **Prueba de instalación** — abre la app en Chrome. Aparece el ícono de instalar en la barra
   de direcciones (o el botón "Instalar" dentro de la app). Al instalarla abre en ventana propia,
   sin barra de direcciones, porque el manifest declara `"display": "standalone"`.
2. **Auditoría de PWA** — importante: desde **Lighthouse 12** (Chrome 126 en adelante) la
   categoría **PWA fue retirada** de DevTools; hoy solo quedan Performance, Accessibility,
   Best Practices y SEO. Así que hay dos caminos:

   **a) Lighthouse 11 por línea de comandos** (sigue trayendo la categoría PWA). Con
   `npm run preview` corriendo, en otra terminal:

   ```bash
   npx -y lighthouse@11.7.1 http://localhost:4173 --only-categories=pwa --view
   ```

   Abre el reporte en el navegador al terminar. Resultado de este proyecto: **PWA 100/100**, con
   las cuatro auditorías automáticas en verde (instalabilidad, splash screen, theme color,
   ícono maskable) más las tres que Lighthouse marca como revisión manual.

   El reporte generado está guardado en
   [`docs/auditoria-lighthouse-pwa.html`](docs/auditoria-lighthouse-pwa.html); ábrelo en el
   navegador para verlo.

   **b) Panel *Application* de DevTools** (lo que Chrome usa hoy para lo mismo):
   - *Manifest*: muestra nombre, `display: standalone`, colores e íconos, y arriba el aviso de
     instalabilidad.
   - *Service Workers*: `sw.js` debe aparecer como **activated and is running**.
   - *Cache Storage → mi-billetera-lite-vX*: deben estar los 11 archivos del App Shell.
3. **Supervivencia offline** — DevTools → pestaña *Network* → throttling en **Offline** → recarga
   con F5. La página carga completa, con estilos y lógica, desde la caché del Service Worker.
4. **Persistencia sin red** — en modo **Offline**, agrega un gasto (por ejemplo "Taxis", $150).
   Cierra la pestaña, vuelve a abrirla sin conexión: el gasto sigue en el historial y el total
   refleja la suma correcta (los datos viven en IndexedDB, en el dispositivo).

> Comprobado localmente apagando por completo el servidor y recargando: la app carga, permite
> registrar gastos nuevos y los conserva tras recargar.

---

## 4. Cómo funciona el Service Worker

`public/sw.js` se copia tal cual a `dist/` y se registra desde `src/registerSW.js`.

- **`install`** → abre la caché `mi-billetera-lite-v1.0.9` y guarda el App Shell:
  `index.html`, `assets/app.js`, `assets/app.css`, `manifest.json` y los íconos.
  Cada archivo se cachea por separado para que un 404 aislado no tire la instalación.
- **`activate`** → recorre `caches.keys()` y borra toda caché `mi-billetera-lite-*` cuyo nombre
  no coincida con la versión actual; luego toma el control de las pestañas abiertas (`clients.claim()`).
- **`fetch`** → solo intercepta peticiones `GET` del mismo origen.
  - Navegaciones → responde con el `index.html` cacheado.
  - Resto de archivos → **Cache First**: si está en caché lo devuelve; si no, va a la red y guarda
    una copia; si la red también falla, responde un mensaje de error controlado.

Los nombres de los archivos generados son fijos (`assets/app.js`, `assets/app.css`, sin hash,
configurado en [`vite.config.js`](vite.config.js)) justamente para poder listarlos a mano en el App Shell.

> **Al publicar cambios**: sube `CACHE_VERSION` en `public/sw.js` (por ejemplo a `v1.1.0`).
> Si no lo haces, los navegadores que ya visitaron la app seguirán sirviendo la versión vieja
> desde la caché. Al cambiar la versión, el evento `activate` borra la caché anterior sola.
>
> Además, `src/registerSW.js` escucha el evento `controllerchange`: en cuanto el Service Worker
> nuevo toma el control de la pestaña, la página se recarga una sola vez, así que la versión
> recién publicada se ve sin tener que vaciar la caché a mano. (En la primera visita no recarga,
> porque todavía no había un Service Worker controlando la página.)

> **Si estando offline ves una versión anterior de la app**: es el comportamiento esperado de
> *Cache First*. Sin red, el Service Worker solo puede servir lo que guardó la última vez que
> abriste la app **con conexión**; no tiene forma de enterarse de que hay una versión nueva.
> La solución es abrir la app una vez en línea (ahí se instala la caché nueva y la página se
> recarga sola) y después volver a probar sin conexión.
>
> Para forzar un estado limpio: DevTools → *Application* → *Service Workers* → **Unregister**, y
> *Application* → *Storage* → **Clear site data**. Ojo: eso también borra los gastos guardados
> en IndexedDB.

---

## 5. Publicación en GitHub Pages (pendiente de hacer)

La app ya está configurada para Pages: `base: './'` en `vite.config.js` hace que todas las rutas
sean relativas, por lo que funciona dentro de un subdirectorio como
`https://TU-USUARIO.github.io/mi-billetera-lite/`. También se incluye `public/.nojekyll`
para que GitHub Pages no procese el sitio con Jekyll.

### Paso 1 — Subir el código a GitHub

```bash
git init -b main
```

```bash
git add . && git commit -m "Mi Billetera Lite: PWA de gastos con soporte offline"
```

Crea el repositorio vacío en GitHub (por ejemplo `mi-billetera-lite`) y enlázalo:

```bash
git remote add origin https://github.com/TU-USUARIO/mi-billetera-lite.git
```

```bash
git push -u origin main
```

### Paso 2 — Activar GitHub Pages con Actions (opción recomendada)

El workflow ya está listo en [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml):
compila con `npm ci && npm run build` y publica la carpeta `dist/`.

1. En GitHub entra a **Settings → Pages**.
2. En *Build and deployment → Source* elige **GitHub Actions**.
3. Listo. Cada `git push` a `main` vuelve a publicar la app.
   El progreso se ve en la pestaña **Actions**; al terminar, la URL aparece en Settings → Pages.

La URL final será `https://TU-USUARIO.github.io/mi-billetera-lite/` (HTTPS, requisito del enunciado).

### Alternativa — Publicar la carpeta `dist/` a mano

Si prefieres no usar Actions, publica la rama `gh-pages` con el paquete `gh-pages`:

```bash
npm install --save-dev gh-pages
```

Agrega el script a `package.json`:

```json
"scripts": { "deploy": "npm run build && gh-pages -d dist" }
```

```bash
npm run deploy
```

Después, en **Settings → Pages** selecciona *Source: Deploy from a branch* → rama `gh-pages` → carpeta `/ (root)`.

### Paso 3 — Comprobar

1. Abre la URL en Chrome (desktop o Android) y confirma que aparece el ícono de instalar.
2. Corre Lighthouse → PWA sobre esa URL.
3. Activa *Offline* en DevTools y recarga.

> Nota: si ya habías abierto la app antes de un despliegue nuevo y ves la versión vieja,
> sube `CACHE_VERSION` en `public/sw.js`, o en DevTools → *Application → Service Workers*
> marca *Update on reload*.

---

## 6. Estructura del proyecto

```
mi-billetera-lite/
├─ .github/workflows/deploy.yml   # publicación automática en GitHub Pages
├─ public/
│  ├─ manifest.json               # Web App Manifest
│  ├─ sw.js                       # Service Worker (install / activate / fetch)
│  ├─ .nojekyll
│  └─ icons/                      # 192, 512, maskable, apple-touch
├─ scripts/generate-icons.mjs     # genera los PNG sin dependencias externas
├─ src/
│  ├─ components/
│  │  ├─ Header.jsx               # marca y botón de instalación
│  │  ├─ SummaryCard.jsx          # totalizador
│  │  ├─ ExpenseForm.jsx          # formulario de registro
│  │  └─ ExpenseList.jsx          # historial + filtros
│  ├─ App.jsx
│  ├─ db.js                       # IndexedDB (respaldo: localStorage)
│  ├─ categories.js               # catálogo de categorías
│  ├─ format.js                   # formato de moneda y fecha (es-MX)
│  ├─ registerSW.js
│  ├─ main.jsx
│  └─ styles.css
├─ index.html
└─ vite.config.js
```
