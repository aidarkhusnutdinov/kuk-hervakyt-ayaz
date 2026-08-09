/* =========================================================================
   ПИКСЕЛЬНАЯ ГРАФИКА
   Всё рисуется кодом на канвасе 320x480, без картинок.
   ========================================================================= */

const W = 320, H = 480;

/* --- мелкие помощники --- */
function R(g, x, y, w, h, c) {
  g.fillStyle = c;
  g.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
}

function circleFill(g, cx, cy, r, c) {
  g.fillStyle = c;
  for (let y = -r; y <= r; y++) {
    const dx = Math.floor(Math.sqrt(r * r - y * y));
    g.fillRect(Math.round(cx - dx), Math.round(cy + y), dx * 2 + 1, 1);
  }
}

/* небо полосами + дизеринг на стыках */
function drawSky(g, stops) {
  for (let i = 0; i < stops.length; i++) {
    const y0 = stops[i][0];
    const y1 = i + 1 < stops.length ? stops[i + 1][0] : H;
    R(g, 0, y0, W, y1 - y0, stops[i][1]);
  }
  const d = 10;
  for (let i = 1; i < stops.length; i++) {
    const y0 = stops[i][0], up = stops[i - 1][1];
    g.fillStyle = up;
    for (let y = 0; y < d; y++) {
      const density = d - y;
      for (let x = 0; x < W; x += 2) {
        if (((x * 3 + y * 5) % (d + 2)) < density) g.fillRect(x + (y % 2), y0 + y, 2, 1);
      }
    }
  }
}

/* горизонтальные «пиксельные» облака */
function puffCloud(g, x, y, s, c1, c2) {
  R(g, x, y + s, s * 6, s * 2, c1);
  R(g, x + s, y, s * 4, s, c1);
  R(g, x + s * 2, y - s, s * 2, s, c2);
  R(g, x - s, y + s * 2, s * 8, s, c1);
  R(g, x + s, y, s * 2, s, c2);
}

/* повторяемый псевдослучайный набор точек */
function seeded(n, seed) {
  const out = [];
  let s = seed;
  for (let i = 0; i < n; i++) {
    s = (s * 1103515245 + 12345) % 2147483648;
    const a = s / 2147483648;
    s = (s * 1103515245 + 12345) % 2147483648;
    const b = s / 2147483648;
    s = (s * 1103515245 + 12345) % 2147483648;
    const c = s / 2147483648;
    out.push([a, b, c]);
  }
  return out;
}

const STARS = seeded(70, 7);
const EMBERS = seeded(34, 99);
const POLLEN = seeded(26, 41);
const MIST = seeded(30, 13);

/* =========================================================================
   СЦЕНА 0 — ЗАСТАВКА: розовый закат с водопадом
   ========================================================================= */
