// The World in One Day — 25 November 2026
// A gold-on-navy world atlas with eight news cards, rendered to PNG by a
// hand-written encoder. Node 22, standard library only. No network, no
// clock, no randomness: identical input always yields identical bytes.

import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const W = 1024;
const H = 1024;

// ---- palette ----
const NAVY_TOP: [number, number, number] = [10, 22, 51];
const NAVY_BOTTOM: [number, number, number] = [6, 13, 31];
const CARD_BG: [number, number, number] = [14, 30, 66];
const GOLD: [number, number, number] = [212, 175, 105];
const GOLD_DIM: [number, number, number] = [118, 100, 64];
const CREAM: [number, number, number] = [240, 230, 205];
const GRAY: [number, number, number] = [154, 167, 194];
const RED: [number, number, number] = [198, 48, 48];
const WHITE: [number, number, number] = [255, 255, 255];

// ---- the eight stories, all first reported Wednesday 25 November 2026 ----
type Story = {
  n: number;
  headline: string;
  sub1: string;
  sub2: string;
  lon: number;
  lat: number;
};

const STORIES: Story[] = [
  { n: 1, headline: "UKRAINE SINKS RUSSIAN SHIP", sub1: "Zelenskyy confirms strike", sub2: "Warship sunk off Benghazi", lon: 20.1, lat: 32.1 },
  { n: 2, headline: "RIYADH TOWER STRUCK", sub1: "Houthi drone hits tallest tower", sub2: "Eleven people wounded", lon: 46.7, lat: 24.7 },
  { n: 3, headline: "GIULIANI HONOURED", sub1: "Trump awards Medal of Freedom", sub2: "Ceremony at the White House", lon: -77, lat: 38.9 },
  { n: 4, headline: "700,000 RUSSIAN DEAD", sub1: "New analysis of Ukraine war", sub2: "Nearly five years of fighting", lon: 30.5, lat: 50.4 },
  { n: 5, headline: "ENGLAND LEVEL T20 SERIES", sub1: "Eight-wicket win in Hobart", sub2: "Chasing 185 against Australia", lon: 147.3, lat: -42.9 },
  { n: 6, headline: "O'HARE FLIGHTS DELAYED", sub1: "Radar outage hits Chicago", sub2: "FAA warns of arrival halt", lon: -87.6, lat: 41.9 },
  { n: 7, headline: "RADIO FOR AFGHAN GIRLS", sub1: "Lessons return to shortwave", sub2: "For girls barred from school", lon: 69.2, lat: 34.5 },
  { n: 8, headline: "GAZA STRIKES KILL 7", sub1: "Senior Hamas official dead", sub2: "Medics report six others killed", lon: 34.5, lat: 31.5 },
];

// ---- 5x7 bitmap font, drawn as pictures ----
// Each glyph is seven strings of five characters: "1" is ink, "0" is empty.
// The first character of each row is the leftmost pixel.
const FONT: Record<string, string[]> = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ",": ["00000", "00000", "00000", "00000", "01100", "00100", "01000"],
  "-": ["00000", "00000", "00000", "01110", "00000", "00000", "00000"],
  "—": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "?": ["01110", "10001", "00001", "00010", "00100", "00000", "00100"],
  "/": ["00001", "00001", "00010", "00100", "01000", "10000", "10000"],
  "%": ["11001", "11001", "00010", "00100", "01000", "10011", "10011"],
  "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  '"': ["01010", "01010", "01010", "00000", "00000", "00000", "00000"],
  ":": ["00000", "00000", "01100", "00000", "00000", "01100", "00000"],
  ";": ["00000", "00000", "01100", "00000", "01100", "00100", "01000"],
};

// ---- pixel canvas (RGBA, row-major) ----
const px = Buffer.alloc(W * H * 4);

type RGB = [number, number, number];

function setPixel(x: number, y: number, c: RGB): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 4;
  px[i] = c[0];
  px[i + 1] = c[1];
  px[i + 2] = c[2];
  px[i + 3] = 255;
}

