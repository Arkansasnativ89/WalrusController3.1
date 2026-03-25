/**
 * generate-icons.mjs — Pure Node.js PWA icon generator
 *
 * Draws a knob-arc icon matching the app's visual identity:
 *   - Dark background (#121212)
 *   - Cyan arc (#1ED6D0) mimicking the Knob component's sweep
 *   - Position dot at ~75% sweep
 *   - Rounded corners on standard icons; full-bleed on maskable
 *
 * Outputs PNG files to public/icons/ using only Node built-ins (zlib + fs).
 */

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = resolve(__dirname, '..', 'public', 'icons');

// ── Colors ──────────────────────────────────────────────────────────────────

const BG = [0x12, 0x12, 0x12];
const CYAN = [0x1E, 0xD6, 0xD0];
const TRACK = [0x33, 0x33, 0x33];
const WHITE = [0xFF, 0xFF, 0xFF];

// ── Geometry (matches Knob.tsx: 225° start, 270° sweep) ─────────────────────

const START_ANGLE_DEG = 225;
const SWEEP_DEG = 270;
const VALUE_NORM = 0.75; // dot at 75% of sweep

function degToRad(d) { return (d - 90) * Math.PI / 180; }

// ── Pixel Helpers ───────────────────────────────────────────────────────────

function dist(x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

/** Signed distance from point to a circular arc segment. Negative = inside arc stroke. */
function arcSDF(px, py, cx, cy, r, startDeg, endDeg, strokeW) {
  const dx = px - cx;
  const dy = py - cy;
  const d = Math.sqrt(dx * dx + dy * dy);
  // angle of point relative to center
  let angle = Math.atan2(dy, dx) * 180 / Math.PI + 90; // +90 to match our convention
  if (angle < 0) angle += 360;

  // Normalize arc range
  let s = ((startDeg % 360) + 360) % 360;
  let e = s + ((endDeg - startDeg + 360) % 360);
  let a = angle;
  if (a < s) a += 360;

  const onArc = a >= s && a <= e;
  const radialDist = Math.abs(d - r);

  if (onArc) {
    return radialDist - strokeW / 2;
  }
  // Distance to nearest arc endpoint
  const sRad = degToRad(startDeg);
  const eRad = degToRad(endDeg);
  const sx = cx + r * Math.cos(sRad);
  const sy = cy + r * Math.sin(sRad);
  const ex = cx + r * Math.cos(eRad);
  const ey = cy + r * Math.sin(eRad);
  const dStart = dist(px, py, sx, sy);
  const dEnd = dist(px, py, ex, ey);
  return Math.min(dStart, dEnd) - strokeW / 2;
}

/** Rounded-rect SDF (negative inside) */
function roundedRectSDF(px, py, x, y, w, h, r) {
  const dx = Math.max(Math.abs(px - (x + w / 2)) - w / 2 + r, 0);
  const dy = Math.max(Math.abs(py - (y + h / 2)) - h / 2 + r, 0);
  return Math.sqrt(dx * dx + dy * dy) - r;
}

// ── Icon Renderer ───────────────────────────────────────────────────────────

function renderIcon(size, maskable) {
  const buf = new Uint8Array(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;

  // Maskable icons need 10% safe zone padding; standard icons use ~12% for rounded corners
  const padding = maskable ? size * 0.20 : size * 0.12;
  const contentR = (size / 2) - padding;

  const arcR = contentR * 0.7;
  const strokeW = Math.max(4, size * 0.045);
  const dotR = Math.max(3, size * 0.035);
  const cornerR = maskable ? 0 : size * 0.15;

  const endAngle = START_ANGLE_DEG + SWEEP_DEG;
  const valueAngle = START_ANGLE_DEG + VALUE_NORM * SWEEP_DEG;

  // Dot position
  const dotAngleRad = degToRad(valueAngle);
  const dotX = cx + arcR * Math.cos(dotAngleRad);
  const dotY = cy + arcR * Math.sin(dotAngleRad);

  // Small "W" letter approximation using line segments below the knob
  // Not needed — the knob arc IS the brand mark

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      let r = BG[0], g = BG[1], b = BG[2], a = 255;

      // Rounded rect mask (standard only)
      if (!maskable) {
        const sdf = roundedRectSDF(x, y, 0, 0, size, size, cornerR);
        if (sdf > 1) { a = 0; buf[idx] = 0; buf[idx+1] = 0; buf[idx+2] = 0; buf[idx+3] = 0; continue; }
        if (sdf > 0) { a = Math.round(255 * (1 - sdf)); }
      }

      // Track arc (full sweep, dim)
      const trackSDF = arcSDF(x, y, cx, cy, arcR, START_ANGLE_DEG, endAngle, strokeW);
      if (trackSDF < 1) {
        const coverage = Math.max(0, Math.min(1, 1 - trackSDF));
        r = Math.round(r + (TRACK[0] - r) * coverage);
        g = Math.round(g + (TRACK[1] - g) * coverage);
        b = Math.round(b + (TRACK[2] - b) * coverage);
      }

      // Value arc (partial sweep, cyan)
      const valueSDF = arcSDF(x, y, cx, cy, arcR, START_ANGLE_DEG, valueAngle, strokeW);
      if (valueSDF < 1) {
        const coverage = Math.max(0, Math.min(1, 1 - valueSDF));
        r = Math.round(r + (CYAN[0] - r) * coverage);
        g = Math.round(g + (CYAN[1] - g) * coverage);
        b = Math.round(b + (CYAN[2] - b) * coverage);
      }

      // Dot
      const dd = dist(x, y, dotX, dotY) - dotR;
      if (dd < 1) {
        const coverage = Math.max(0, Math.min(1, 1 - dd));
        r = Math.round(r + (WHITE[0] - r) * coverage);
        g = Math.round(g + (WHITE[1] - g) * coverage);
        b = Math.round(b + (WHITE[2] - b) * coverage);
      }

      // Glow around dot (soft cyan)
      const glowR = dotR * 3.5;
      const glowD = dist(x, y, dotX, dotY);
      if (glowD < glowR && dd > 0) {
        const intensity = Math.pow(1 - glowD / glowR, 2) * 0.3;
        r = Math.round(r + (CYAN[0] - r) * intensity);
        g = Math.round(g + (CYAN[1] - g) * intensity);
        b = Math.round(b + (CYAN[2] - b) * intensity);
      }

      // Center dot (small, subtle)
      const centerD = dist(x, y, cx, cy) - size * 0.03;
      if (centerD < 1) {
        const coverage = Math.max(0, Math.min(1, 1 - centerD));
        const gray = 0x44;
        r = Math.round(r + (gray - r) * coverage);
        g = Math.round(g + (gray - g) * coverage);
        b = Math.round(b + (gray - b) * coverage);
      }

      buf[idx] = r;
      buf[idx + 1] = g;
      buf[idx + 2] = b;
      buf[idx + 3] = a;
    }
  }

  return buf;
}