function sceneTitle(g, t) {
  drawSky(g, [
    [0, '#3b1c53'],
    [40, '#7a2a63'],
    [90, '#b83a76'],
    [140, '#e85d80'],
    [180, '#f98a86'],
    [215, '#ffb27e'],
    [245, '#ffd79b']
  ]);

  // солнце
  const sy = 262;
  circleFill(g, 160, sy, 30, '#fff3c4');
  circleFill(g, 160, sy, 24, '#fffdf0');
  for (let i = 0; i < 5; i++) R(g, 128, sy - 18 + i * 11, 64, 2, '#ffb27e');

  // облака
  puffCloud(g, 20 + Math.sin(t * 0.11) * 8, 60, 4, '#f7a1c4', '#ffd0e4');
  puffCloud(g, 200 + Math.sin(t * 0.07 + 2) * 10, 105, 3, '#ffb9d3', '#ffe1ee');
  puffCloud(g, 120 + Math.sin(t * 0.05 + 1) * 6, 30, 2, '#e88bb4', '#ffc9e0');

  // дальние горы
  ridge(g, 246, '#6e3160', 26, 0.021, 3);
  ridge(g, 258, '#4b2350', 20, 0.033, 7);

  // скалы по бокам
  R(g, 0, 252, 96, H - 252, '#2f1a44');
  R(g, 224, 252, 96, H - 252, '#2f1a44');
  for (let y = 252; y < H; y += 8) {
    R(g, 88 - ((y % 24) / 8) * 4, y, 8, 8, '#3d2358');
    R(g, 224 + ((y % 16) / 8) * 4, y, 8, 8, '#3d2358');
  }
  // трава на кромке скал
  for (let x = 0; x < 96; x += 6) R(g, x, 248 + (x % 12 === 0 ? 0 : 2), 6, 6, '#5c3a6b');
  for (let x = 224; x < W; x += 6) R(g, x, 248 + (x % 12 === 0 ? 2 : 0), 6, 6, '#5c3a6b');

  // водопад
  R(g, 96, 252, 128, 168, '#cfe6ff');
  R(g, 96, 252, 128, 10, '#ffffff');
  for (let i = 0; i < 26; i++) {
    const x = 100 + ((i * 37) % 118);
    const speed = 60 + (i % 5) * 34;
    const y = 258 + ((t * speed + i * 53) % 158);
    R(g, x, y, 3, 12 + (i % 3) * 6, i % 3 ? '#ffffff' : '#eaf6ff');
  }
  R(g, 96, 252, 4, 168, '#a9cdf2');
  R(g, 220, 252, 4, 168, '#a9cdf2');

  // брызги и туман внизу
  R(g, 84, 414, 152, 14, '#e9f4ff');
  for (const [a, b, c] of MIST) {
    const x = 80 + a * 160;
    const y = 404 + Math.sin(t * 1.4 + b * 6) * 6 + b * 16;
    R(g, x, y, 3 + c * 4, 3, 'rgba(255,255,255,0.75)');
  }

  // озеро
  R(g, 0, 424, W, H - 424, '#9ec7ea');
  R(g, 0, 424, W, 6, '#c9e2f7');
  for (let y = 432; y < H; y += 8) {
    const off = Math.sin(t * 1.1 + y * 0.25) * 12;
    R(g, 40 + off, y, 60, 2, '#ffc9d8');
    R(g, 180 - off, y + 3, 74, 2, '#b9dcf5');
  }
}

function ridge(g, base, color, amp, freq, seed) {
  for (let x = 0; x < W; x++) {
    const h = Math.abs(Math.sin(x * freq + seed) * amp) + Math.abs(Math.sin(x * freq * 2.3 + seed) * amp * 0.4);
    R(g, x, base - h, 1, H - base + h, color);
  }
}

/* =========================================================================
   СЦЕНА 1 — НОЧЬ: «Ак күзле төн карый»
   ========================================================================= */
function sceneNight(g, t) {
  drawSky(g, [
    [0, '#0b0a2a'],
    [110, '#171644'],
    [230, '#2b2260'],
    [330, '#453070'],
    [400, '#6b4183']
  ]);

  for (let i = 0; i < STARS.length; i++) {
    const [a, b, c] = STARS[i];
    const x = a * W, y = b * 380;
    const tw = 0.55 + 0.45 * Math.sin(t * (1 + c * 2) + i);
    if (tw > 0.7) R(g, x, y, c > 0.85 ? 2 : 1, c > 0.85 ? 2 : 1, tw > 0.95 ? '#ffffff' : '#d8d6ff');
  }

  // луна с «белым глазом»
  circleFill(g, 244, 72, 26, '#f4f1ff');
  circleFill(g, 254, 64, 22, '#171644');
  circleFill(g, 240, 74, 5, '#c9c4f0');

  // холмы
  ridge(g, 404, '#241a4d', 22, 0.017, 2);
  ridge(g, 428, '#170f36', 16, 0.027, 5);
  R(g, 0, 440, W, H - 440, '#0e0926');

  // лес-силуэт
  for (let x = -4; x < W; x += 9) {
    const h = 16 + ((x * 7) % 14);
    for (let i = 0; i < 4; i++) R(g, x + i, 434 - h + i * (h / 4), 9 - i * 2, h / 4 + 1, '#0b0722');
  }

  // светлячки
  for (let i = 0; i < 14; i++) {
    const x = ((i * 53 + t * 9) % (W + 40)) - 20;
    const y = 360 + Math.sin(t * 1.3 + i) * 26;
    if (Math.sin(t * 3 + i * 2) > -0.2) R(g, x, y, 2, 2, '#ffe9a8');
  }
}