function fillRect(x: number, y: number, w: number, h: number, c: RGB): void {
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) setPixel(i, j, c);
  }
}

function drawLine(x0: number, y0: number, x1: number, y1: number, c: RGB): void {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    setPixel(x0, y0, c);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y0 += sy;
    }
  }
}

function fillCircle(cx: number, cy: number, r: number, c: RGB): void {
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (x * x + y * y <= r * r) setPixel(cx + x, cy + y, c);
    }
  }
}

function ringCircle(cx: number, cy: number, r: number, c: RGB): void {
  for (let a = 0; a < 360; a++) {
    const t = (a * Math.PI) / 180;
    setPixel(Math.round(cx + r * Math.cos(t)), Math.round(cy + r * Math.sin(t)), c);
  }
}

// ---- bitmap text ----
function drawGlyph(ch: string, x: number, y: number, s: number, c: RGB): void {
  const rows = FONT[ch] ?? FONT[" "];
  for (let r = 0; r < rows.length; r++) {
    const line = rows[r];
    for (let col = 0; col < line.length; col++) {
      if (line[col] === "1") fillRect(x + col * s, y + r * s, s, s, c);
    }
  }
}

function drawText(str: string, x: number, y: number, s: number, c: RGB): void {
  let cx = x;
  for (const ch of str) {
    drawGlyph(ch.toUpperCase(), cx, y, s, c);
    cx += 6 * s;
  }
}

function textWidth(str: string, s: number): number {
  return str.length * 6 * s - s;
}

function drawTextCentered(str: string, cx: number, y: number, s: number, c: RGB): void {
  drawText(str, cx - Math.floor(textWidth(str, s) / 2), y, s, c);
}

// ---- world map: equirectangular projection over the top half ----
const MAP = { x: 24, y: 118, w: 976, h: 430 };

function project(lon: number, lat: number): [number, number] {
  const x = Math.round(MAP.x + ((lon + 180) / 360) * MAP.w);
  const y = Math.round(MAP.y + ((90 - lat) / 180) * MAP.h);
  return [x, y];
}

// Graticule: faint lines every 30 degrees, with the equator and the prime
// meridian drawn a touch brighter so the eye finds its bearings.
function drawGraticule(): void {
  const meridians = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150];
  for (const lon of meridians) {
    const [topX] = project(lon, 90);
    const [botX] = project(lon, -90);
    const shade = lon === 0 ? GOLD : GOLD_DIM;
    drawLine(topX, MAP.y, botX, MAP.y + MAP.h, shade);
  }
  const parallels = [-60, -30, 0, 30, 60];
  for (const lat of parallels) {
    const [, rowY] = project(-180, lat);
    const shade = lat === 0 ? GOLD : GOLD_DIM;
    drawLine(MAP.x, rowY, MAP.x + MAP.w, rowY, shade);
  }
  // map frame
  drawLine(MAP.x, MAP.y, MAP.x + MAP.w, MAP.y, GOLD);
  drawLine(MAP.x, MAP.y + MAP.h, MAP.x + MAP.w, MAP.y + MAP.h, GOLD);
  drawLine(MAP.x, MAP.y, MAP.x, MAP.y + MAP.h, GOLD);
  drawLine(MAP.x + MAP.w, MAP.y, MAP.x + MAP.w, MAP.y + MAP.h, GOLD);
}

