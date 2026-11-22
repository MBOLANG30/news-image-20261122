// THE WORLD IN ONE DAY — Sunday 22 November 2026.
// One 1024x1024 newspaper-style infographic, drawn entirely in code:
// embedded 5x7 bitmap font, hand-written PNG encoder, flat colours.
// No network, no clock, no randomness — the output is fixed for 22 Nov 2026.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const W = 1024;
const H = 1024;

// ---------------------------------------------------------------- colours
const PAPER = [246, 241, 227];
const INK = [22, 26, 38];
const NAVY = [20, 33, 61];
const GOLD = [201, 162, 39];
const RED = [178, 34, 34];
const WHITE = [255, 255, 255];
const GREY = [90, 92, 100];
const CARD_BG = [255, 253, 247];

// ---------------------------------------------------------------- canvas
const px = new Uint8Array(W * H * 3);
function fillAll(c) {
  for (let i = 0; i < W * H; i++) {
    px[i * 3] = c[0];
    px[i * 3 + 1] = c[1];
    px[i * 3 + 2] = c[2];
  }
}
function setPixel(x, y, c) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = c[0];
  px[i + 1] = c[1];
  px[i + 2] = c[2];
}
function fillRect(x, y, w, h, c) {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) setPixel(xx, yy, c);
  }
}
function drawRect(x, y, w, h, c) {
  fillRect(x, y, w, 1, c);
  fillRect(x, y + h - 1, w, 1, c);
  fillRect(x, y, 1, h, c);
  fillRect(x + w - 1, y, 1, h, c);
}
function drawLine(x0, y0, x1, y1, c) {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;
  for (;;) {
    setPixel(x, y, c);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}
function fillCircle(cx, cy, r, c) {
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r * r) setPixel(x, y, c);
    }
  }
}
function drawCircle(cx, cy, r, c) {
  for (let a = 0; a < 360; a += 2) {
    const rad = (a * Math.PI) / 180;
    setPixel(Math.round(cx + r * Math.cos(rad)), Math.round(cy + r * Math.sin(rad)), c);
  }
}