/* =========================================================================
   СЦЕНА 2 — КАРАДУГАН: ивы, ручей, холм с лесом
   ========================================================================= */
function sceneMeadow(g, t) {
  drawSky(g, [
    [0, '#7fc7ea'],
    [80, '#a8dcf2'],
    [170, '#cdeaf6'],
    [250, '#eaf6e6']
  ]);

  circleFill(g, 62, 58, 18, '#fff6c9');
  puffCloud(g, 150 + Math.sin(t * 0.09) * 14, 44, 4, '#ffffff', '#eaf6ff');
  puffCloud(g, 30 + Math.sin(t * 0.06 + 3) * 9, 110, 3, '#ffffff', '#eaf6ff');

  // холм с лесом
  for (let x = 0; x < W; x++) {
    const h = 74 * Math.exp(-Math.pow((x - 236) / 88, 2));
    R(g, x, 300 - h, 1, H - 300 + h, '#7fb35a');
  }
  for (let i = 0; i < 26; i++) {
    const x = 168 + ((i * 29) % 140);
    const hh = 74 * Math.exp(-Math.pow((x - 236) / 88, 2));
    const y = 300 - hh + ((i * 17) % 26);
    R(g, x, y - 10, 8, 12, '#2f6b3a');
    R(g, x + 1, y - 16, 6, 8, '#3d834a');
    R(g, x + 3, y + 2, 2, 4, '#5a4326');
  }

  // луг
  R(g, 0, 316, W, H - 316, '#8dc063');
  R(g, 0, 316, W, 5, '#a6d47a');
  for (let i = 0; i < 90; i++) {
    const x = (i * 47) % W, y = 330 + ((i * 31) % 140);
    R(g, x, y, 1, 4, '#6fa84c');
    if (i % 7 === 0) R(g, x + 2, y - 2, 2, 2, i % 3 ? '#ffe7a0' : '#ffb8d0');
  }

  // ручей
  for (let y = 322; y < H; y += 4) {
    const cx = 92 + Math.sin(y * 0.03 + 1) * 26;
    const w = 16 + (y - 322) * 0.16;
    R(g, cx - w / 2, y, w, 4, '#8fd0e8');
    R(g, cx - w / 2 + ((t * 20 + y) % w), y, 3, 2, '#dff4fb');
    R(g, cx - w / 2 - 2, y, 2, 4, '#6aa8c4');
    R(g, cx + w / 2, y, 2, 4, '#6aa8c4');
  }

  // ивы
  willow(g, 42, 330, t, 1);
  willow(g, 268, 356, t, -1);

  // пыльца
  for (const [a, b, c] of POLLEN) {
    const x = ((a * W + t * (6 + c * 8)) % (W + 20)) - 10;
    const y = 250 + b * 180 + Math.sin(t * 1.1 + b * 9) * 8;
    R(g, x, y, 2, 2, 'rgba(255,255,220,0.85)');
  }
}

function willow(g, x, base, t, dir) {
  const sway = Math.sin(t * 0.9) * 3 * dir;
  // ствол
  R(g, x - 4, base - 58, 8, 58, '#6b5233');
  R(g, x - 1, base - 58, 3, 58, '#8a6c46');
  // крона
  R(g, x - 30, base - 92, 60, 18, '#4f8a3c');
  R(g, x - 22, base - 100, 44, 10, '#63a24b');
  R(g, x - 12, base - 106, 24, 8, '#7dbb5e');
  R(g, x - 34, base - 82, 68, 8, '#3f7330');
  // плакучие ветви
  for (let i = -4; i <= 4; i++) {
    const bx = x + i * 8 + sway * (Math.abs(i) / 4);
    const len = 30 - Math.abs(i) * 3 + ((i * 7) % 5);
    R(g, bx, base - 76, 4, len, i % 2 ? '#4f8a3c' : '#63a24b');
    R(g, bx + 1, base - 76 + len, 2, 6, '#3f7330');
  }
}