// Continent outlines, hand-plotted as (lon, lat) points. Coarse on purpose:
// a stylised atlas, not a survey chart.
const CONTINENTS: Array<Array<[number, number]>> = [
  // North America
  [
    [-168, 66], [-150, 70], [-128, 70], [-110, 68], [-95, 68], [-85, 66],
    [-80, 62], [-72, 62], [-65, 60], [-60, 55], [-55, 48], [-60, 44],
    [-66, 43], [-70, 40], [-75, 37], [-76, 34], [-80, 31], [-81, 25],
    [-85, 30], [-90, 29], [-94, 29], [-97, 26], [-97, 21], [-93, 17],
    [-90, 14], [-86, 12], [-82, 9], [-79, 8], [-83, 10], [-88, 14],
    [-92, 15], [-97, 16], [-102, 18], [-106, 22], [-111, 25], [-114, 29],
    [-118, 33], [-122, 37], [-124, 42], [-124, 48], [-128, 51], [-132, 56],
    [-140, 60], [-148, 60], [-156, 58], [-163, 58],
  ],
  // South America
  [
    [-79, 9], [-77, 4], [-80, -3], [-81, -6], [-78, -11], [-73, -17],
    [-70, -22], [-70, -29], [-72, -36], [-73, -43], [-74, -49], [-70, -54],
    [-66, -55], [-68, -50], [-65, -44], [-62, -39], [-58, -34], [-53, -33],
    [-48, -28], [-42, -23], [-39, -17], [-35, -9], [-35, -6], [-39, -3],
    [-44, -2], [-49, 0], [-52, 4], [-57, 6], [-61, 9], [-66, 11],
    [-71, 12], [-76, 10],
  ],
  // Africa
  [
    [-6, 35], [-10, 31], [-15, 27], [-17, 21], [-17, 15], [-15, 11],
    [-12, 8], [-8, 4], [-4, 5], [0, 6], [6, 4], [9, 4], [9, 0],
    [12, -4], [13, -10], [12, -16], [14, -22], [16, -28], [19, -34],
    [25, -34], [28, -32], [32, -28], [35, -24], [36, -20], [40, -15],
    [40, -10], [42, -4], [46, -1], [51, 2], [51, 10], [48, 11],
    [44, 11], [40, 15], [38, 18], [37, 22], [35, 27], [33, 31],
    [30, 32], [24, 32], [19, 32], [14, 32], [10, 34], [10, 37],
    [5, 37], [0, 36],
  ],
  // Eurasia, replotted: Atlantic coast, Arctic shore, Pacific rim, south coast
  [
    [-10, 37], [-9, 39], [-9, 43], [-4, 44], [-1, 46], [-2, 48],
    [-4, 49], [0, 50], [2, 51], [4, 53], [7, 54], [8, 56],
    [10, 57], [10, 59], [7, 60], [5, 61], [7, 63], [11, 65],
    [14, 67], [18, 69], [23, 70], [28, 71], [32, 70], [36, 68],
    [41, 68], [46, 68], [51, 69], [56, 68], [61, 69], [66, 70],
    [71, 72], [76, 72], [81, 73], [86, 74], [91, 75], [96, 76],
    [101, 76], [106, 76], [111, 74], [116, 73], [121, 73], [126, 72],
    [131, 72], [136, 71], [141, 72], [146, 72], [151, 70], [156, 69],
    [160, 69], [162, 67], [159, 63], [161, 60], [158, 57], [156, 53],
    [152, 58], [145, 59], [141, 56], [139, 52], [136, 47], [133, 43],
    [130, 42], [127, 39], [125, 38], [122, 37], [120, 34], [121, 30],
    [119, 26], [115, 22], [110, 20], [108, 16], [106, 10], [104, 8],
    [101, 6], [99, 8], [97, 12], [95, 16], [92, 21], [89, 22],
    [86, 20], [83, 18], [80, 14], [77, 8], [75, 11], [73, 17],
    [70, 21], [67, 24], [64, 25], [60, 25], [57, 26], [54, 26],
    [52, 27], [50, 29], [48, 30], [50, 29], [53, 28], [56, 27],
    [58, 24], [59, 22], [57, 19], [54, 17], [51, 15], [48, 14],
    [44, 13], [42, 14], [40, 16], [38, 19], [36, 22], [35, 26],
    [35, 29], [34, 31], [32, 34], [29, 36], [27, 37], [25, 38],
    [23, 36], [21, 38], [19, 41], [17, 40], [14, 44], [12, 44],
    [9, 44], [6, 43], [3, 42], [0, 39], [-2, 37], [-5, 36],
  ],
  // Australia, replotted with a tighter south coast
  [
    [114, -22], [113, -26], [115, -31], [115, -34], [118, -35], [122, -34],
    [126, -32], [129, -32], [132, -32], [134, -33], [136, -35], [139, -37],
    [142, -38], [146, -39], [149, -37], [151, -34], [153, -31], [153, -27],
    [151, -24], [148, -20], [145, -17], [142, -14], [142, -11], [139, -13],
    [136, -12], [134, -12], [132, -11], [130, -13], [127, -14], [124, -15],
    [121, -17], [117, -20],
  ],
  // Greenland, replotted
  [
    [-44, 60], [-41, 63], [-36, 66], [-30, 68], [-25, 70], [-20, 71],
    [-21, 74], [-26, 76], [-34, 76], [-42, 75], [-50, 74], [-54, 71],
    [-54, 67], [-51, 63], [-47, 61],
  ],
  // Madagascar
  [
    [44, -16], [47, -15], [50, -16], [50, -20], [48, -23], [45, -25],
    [44, -22], [43, -19], [44, -16],
  ],
  // Great Britain
  [
    [-5, 50], [-3, 53], [-5, 56], [-3, 58], [-1, 57], [0, 53],
    [1, 51], [-2, 50],
  ],
  // Japan, a short island chain
  [
    [130, 31], [132, 33], [135, 34], [137, 35], [139, 37], [141, 39],
    [141, 42], [143, 44], [141, 43], [140, 40], [138, 37], [135, 34],
    [132, 33],
  ],
  // Borneo
  [
    [109, 1], [111, 3], [114, 4], [117, 6], [119, 2], [118, -1],
    [116, -3], [113, -3], [110, -2],
  ],
  // Sumatra
  [
    [95, 5], [98, 3], [101, 0], [104, -3], [106, -6], [103, -5],
    [100, -2], [97, 1], [95, 5],
  ],
  // New Guinea
  [
    [131, -1], [135, -2], [139, -3], [143, -5], [146, -6], [147, -9],
    [144, -8], [141, -8], [137, -7], [134, -4],
  ],
];