// ------------------------------------------------------- 5x7 bitmap font
// Each glyph: 7 rows, each a 5-bit number, bit 4 = leftmost pixel.
const FONT = {
  A: [0x0e, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  B: [0x1e, 0x11, 0x11, 0x1e, 0x11, 0x11, 0x1e],
  C: [0x0e, 0x11, 0x10, 0x10, 0x10, 0x11, 0x0e],
  D: [0x1e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x1e],
  E: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x1f],
  F: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x10],
  G: [0x0e, 0x11, 0x10, 0x17, 0x11, 0x11, 0x0f],
  H: [0x11, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  I: [0x0e, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0e],
  J: [0x07, 0x02, 0x02, 0x02, 0x02, 0x12, 0x0c],
  K: [0x11, 0x12, 0x14, 0x18, 0x14, 0x12, 0x11],
  L: [0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x1f],
  M: [0x11, 0x1b, 0x15, 0x15, 0x11, 0x11, 0x11],
  N: [0x11, 0x19, 0x15, 0x13, 0x11, 0x11, 0x11],
  O: [0x0e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  P: [0x1e, 0x11, 0x11, 0x1e, 0x10, 0x10, 0x10],
  Q: [0x0e, 0x11, 0x11, 0x11, 0x15, 0x12, 0x0d],
  R: [0x1e, 0x11, 0x11, 0x1e, 0x14, 0x12, 0x11],
  S: [0x0f, 0x10, 0x10, 0x0e, 0x01, 0x01, 0x1e],
  T: [0x1f, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
  U: [0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  V: [0x11, 0x11, 0x11, 0x11, 0x11, 0x0a, 0x04],
  W: [0x11, 0x11, 0x11, 0x15, 0x15, 0x1b, 0x11],
  X: [0x11, 0x11, 0x0a, 0x04, 0x0a, 0x11, 0x11],
  Y: [0x11, 0x11, 0x0a, 0x04, 0x04, 0x04, 0x04],
  Z: [0x1f, 0x01, 0x02, 0x04, 0x08, 0x10, 0x1f],
  "0": [0x0e, 0x11, 0x13, 0x15, 0x19, 0x11, 0x0e],
  "1": [0x04, 0x0c, 0x04, 0x04, 0x04, 0x04, 0x0e],
  "2": [0x0e, 0x11, 0x01, 0x06, 0x08, 0x10, 0x1f],
  "3": [0x1f, 0x02, 0x04, 0x02, 0x01, 0x11, 0x0e],
  "4": [0x02, 0x06, 0x0a, 0x12, 0x1f, 0x02, 0x02],
  "5": [0x1f, 0x10, 0x1e, 0x01, 0x01, 0x11, 0x0e],
  "6": [0x06, 0x08, 0x10, 0x1e, 0x11, 0x11, 0x0e],
  "7": [0x1f, 0x01, 0x02, 0x04, 0x08, 0x08, 0x08],
  "8": [0x0e, 0x11, 0x11, 0x0e, 0x11, 0x11, 0x0e],
  "9": [0x0e, 0x11, 0x11, 0x0f, 0x01, 0x02, 0x0c],
  " ": [0, 0, 0, 0, 0, 0, 0],
  ".": [0, 0, 0, 0, 0, 0x0c, 0x0c],
  ",": [0, 0, 0, 0, 0x0c, 0x04, 0x08],
  ":": [0, 0x0c, 0x0c, 0, 0x0c, 0x0c, 0],
  ";": [0, 0x0c, 0x0c, 0, 0x0c, 0x04, 0x08],
  "-": [0, 0, 0, 0x0e, 0, 0, 0],
  "'": [0x04, 0x04, 0x08, 0, 0, 0, 0],
  "!": [0x04, 0x04, 0x04, 0x04, 0x04, 0, 0x04],
  "?": [0x0e, 0x11, 0x01, 0x06, 0x04, 0, 0x04],
  "(": [0x02, 0x04, 0x08, 0x08, 0x08, 0x04, 0x02],
  ")": [0x08, 0x04, 0x02, 0x02, 0x02, 0x04, 0x08],
  "/": [0x01, 0x02, 0x02, 0x04, 0x08, 0x08, 0x10],
  "%": [0x19, 0x1a, 0x02, 0x04, 0x08, 0x0b, 0x13],
  "&": [0x0c, 0x12, 0x14, 0x08, 0x15, 0x12, 0x0d],
  "+": [0, 0x04, 0x04, 0x1f, 0x04, 0x04, 0],
  "=": [0, 0, 0x1f, 0, 0x1f, 0, 0],
  '"': [0x0a, 0x0a, 0, 0, 0, 0, 0],
  $: [0x04, 0x0f, 0x14, 0x0e, 0x05, 0x1e, 0x04],
  _: [0, 0, 0, 0, 0, 0, 0x1f],
  "*": [0, 0x15, 0x0e, 0x1f, 0x0e, 0x15, 0],
  ">": [0x08, 0x04, 0x02, 0x01, 0x02, 0x04, 0x08],
  "<": [0x02, 0x04, 0x08, 0x10, 0x08, 0x04, 0x02],
};

function glyphOf(ch) {
  const up = ch.toUpperCase();
  return FONT[up] || FONT["?"];
}
function charWidth(scale) {
  return 6 * scale;
}
function textWidth(text, scale) {
  return text.length * charWidth(scale) - scale;
}
function drawChar(x, y, ch, scale, c) {
  const g = glyphOf(ch);
  for (let r = 0; r < 7; r++) {
    const bits = g[r];
    for (let col = 0; col < 5; col++) {
      if ((bits >> (4 - col)) & 1) {
        fillRect(x + col * scale, y + r * scale, scale, scale, c);
      }
    }
  }
}
function drawText(x, y, text, scale, c) {
  let cx = x;
  for (const ch of text) {
    drawChar(cx, y, ch, scale, c);
    cx += charWidth(scale);
  }
  return cx;
}
function drawTextCentred(cx, y, text, scale, c) {
  drawText(cx - Math.floor(textWidth(text, scale) / 2), y, text, scale, c);
}
function wrapText(text, maxWidth, scale) {
  const words = text.split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    const trial = cur === "" ? w : cur + " " + w;
    if (textWidth(trial, scale) <= maxWidth) {
      cur = trial;
    } else {
      if (cur !== "") lines.push(cur);
      cur = w;
    }
  }
  if (cur !== "") lines.push(cur);
  return lines;
}

// ------------------------------------------------------------------ icons
// Simple flat icons, drawn in code. (x, y) = top-left of a 44x44 box.
function drawIcon(kind, x, y, c) {
  if (kind === "globe") {
    drawCircle(x + 22, y + 22, 19, c);
    drawLine(x + 3, y + 22, x + 41, y + 22, c);
    drawLine(x + 22, y + 3, x + 22, y + 41, c);
    drawLine(x + 8, y + 12, x + 36, y + 12, c);
    drawLine(x + 8, y + 32, x + 36, y + 32, c);
  } else if (kind === "aid") {
    drawRect(x + 6, y + 10, 32, 28, c);
    fillRect(x + 19, y + 16, 6, 16, c);
    fillRect(x + 14, y + 21, 16, 6, c);
  } else if (kind === "ship") {
    fillRect(x + 20, y + 4, 3, 18, c);
    drawLine(x + 23, y + 5, x + 38, y + 18, c);
    drawLine(x + 23, y + 5, x + 38, y + 18, c);
    fillRect(x + 4, y + 22, 36, 4, c);
    drawLine(x + 4, y + 26, x + 10, y + 38, c);
    drawLine(x + 40, y + 26, x + 34, y + 38, c);
    drawLine(x + 10, y + 38, x + 34, y + 38, c);
  } else if (kind === "parliament") {
    drawLine(x + 4, y + 14, x + 22, y + 4, c);
    drawLine(x + 22, y + 4, x + 40, y + 14, c);
    fillRect(x + 4, y + 14, 36, 3, c);
    fillRect(x + 8, y + 20, 4, 14, c);
    fillRect(x + 20, y + 20, 4, 14, c);
    fillRect(x + 32, y + 20, 4, 14, c);
    fillRect(x + 4, y + 36, 36, 3, c);
  } else if (kind === "missile") {
    drawLine(x + 10, y + 38, x + 22, y + 4, c);
    drawLine(x + 34, y + 38, x + 22, y + 4, c);
    drawLine(x + 10, y + 38, x + 34, y + 38, c);
    fillRect(x + 14, y + 26, 16, 3, c);
    fillRect(x + 20, y + 38, 4, 5, c);
  } else if (kind === "quake") {
    drawLine(x + 2, y + 22, x + 10, y + 22, c);
    drawLine(x + 10, y + 22, x + 14, y + 10, c);
    drawLine(x + 14, y + 10, x + 18, y + 34, c);
    drawLine(x + 18, y + 34, x + 22, y + 16, c);
    drawLine(x + 22, y + 16, x + 26, y + 28, c);
    drawLine(x + 26, y + 28, x + 30, y + 22, c);
    drawLine(x + 30, y + 22, x + 42, y + 22, c);
  } else if (kind === "house") {
    drawLine(x + 4, y + 22, x + 22, y + 6, c);
    drawLine(x + 22, y + 6, x + 40, y + 22, c);
    drawRect(x + 9, y + 22, 26, 17, c);
    fillRect(x + 19, y + 28, 6, 11, c);
  } else if (kind === "oil") {
    drawLine(x + 22, y + 4, x + 10, y + 24, c);
    drawLine(x + 22, y + 4, x + 34, y + 24, c);
    drawLine(x + 10, y + 24, x + 10, y + 30, c);
    drawLine(x + 34, y + 24, x + 34, y + 30, c);
    drawLine(x + 10, y + 30, x + 22, y + 40, c);
    drawLine(x + 34, y + 30, x + 22, y + 40, c);
  }
}

// ------------------------------------------------------------------ stories
// All facts are for Sunday 22 November 2026. Claims are framed as claims.
const CARDS = [
  {
    kicker: "CLIMATE  -  COP31",
    title: "COP31 NEARS DEAL",
    body: "After two days overtime, the COP31 presidency tables a new package early Sunday. A plenary is set for 0600 GMT to approve it. Fossil-fuel wording is still disputed.",
    accent: [46, 125, 87],
    icon: "globe",
  },
  {
    kicker: "MIDDLE EAST  -  GAZA",
    title: "GAZA AID CALL",
    body: "Australia, Canada, Italy and the UK jointly call on Israel to let aid reach flooded Gaza.",
    accent: [178, 34, 34],
    icon: "aid",
  },
  {
    kicker: "BALTIC SEA",
    title: "DRONES HIT RUSSIAN SHIP",
    body: "Drones hit a Russian cargo ship in the Baltic. The crew was evacuated. Finland tightens security as PM Orpo says the war is spilling into its neighbourhood.",
    accent: [31, 78, 121],
    icon: "ship",
  },
  {
    kicker: "ISRAEL  -  POLITICS",
    title: "EISENKOT TAPPED TO LEAD ISRAEL",
    body: "President Herzog asks ex-army chief Gadi Eisenkot to form the next government, bypassing Netanyahu. Eisenkot invites Likud to coalition talks.",
    accent: [90, 60, 140],
    icon: "parliament",
  },
  {
    kicker: "GULF  -  CLAIMS",
    title: "IRAN CLAIMS US DEFENCE HITS",
    body: "The IRGC claims a missile-and-drone operation hit two US Patriot radars. Tehran also claims a missile hit a US F-16 over the Strait of Hormuz.",
    accent: [150, 90, 20],
    icon: "missile",
  },
  {
    kicker: "ASIA  -  EARTHQUAKE",
    title: "MYANMAR M4.1 QUAKE",
    body: "A magnitude 4.1 earthquake strikes Myanmar in the early hours of Sunday.",
    accent: [120, 60, 40],
    icon: "quake",
  },
  {
    kicker: "PERU  -  AFTERMATH",
    title: "PERU: 152 HOMES UNINHABITABLE",
    body: "Revised count after Friday's M6.7 quake: 152 homes are now uninhabitable. The toll update was issued on 22 November.",
    accent: [31, 78, 121],
    icon: "house",
  },
  {
    kicker: "NORWAY  -  CLIMATE LAW",
    title: "NORWAY COURT VOIDS OIL LICENCES",
    body: "Norway's supreme court rules climate-disputed oil licences invalid.",
    accent: [46, 125, 87],
    icon: "oil",
  },
];

const BRIEF =
  "FRANCE: 4th weekend of cost-of-living protests.  SOMALIA: Al-Shabaab claims a deadly ambush on Somali troops.  TENNIS: Alcaraz vs Zverev for the ATP Finals title today.  VENEZUELA: US State Dept details $12bn of oil and mineral revenue.  BRAZIL: Bolsonaro in ICU.";

// ------------------------------------------------------------------ layout
function drawMasthead() {
  fillRect(0, 0, W, 118, NAVY);
  fillRect(0, 118, W, 3, GOLD);
  drawTextCentred(512, 24, "THE WORLD IN ONE DAY", 4, PAPER);
  drawTextCentred(512, 68, "SUNDAY 22 NOVEMBER 2026", 2, GOLD);
  drawTextCentred(512, 96, "EIGHT STORIES - ONE IMAGE", 1, PAPER);
}

function drawCard(card, x, y, num) {
  const w = 489;
  const h = 186;
  fillRect(x, y, w, h, CARD_BG);
  drawRect(x, y, w, h, INK);
  fillRect(x, y, w, 8, card.accent);
  // Kicker
  drawText(x + 16, y + 20, card.kicker, 1, card.accent);
  // Icon, top right
  drawIcon(card.icon, x + w - 60, y + 16, card.accent);
  // Title, wrapped, scale 2, room left for the icon
  const titleLines = wrapText(card.title, w - 32 - 56, 2);
  let ty = y + 38;
  for (const line of titleLines) {
    drawText(x + 16, ty, line, 2, INK);
    ty += 17;
  }
  // Thin rule under the title
  fillRect(x + 16, ty + 2, w - 32, 1, GREY);
  // Body, scale 1, wrapped to the full inner width, roomier line spacing
  const bodyLines = wrapText(card.body, w - 32, 1);
  let by = ty + 14;
  for (const line of bodyLines) {
    drawText(x + 16, by, line, 1, INK);
    by += 12;
  }
  // Large story number fills the empty lower-right corner
  drawText(x + w - 16 - textWidth(String(num), 4), y + h - 46, String(num), 4, card.accent);
  // Accent rule above the footer tag, stopping short of the story number
  fillRect(x + 16, y + h - 28, w - 32 - 64, 2, card.accent);
  // Footer tag
  drawText(x + 16, y + h - 18, "22 NOVEMBER 2026", 1, GREY);
}

function drawBrief() {
  const x = 16;
  const y = 932;
  const w = W - 32;
  const h = 76;
  fillRect(x, y, w, h, NAVY);
  drawText(x + 16, y + 10, "IN BRIEF", 2, GOLD);
  const lines = wrapText(BRIEF, w - 32, 1);
  let ly = y + 32;
  for (const line of lines) {
    drawText(x + 16, ly, line, 1, PAPER);
    ly += 10;
  }
}

function drawPage() {
  fillAll(PAPER);
  drawRect(6, 6, W - 12, H - 12, INK);
  drawMasthead();
  const xs = [16, 521];
  const ys = [134, 334, 534, 734];
  let i = 0;
  for (const row of ys) {
    for (const col of xs) {
      drawCard(CARDS[i], col, row, i + 1);
      i++;
    }
  }
  drawBrief();
}

// ------------------------------------------------------------- PNG encoder
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
  return out;
}

function encodePNG() {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type 2 = RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0; // filter: none
    Buffer.from(px.buffer, y * W * 3, W * 3).copy(raw, y * (1 + W * 3) + 1);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// -------------------------------------------------------------------- main
function main() {
  const outputDir = process.env.OUTPUT_DIR || "/output";
  fs.mkdirSync(outputDir, { recursive: true });
  drawPage();
  const png = encodePNG();
  fs.writeFileSync(path.join(outputDir, "entry.png"), png);
}

main();