/* =========================================================================
   СЦЕНА 3 — ЗЛАЯ, КРАСНАЯ: «Кызар»
   ========================================================================= */
let flash = 0;
function sceneRed(g, t) {
  drawSky(g, [
    [0, '#1a0208'],
    [70, '#3d0510'],
    [150, '#6d0a15'],
    [220, '#a5121a'],
    [290, '#d93a1c'],
    [350, '#ff7a2e']
  ]);

  if (Math.random() < 0.004) flash = 1;
  if (flash > 0) {
    R(g, 0, 0, W, H, 'rgba(255,220,180,' + (flash * 0.35) + ')');
    flash -= 0.08;
  }

  // кровавое солнце
  circleFill(g, 160, 300, 46, '#ffb43c');
  circleFill(g, 160, 300, 38, '#ff7a2e');
  for (let i = 0; i < 6; i++) R(g, 108, 268 + i * 13, 104, 3, '#c11a18');

  // рваные чёрные скалы
  jagged(g, 322, '#3a0409', 46, 26, 3);
  jagged(g, 344, '#1a0206', 62, 18, 11);
  R(g, 0, 380, W, H - 380, '#120105');

  // трещины
  for (let i = 0; i < 7; i++) {
    let x = 20 + i * 44, y = 388;
    for (let k = 0; k < 8; k++) {
      R(g, x, y, 2, 6, '#ff5a1e');
      x += ((i + k) % 3) - 1;
      y += 8;
    }
  }

  // угли
  for (const [a, b, c] of EMBERS) {
    const y = H - ((t * (16 + c * 30) + b * 400) % 460);
    const x = a * W + Math.sin(t * 2 + b * 10) * 6;
    R(g, x, y, 2, 2, c > 0.6 ? '#ffd27a' : '#ff6a20');
  }
}

function jagged(g, base, color, amp, step, seed) {
  let prev = base;
  for (let x = 0; x < W + step; x += step) {
    const h = base - (Math.abs(Math.sin(x * 0.07 + seed)) * amp + ((x * seed) % 17));
    for (let k = 0; k < step; k++) {
      const y = prev + (h - prev) * (k / step);
      R(g, x + k, y, 1, H - y, color);
    }
    prev = h;
  }
}

/* =========================================================================
   СЦЕНА 4 — ДИҢГЕЗ: под водой в красном море
   ========================================================================= */
const BUBBLES = seeded(30, 61);
const FISH = seeded(9, 23);