function drawContinents(): void {
  for (const poly of CONTINENTS) {
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      const [x0, y0] = project(a[0], a[1]);
      const [x1, y1] = project(b[0], b[1]);
      drawLine(x0, y0, x1, y1, GOLD);
    }
  }
}

function drawPins(): void {
  for (const s of STORIES) {
    const [x, y] = project(s.lon, s.lat);
    fillCircle(x, y, 11, RED);
    ringCircle(x, y, 13, GOLD);
    drawTextCentered(String(s.n), x, y - 4, 1, WHITE);
  }
}

// ---- news cards: a two-by-four grid under the map ----
// Each card carries a red numbered badge, a cream headline and two grey
// sub-lines. Gold corner ticks mark the card edges.
const CARD = { cols: 2, w: 480, h: 96, gapX: 16, gapY: 10, x: 24, y: 574 };

function cardFrame(x: number, y: number): void {
  const w = CARD.w;
  const h = CARD.h;
  drawLine(x, y, x + w - 1, y, GOLD_DIM);
  drawLine(x, y + h - 1, x + w - 1, y + h - 1, GOLD_DIM);
  drawLine(x, y, x, y + h - 1, GOLD_DIM);
  drawLine(x + w - 1, y, x + w - 1, y + h - 1, GOLD_DIM);
  // gold corner ticks, 12 px long, pointing in from each corner
  const corners: Array<[number, number, number, number]> = [
    [x, y, 1, 1],
    [x + w - 1, y, -1, 1],
    [x, y + h - 1, 1, -1],
    [x + w - 1, y + h - 1, -1, -1],
  ];
  for (const [cx, cy, dx, dy] of corners) {
    for (let k = 0; k < 12; k++) {
      setPixel(cx + dx * k, cy, GOLD);
      setPixel(cx, cy + dy * k, GOLD);
    }
  }
}