// ── PNG Encoder (minimal, spec-compliant) ───────────────────────────────────

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let j = 0; j < 8; j++) {
      c = (c >>> 1) ^ (c & 1 ? 0xEDB88320 : 0);
    }
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([len, typeAndData, crc]);
}

function encodePNG(pixels, width, height) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // IDAT — each row gets a filter byte (0 = None) prepended
  const rowLen = width * 4 + 1;
  const raw = Buffer.alloc(height * rowLen);
  for (let y = 0; y < height; y++) {
    raw[y * rowLen] = 0; // filter: None
    pixels.copy
      ? Buffer.from(pixels.buffer, pixels.byteOffset, pixels.byteLength).copy(raw, y * rowLen + 1, y * width * 4, (y + 1) * width * 4)
      : Buffer.from(pixels.buffer).copy(raw, y * rowLen + 1, y * width * 4, (y + 1) * width * 4);
  }
  const compressed = deflateSync(raw, { level: 9 });

  // IEND
  const iend = Buffer.alloc(0);

  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', iend),
  ]);
}

// ── Main ────────────────────────────────────────────────────────────────────

mkdirSync(ICONS_DIR, { recursive: true });

const icons = [
  { name: 'icon-192.png', size: 192, maskable: false },
  { name: 'icon-512.png', size: 512, maskable: false },
  { name: 'icon-512-maskable.png', size: 512, maskable: true },
];

for (const { name, size, maskable } of icons) {
  console.log(`Generating ${name} (${size}x${size}, maskable=${maskable})...`);
  const pixels = renderIcon(size, maskable);
  const png = encodePNG(pixels, size, size);
  writeFileSync(resolve(ICONS_DIR, name), png);
  console.log(`  -> ${png.length} bytes`);
}

console.log('Done.');