function sceneSea(g, t) {
  drawSky(g, [
    [0, '#ff9c6a'],
    [46, '#f2603f'],
    [120, '#cc2b34'],
    [210, '#991426'],
    [300, '#68091d'],
    [396, '#440614']
  ]);

  // поверхность воды с волнами
  for (let x = 0; x < W; x++) {
    const h = 6 + Math.sin(x * 0.09 + t * 1.6) * 3 + Math.sin(x * 0.21 - t) * 2;
    R(g, x, 0, 1, h, '#ffd9a8');
    R(g, x, h, 1, 3, '#ffb27e');
  }

  // солнечные столбы света
  for (let i = 0; i < 5; i++) {
    const bx = 30 + i * 64 + Math.sin(t * 0.25 + i) * 14;
    for (let y = 10; y < 300; y += 4) {
      const w = 12 + y * 0.06;
      R(g, bx + y * 0.16, y, w, 4, 'rgba(255,220,170,0.05)');
    }
  }

  // дно
  R(g, 0, 424, W, H - 424, '#7d1f2c');
  for (let x = 0; x < W; x++) {
    const h = 8 + Math.abs(Math.sin(x * 0.05)) * 8;
    R(g, x, 424 - h, 1, h, '#8f2a34');
  }
  for (let i = 0; i < 60; i++) {
    R(g, (i * 37) % W, 428 + ((i * 13) % 44), 2, 2, i % 3 ? '#a03a42' : '#611722');
  }

  // водоросли
  weed(g, 24, 428, 66, t, '#c8455a');
  weed(g, 52, 428, 48, t + 1.4, '#e0607a');
  weed(g, 214, 428, 58, t + 0.6, '#c8455a');
  weed(g, 292, 428, 72, t + 2.1, '#a83450');

  // кораллы
  coral(g, 84, 430, '#ff9ec4', '#ffd0e4');
  coral(g, 152, 434, '#ffb27e', '#ffe1c0');
  coral(g, 250, 430, '#d38ae8', '#f0c6ff');
  brainCoral(g, 190, 436, '#ff7fa8');
  brainCoral(g, 116, 440, '#e0607a');

  // морские звёзды
  star(g, 62, 452, '#ffd27a');
  star(g, 226, 458, '#ff9ec4');

  // рыбы
  for (let i = 0; i < FISH.length; i++) {
    const [a, b, c] = FISH[i];
    const dir = b > 0.5 ? 1 : -1;
    const speed = 10 + c * 26;
    const raw = (t * speed + a * 500) % (W + 80);
    const x = dir > 0 ? raw - 40 : W + 40 - raw;
    const y = 120 + b * 260 + Math.sin(t * 1.4 + a * 8) * 7;
    fish(g, x, y, dir, c > 0.6 ? '#ffd27a' : '#ffe9c9', c > 0.6 ? '#e0913a' : '#d8a98c', 1 + Math.round(c));
  }

  // медуза
  const jy = 250 + Math.sin(t * 0.7) * 18;
  circleFill(g, 286, jy, 9, 'rgba(255,200,225,0.85)');
  for (let i = 0; i < 4; i++) {
    R(g, 280 + i * 4, jy + 6, 2, 12 + Math.sin(t * 2 + i) * 4, 'rgba(255,200,225,0.6)');
  }

  // пузырьки
  for (const [a, b, c] of BUBBLES) {
    const y = H - ((t * (18 + c * 26) + b * 460) % 470);
    const x = a * W + Math.sin(t * 1.6 + b * 9) * 5;
    const r = c > 0.75 ? 3 : 2;
    R(g, x, y, r, r, 'rgba(255,225,205,0.7)');
  }
}

function weed(g, x, base, len, t, color) {
  for (let i = 0; i < len; i += 4) {
    const off = Math.sin(t * 1.1 + i * 0.16) * (i / len) * 7;
    R(g, x + off, base - i, 4, 4, i % 8 ? color : '#ffffff22');
    R(g, x + off, base - i, 2, 4, color);
  }
}

function coral(g, x, base, c1, c2) {
  R(g, x - 3, base - 20, 6, 22, c1);
  R(g, x - 12, base - 30, 5, 16, c1);
  R(g, x - 12, base - 34, 5, 6, c2);
  R(g, x + 8, base - 34, 5, 20, c1);
  R(g, x + 8, base - 38, 5, 6, c2);
  R(g, x - 3, base - 30, 6, 6, c2);
  R(g, x - 9, base - 22, 6, 4, c1);
  R(g, x + 4, base - 26, 6, 4, c1);
}

function brainCoral(g, x, base, c) {
  R(g, x - 10, base - 10, 21, 11, c);
  R(g, x - 7, base - 14, 15, 5, c);
  for (let i = -8; i < 9; i += 4) R(g, x + i, base - 12, 2, 8, 'rgba(90,10,30,0.45)');
}

function star(g, x, y, c) {
  R(g, x - 1, y - 4, 3, 9, c);
  R(g, x - 4, y - 1, 9, 3, c);
  R(g, x - 3, y - 3, 2, 2, c);
  R(g, x + 2, y - 3, 2, 2, c);
  R(g, x - 3, y + 2, 2, 2, c);
  R(g, x + 2, y + 2, 2, 2, c);
}

function fish(g, x, y, dir, c1, c2, size) {
  const s = size || 1;
  // клетка спрайта: dir > 0 — рыба плывёт вправо, головой вперёд
  const put = (ox, oy, w, h, c) => {
    const px = dir > 0 ? x + ox * s : x - (ox + w) * s;
    R(g, px, y + oy * s, w * s, h * s, c);
  };
  // хвост
  put(-4, 0, 2, 1, c1); put(-4, 5, 2, 1, c1);
  put(-3, 1, 2, 1, c1); put(-3, 4, 2, 1, c1);
  put(-2, 2, 2, 2, c1);
  // тело
  put(2, 0, 5, 1, c1);
  put(1, 1, 7, 1, c1);
  put(0, 2, 9, 1, c1);
  put(0, 3, 9, 1, c2);
  put(1, 4, 7, 1, c2);
  put(2, 5, 5, 1, c2);
  // плавник
  put(3, -1, 3, 1, c1);
  // глаз
  put(6, 2, 1, 1, '#4a0512');
}

