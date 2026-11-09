/**
 * Generador de íconos PNG para la PWA "Mi Billetera Lite".
 * No usa dependencias externas: dibuja con SDF (antialias) y codifica PNG con node:zlib.
 *
 *   node scripts/generate-icons.mjs
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');

/* ---------------------------- PNG encoder ---------------------------- */
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePNG(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: None
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ------------------------------ dibujo ------------------------------- */
// Color de marca (#10B981), plano: sin degradados.
const BG = [0x10, 0xb9, 0x81];
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const mix = (a, b, t) => a + (b - a) * t;

// distancia con signo a un rectángulo redondeado centrado en (cx, cy)
function sdRoundRect(px, py, cx, cy, halfW, halfH, r) {
  const qx = Math.abs(px - cx) - (halfW - r);
  const qy = Math.abs(py - cy) - (halfH - r);
  const ax = Math.max(qx, 0);
  const ay = Math.max(qy, 0);
  return Math.hypot(ax, ay) + Math.min(Math.max(qx, qy), 0) - r;
}

function sdCircle(px, py, cx, cy, r) {
  return Math.hypot(px - cx, py - cy) - r;
}

function drawIcon(size, { maskable = false } = {}) {
  const buf = Buffer.alloc(size * size * 4);
  const S = size;
  // El glifo se encoge en los íconos maskable para respetar la zona segura (80%).
  const glyphScale = maskable ? 0.56 : 0.72;
  const g = S * glyphScale;          // ancho del glifo
  const cx = S / 2;
  const cy = S / 2;

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const px = x + 0.5;
      const py = y + 0.5;

      // Fondo: color sólido (a sangre, requisito de los íconos maskable)
      let r = BG[0];
      let gg = BG[1];
      let b = BG[2];

      // ---- glifo: cartera con tarjeta asomando ----
      const bodyHalfW = g * 0.5;
      const bodyHalfH = g * 0.33;
      const bodyCy = cy + g * 0.08;
      const dBody = sdRoundRect(px, py, cx, bodyCy, bodyHalfW, bodyHalfH, g * 0.12);
      // tarjeta que asoma por arriba
      const dCard = sdRoundRect(px, py, cx, cy - g * 0.28, g * 0.38, g * 0.16, g * 0.06);
      // botón / clip de la cartera
      const dClip = sdCircle(px, py, cx + bodyHalfW * 0.56, bodyCy, g * 0.08);

      const aa = Math.max(1, S / 192); // ancho del antialias en px
      const covBody = clamp(0.5 - dBody / aa, 0, 1);
      const covCard = clamp(0.5 - dCard / aa, 0, 1);
      const covClip = clamp(0.5 - dClip / aa, 0, 1);

      // tarjeta: blanco translúcido, se dibuja detrás del cuerpo
      const cardOnly = clamp(covCard - covBody, 0, 1);
      r = mix(r, 255, cardOnly * 0.62);
      gg = mix(gg, 255, cardOnly * 0.62);
      b = mix(b, 255, cardOnly * 0.62);
      // cuerpo blanco
      r = mix(r, 255, covBody);
      gg = mix(gg, 255, covBody);
      b = mix(b, 255, covBody);
      // clip: recorte del color de fondo sobre el cuerpo blanco
      const clipCov = covClip * covBody;
      r = mix(r, BG[0], clipCov);
      gg = mix(gg, BG[1], clipCov);
      b = mix(b, BG[2], clipCov);

      const i = (y * S + x) * 4;
      buf[i] = Math.round(r);
      buf[i + 1] = Math.round(gg);
      buf[i + 2] = Math.round(b);
      buf[i + 3] = 255;
    }
  }
  return encodePNG(S, S, buf);
}

mkdirSync(OUT_DIR, { recursive: true });
const files = [
  ['icon-192.png', drawIcon(192)],
  ['icon-512.png', drawIcon(512)],
  ['icon-maskable-192.png', drawIcon(192, { maskable: true })],
  ['icon-maskable-512.png', drawIcon(512, { maskable: true })],
  ['apple-touch-icon.png', drawIcon(180)],
  ['favicon-64.png', drawIcon(64)],
];
for (const [name, data] of files) {
  writeFileSync(resolve(OUT_DIR, name), data);
  console.log('✓', name, `(${(data.length / 1024).toFixed(1)} KB)`);
}