function drawCards(): void {
  for (let i = 0; i < STORIES.length; i++) {
    const s = STORIES[i];
    const col = i % CARD.cols;
    const row = Math.floor(i / CARD.cols);
    const x = CARD.x + col * (CARD.w + CARD.gapX);
    const y = CARD.y + row * (CARD.h + CARD.gapY);
    fillRect(x, y, CARD.w, CARD.h, CARD_BG);
    cardFrame(x, y);
    const bx = x + 26;
    const by = y + 26;
    fillCircle(bx, by, 14, RED);
    ringCircle(bx, by, 14, GOLD);
    drawTextCentered(String(s.n), bx, by - 4, 1, WHITE);
    const tx = x + 50;
    drawText(s.headline, tx, y + 14, 2, CREAM);
    drawText(s.sub1, tx, y + 44, 1, GRAY);
    drawText(s.sub2, tx, y + 60, 1, GRAY);
  }
}

// ---- hand-written PNG encoder: CRC32, chunks, zlib deflate ----
// A PNG file is an 8-byte signature followed by chunks. Each chunk is
// length + type + data + CRC32 of (type + data). We emit IHDR, one IDAT
// holding the deflated scanlines, and IEND.

function buildCrcTable(): number[] {
  const table: number[] = new Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
}

const CRC_TABLE = buildCrcTable();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const byte of buf) {
    c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function u32be(value: number): Buffer {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(value >>> 0, 0);
  return b;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  return Buffer.concat([u32be(data.length), body, u32be(crc32(body))]);
}

function ihdrChunk(): Buffer {
  const data = Buffer.alloc(13);
  data.writeUInt32BE(W, 0);
  data.writeUInt32BE(H, 4);
  data[8] = 8; // 8 bits per channel
  data[9] = 6; // colour type 6 = RGBA
  data[10] = 0; // compression: deflate
  data[11] = 0; // filter method: adaptive, we use 0 on every row
  data[12] = 0; // no interlace
  return pngChunk("IHDR", data);
}

function scanlines(): Buffer {
  // One filter byte (0 = none) in front of every row of RGBA pixels.
  const stride = W * 4;
  const raw = Buffer.alloc(H * (stride + 1));
  for (let y = 0; y < H; y++) {
    const at = y * (stride + 1);
    raw[at] = 0;
    px.copy(raw, at + 1, y * stride, (y + 1) * stride);
  }
  return raw;
}

function encodePng(): Buffer {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const compressed = deflateSync(scanlines(), { level: 9 });
  return Buffer.concat([
    signature,
    ihdrChunk(),
    pngChunk("IDAT", compressed),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---- compose the whole poster ----
function main(): void {
  for (let y = 0; y < H; y++) {
    const t = y / (H - 1);
    const c: RGB = [
      Math.round(NAVY_TOP[0] + (NAVY_BOTTOM[0] - NAVY_TOP[0]) * t),
      Math.round(NAVY_TOP[1] + (NAVY_BOTTOM[1] - NAVY_TOP[1]) * t),
      Math.round(NAVY_TOP[2] + (NAVY_BOTTOM[2] - NAVY_TOP[2]) * t),
    ];
    fillRect(0, y, W, 1, c);
  }

  // gold frame
  drawLine(10, 10, 1013, 10, GOLD);
  drawLine(10, 1013, 1013, 1013, GOLD);
  drawLine(10, 10, 10, 1013, GOLD);
  drawLine(1013, 10, 1013, 1013, GOLD);

  // title block
  drawTextCentered("THE WORLD IN ONE DAY", 512, 28, 4, GOLD);
  drawTextCentered("25 NOVEMBER 2026", 512, 72, 2, CREAM);
  drawLine(312, 102, 712, 102, GOLD);

  // map + pins
  drawGraticule();
  drawContinents();
  drawPins();
  drawTextCentered("EIGHT STORIES — ONE DAY — 25 NOVEMBER 2026", 512, 554, 1, GRAY);

  // cards + footer
  drawCards();
  drawTextCentered("25 NOVEMBER 2026 — THE WORLD IN ONE DAY", 512, 998, 1, GRAY);

  const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
  mkdirSync(outDir, { recursive: true });
  const out = join(outDir, "entry.png");
  writeFileSync(out, encodePng());
  console.log(`wrote ${out} (${W}x${H})`);
}

main();