/* =========================================================================
   ПАРАШЮТИСТ
   ========================================================================= */
function drawHero(g, x, y, pal, t) {
  const sway = Math.sin(t * 1.6) * 2;
  const cx = Math.round(x + sway);
  // купол
  const rows = [
    [-8, 16], [-13, 26], [-17, 34], [-19, 38], [-20, 40], [-20, 40], [-19, 38], [-17, 34]
  ];
  for (let i = 0; i < rows.length; i++) {
    const [off, w] = rows[i];
    const yy = y + i * 3;
    for (let s = 0; s < 5; s++) {
      const sw = w / 5;
      R(g, cx + off + s * sw, yy, sw, 3, s % 2 ? pal.canopyA : pal.canopyB);
    }
  }
  R(g, cx - 20, y + 24, 40, 2, pal.canopyEdge);
  // стропы
  for (const dx of [-18, -8, 8, 18]) {
    for (let k = 0; k < 12; k++) R(g, cx + dx * (1 - k / 14), y + 26 + k * 1.6, 1, 2, pal.lines);
  }
  // человек
  const by = y + 46;
  R(g, cx - 4, by, 8, 10, pal.body);
  R(g, cx - 3, by + 2, 6, 3, pal.bodyHi);
  R(g, cx - 3, by - 6, 6, 6, pal.skin);
  R(g, cx - 3, by - 8, 6, 3, pal.hair);
  R(g, cx - 6, by + 1, 2, 6, pal.skin);
  R(g, cx + 4, by + 1, 2, 6, pal.skin);
  R(g, cx - 3, by + 10, 2, 7, pal.legs);
  R(g, cx + 1, by + 10, 2, 7, pal.legs);
}

const SCENES = {
  title:  { draw: sceneTitle },
  night:  {
    draw: sceneNight,
    hero: { canopyA: '#e6e2ff', canopyB: '#9a8cd8', canopyEdge: '#6f61b0', lines: '#cfc9f2', body: '#3a2f6b', bodyHi: '#5a4a95', skin: '#f2c9a8', hair: '#20183f', legs: '#2a2150' },
    word: { fill: '#ffffff', shadow: '#0b0a2a', glow: 'rgba(180,170,255,0.55)' }
  },
  meadow: {
    draw: sceneMeadow,
    hero: { canopyA: '#fff6d0', canopyB: '#ffb8d0', canopyEdge: '#e07fa6', lines: '#ffffff', body: '#4a7fc1', bodyHi: '#7fb0e0', skin: '#f6cba6', hair: '#5b3a20', legs: '#2f5b8f' },
    word: { fill: '#ffffff', shadow: '#1d4a63', glow: 'rgba(255,255,255,0.6)' }
  },
  red:    {
    draw: sceneRed,
    hero: { canopyA: '#ffd27a', canopyB: '#c11a18', canopyEdge: '#5c0208', lines: '#ffb43c', body: '#1a0206', bodyHi: '#3d0510', skin: '#e8b48f', hair: '#0d0103', legs: '#26040a' },
    word: { fill: '#fff3d6', shadow: '#2a0206', glow: 'rgba(255,120,40,0.6)' }
  },
  sea:    {
    draw: sceneSea,
    hero: { canopyA: '#ffe1c0', canopyB: '#ff7fa8', canopyEdge: '#c8455a', lines: '#ffd9a8', body: '#2b6b7a', bodyHi: '#4a97a8', skin: '#f2c9a8', hair: '#20303f', legs: '#1f4f5c' },
    word: { fill: '#fff6e2', shadow: '#4a0512', glow: 'rgba(255,200,160,0.6)' }
  }
};
