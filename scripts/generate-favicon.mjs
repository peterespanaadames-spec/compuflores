// Genera favicon.png (64), apple-touch-icon.png (180) y favicon.ico (32/48/64)
// con la misma geometria que public/favicon.svg: cuadrado azul marino
// redondeado, "F" blanca gruesa y punto amarillo arriba a la derecha.
// Ejecutar: node scripts/generate-favicon.mjs
import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';

const NAVY = [31, 44, 91];       // #1F2C5B
const YELLOW = [242, 195, 48];   // #F2C330
const WHITE = [255, 255, 255];
const ALPHA = 255;

function insideRoundedRect(x, y, r) {
  const min = r, max = 1 - r;
  const dx = x < min ? min - x : x > max ? x - max : 0;
  const dy = y < min ? min - y : y > max ? y - max : 0;
  return dx * dx + dy * dy <= r * r;
}
function insideF(x, y) {
  return (x >= 0.28 && x <= 0.415 && y >= 0.24 && y <= 0.77)      // verticales
    || (x >= 0.28 && x <= 0.65 && y >= 0.24 && y <= 0.39)         // barra superior
    || (x >= 0.28 && x <= 0.59 && y >= 0.455 && y <= 0.60);       // barra media
}
function insideDot(x, y) {
  const dx = x - 0.73, dy = y - 0.15;
  return dx * dx + dy * dy <= 0.095 * 0.095;
}

function sample(px, py, rounded) {
  if (rounded && !insideRoundedRect(px, py, 0.22)) return [0, 0, 0, 0];
  if (insideDot(px, py)) return [...YELLOW, ALPHA];
  if (insideF(px, py)) return [...WHITE, ALPHA];
  return [...NAVY, ALPHA];
}

function render(size, { rounded, ss }) {
  const buf = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const [sr, sg, sb, sa] = sample((px + (sx + 0.5) / ss) / size, (py + (sy + 0.5) / ss) / size, rounded);
          r += sr * sa; g += sg * sa; b += sb * sa; a += sa;
        }
      }
      const n = ss * ss;
      const i = (py * size + px) * 4;
      if (a > 0) {
        buf[i] = Math.round(r / a);
        buf[i + 1] = Math.round(g / a);
        buf[i + 2] = Math.round(b / a);
        buf[i + 3] = Math.round(a / n);
      }
    }
  }
  return buf;
}

// ---- PNG (RGBA) -------------------------------------------------------------
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
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}
function encodePng(rgba, size) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // color type RGBA
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

// ---- ICO (contenedor de PNG, soportado por todos los navegadores) -----------
function encodeIco(pngs) {
  const count = pngs.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2); // tipo 1 = icono
  header.writeUInt16LE(count, 4);
  const dirSize = 16 * count;
  const entries = [];
  let offset = 6 + dirSize;
  const dirBufs = [];
  for (const { size, png } of pngs) {
    const entry = Buffer.alloc(16);
    entry[0] = size === 256 ? 0 : size;
    entry[1] = size === 256 ? 0 : size;
    entry.writeUInt16LE(1, 4);   // planos
    entry.writeUInt16LE(32, 6);  // bits por pixel
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    dirBufs.push(entry);
    entries.push(png);
    offset += png.length;
  }
  return Buffer.concat([header, ...dirBufs, ...entries]);
}

const publicDir = path.resolve('public');
fs.writeFileSync(path.join(publicDir, 'favicon.png'), encodePng(render(64, { rounded: true, ss: 8 }), 64));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), encodePng(render(180, { rounded: false, ss: 3 }), 180));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), encodeIco([
  { size: 32, png: encodePng(render(32, { rounded: true, ss: 12 }), 32) },
  { size: 48, png: encodePng(render(48, { rounded: true, ss: 8 }), 48) },
  { size: 64, png: encodePng(render(64, { rounded: true, ss: 8 }), 64) }
]));
console.log('favicon generados en public/: favicon.png, apple-touch-icon.png, favicon.ico');
