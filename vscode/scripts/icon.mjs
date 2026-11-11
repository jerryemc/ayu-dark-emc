#!/usr/bin/env node
// Draw icon.png (256x256): a tiny editor window showing "code" in the palette.
// No dependencies: shapes are rasterized with 4x4 supersampling and written
// as a PNG with node:zlib.

import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const out = resolve(dirname(fileURLToPath(import.meta.url)), "..", "icon.png");
const S = 256;
const SS = 4;

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const col = {
  bg: hex("#121210"),
  bar: hex("#222224"),
  hl: hex("#31302C"),
  grey: hex("#7C8474"),
  orange: hex("#FD9D44"),
  blue: hex("#43A9E3"),
  bblue: hex("#97D5FE"),
  lime: hex("#98B91F"),
  cyan: hex("#19B3AD"),
  purple: hex("#CE9AFD"),
  yellow: hex("#E6C61D"),
  red: hex("#F1685B"),
  peach: hex("#FCD1B0"),
  white: hex("#EFEBE0"),
};

// Shapes painted in order: [test(x, y), color]
const shapes = [];
const roundRect = (x0, y0, x1, y1, r, color) =>
  shapes.push([(x, y) => {
    if (x < x0 || x > x1 || y < y0 || y > y1) return false;
    const cx = Math.min(Math.max(x, x0 + r), x1 - r);
    const cy = Math.min(Math.max(y, y0 + r), y1 - r);
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
  }, color]);
const circle = (cx, cy, r, color) =>
  shapes.push([(x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r, color]);

// window
roundRect(8, 8, 248, 248, 44, col.bg);
// title bar dots
circle(46, 44, 9, col.red);
circle(74, 44, 9, col.yellow);
circle(102, 44, 9, col.lime);
// highlighted current line
roundRect(28, 138, 228, 166, 6, col.hl);

// code lines: [y, [[x0, x1, color], ...]]
const H = 14;
const lines = [
  [80, [[36, 76, col.orange], [86, 140, col.blue], [148, 160, col.peach], [168, 196, col.bblue], [204, 216, col.peach]]],
  [116, [[60, 100, col.orange], [110, 150, col.purple], [158, 170, col.peach], [178, 218, col.cyan]]],
  [145, [[60, 88, col.bblue], [96, 108, col.peach], [116, 196, col.lime]]],
  [181, [[60, 108, col.grey], [116, 168, col.grey]]],
  [210, [[36, 92, col.orange], [100, 140, col.white]]],
];
for (const [y, segs] of lines) {
  for (const [x0, x1, color] of segs) roundRect(x0, y, x1, y + H, H / 2, color);
}

const px = Buffer.alloc(S * (S * 4 + 1));
for (let y = 0; y < S; y++) {
  px[y * (S * 4 + 1)] = 0; // filter: none
  for (let x = 0; x < S; x++) {
    let r = 0, g = 0, b = 0, a = 0;
    for (let sy = 0; sy < SS; sy++) {
      for (let sx = 0; sx < SS; sx++) {
        const fx = x + (sx + 0.5) / SS;
        const fy = y + (sy + 0.5) / SS;
        let c = null;
        for (const [hit, color] of shapes) if (hit(fx, fy)) c = color;
        if (c) { r += c[0]; g += c[1]; b += c[2]; a += 1; }
      }
    }
    const o = y * (S * 4 + 1) + 1 + x * 4;
    px[o] = a ? r / a : 0;
    px[o + 1] = a ? g / a : 0;
    px[o + 2] = a ? b / a : 0;
    px[o + 3] = (a / (SS * SS)) * 255;
  }
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(S, 0);
ihdr.writeUInt32BE(S, 4);
ihdr[8] = 8;  // bit depth
ihdr[9] = 6;  // RGBA
writeFileSync(out, Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(px, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]));
console.log(`Wrote ${out}`);
