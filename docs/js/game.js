/* =========================================================================
   ИГРА
   ========================================================================= */

const cv = document.getElementById('c');
const g = cv.getContext('2d');
g.imageSmoothingEnabled = false;

const frame = document.getElementById('frame');
const $ = id => document.getElementById(id);

/* ---------- масштаб под экран ---------- */
function fit() {
  const vv = window.visualViewport;
  const vw = vv ? vv.width : window.innerWidth;
  const vh = vv ? vv.height : window.innerHeight;
  const s = Math.min(vw / W, vh / H);
  frame.style.transform = 'scale(' + s + ')';
  frame._scale = s;
}
window.addEventListener('resize', fit);
if (window.visualViewport) window.visualViewport.addEventListener('resize', fit);
fit();

/* ---------- облака: пуфы по краям ---------- */
const PUFFS = [
  { top: -15, left: '8%',  w: '34%', h: 30 },
  { top: -24, left: '30%', w: '28%', h: 44 },
  { top: -13, left: '62%', w: '26%', h: 26 },
  { bottom: -13, left: '14%', w: '30%', h: 26 },
  { bottom: -11, left: '52%', w: '24%', h: 22 }
];
document.querySelectorAll('.cloud').forEach(cloud => {
  PUFFS.forEach(p => {
    const d = document.createElement('span');
    d.className = 'puff';
    d.style.left = p.left;
    d.style.width = p.w;
    d.style.height = p.h + 'px';
    if (p.top !== undefined) d.style.top = p.top + 'px';
    else d.style.bottom = p.bottom + 'px';
    cloud.appendChild(d);
  });
});

/* ---------- звук ---------- */
const snd = {
  on: true, ctx: null,
  init() { this.ctx = AUDIO.get(); },
  play(freq, dur, type, vol) {
    if (!this.on) return;
    try {
      this.init();
      const o = this.ctx.createOscillator(), a = this.ctx.createGain();
      o.type = type || 'square';
      o.frequency.value = freq;
      a.gain.setValueAtTime(vol || 0.05, this.ctx.currentTime);
      a.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur);
      o.connect(a); a.connect(AUDIO.sfx);
      o.start(); o.stop(this.ctx.currentTime + dur);
    } catch (e) { /* тишина лучше ошибки */ }
  },
  click() { this.play(520, 0.07, 'square', 0.04); },
  catchWord() {
    [660, 880, 1320].forEach((f, i) => setTimeout(() => this.play(f, 0.16, 'triangle', 0.07), i * 70));
  },
  done() {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.play(f, 0.3, 'triangle', 0.07), i * 130));
  }
};
$('sound').onclick = () => {
  snd.on = !snd.on;
  $('sound').classList.toggle('off', !snd.on);
  music.setOn(snd.on);
  if (snd.on) snd.click();
};

/* ---------- состояние ---------- */
const state = {
  screen: 's-lang',
  scene: 'title',
  party: null,
  title: '',       // заголовок стихотворения (сначала название партии, можно поправить)
  poem: [],        // строки стихотворения (название партии — отдельно, это заголовок)
  lists: [],       // списки падающих слов по раундам
  caught: 0,
  words: [],       // активные падающие слова
  hero: { x: W / 2, target: W / 2, y: 168, dir: 1 },
  sparks: [],
  freeze: 0
};

/* ---------- выбор слов ---------- */
function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function splitGroup(group) {
  const s = shuffle(group);
  if (s.length < 2) return [s, s];
  let lo = 1, hi = s.length - 1;
  if (s.length >= 5) { lo = 2; hi = s.length - 2; }
  const cut = lo + Math.floor(Math.random() * (hi - lo + 1));
  return [s.slice(0, cut), s.slice(cut)];
}

function buildLists() {
  const gi = shuffle(WORD_GROUPS.map((_, i) => i));
  const a = WORD_GROUPS[gi[0]];
  const b = WORD_GROUPS[gi[1] !== undefined ? gi[1] : gi[0]];
  const [a1, a2] = splitGroup(a);
  const [b1, b2] = splitGroup(b);
  state.lists = [a1, a2, b1, b2];
}

/* ---------- экраны ---------- */
function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
  state.screen = id;
}

/* заставка: кнопки партий */
const partiesEl = $('parties');

function buildParties() {
  partiesEl.innerHTML = '';
  PARTIES.forEach((p, i) => {
    const b = document.createElement('button');
    b.className = 'btn party';
    b.innerHTML = '<span class="num">' + (i + 1) + '</span>' +
                  '<span class="nm">' + p.title +
                  '<span class="hint">' + L('partyHints')[p.id] + '</span></span>';
    b.onclick = () => choose(p);
    partiesEl.appendChild(b);
  });
}

/* ---------- язык ---------- */
/* Все надписи живут в STRINGS (config.js). Здесь они только расставляются
   по местам — и заново, если человек сменил язык. */
function applyLang() {
  document.documentElement.lang = CONFIG.LANG === 'tt' ? 'tt' : 'ru';

  $('title-choose').textContent = L('chooseParty');
  $('howto-text').innerHTML = L('howto').map(t => '<p>' + t + '</p>').join('');
  $('howto-next').textContent = L('btnNext');
  $('line-next').textContent = L('btnCatch');
  $('tip').innerHTML = L('tip').replace(/ /g, '&nbsp;');
  $('sh-edit').textContent = editing ? L('editDone') : L('edit');
  $('sh-native').textContent = L('btnSend');
  $('sh-insta').textContent = L('btnInsta');
  $('sh-mail').textContent = L('btnMail');
  $('sh-copy').textContent = L('btnCopy');
  $('sh-again').textContent = L('btnAgain');

  buildParties();
}

function setLang(lang) {
  CONFIG.LANG = lang;
  try { localStorage.setItem('ayaz-lang', lang); } catch (e) { /* приватный режим */ }
  applyLang();
}

$('lang-tt').onclick = () => { snd.click(); setLang('tt'); music.play('title'); show('s-title'); };
$('lang-ru').onclick = () => { snd.click(); setLang('ru'); music.play('title'); show('s-title'); };

function choose(p) {
  snd.click();
  state.party = p;
  state.scene = p.scene;
  state.title = p.title;
  state.hero.y = SCENES[p.scene].heroY || 168;
  state.poem = [];
  state.caught = 0;
  buildLists();
  $('howto-line').textContent = '«' + p.title + '»';
  show('s-howto');
}

/* Тема заставки играет и на экране с правилами — иначе её никто не услышит:
   до первого касания экрана браузер вообще не даёт звучать, а первое касание
   у большинства придётся на кнопку партии. Тема партии вступает здесь, когда
   игра по-настоящему начинается. */
$('howto-next').onclick = () => { snd.click(); music.play(state.scene); askLine(); };

/* ---------- стихотворение на экране ---------- */
function renderPoem(el, opts) {
  opts = opts || {};
  el.innerHTML = '';
  const h = document.createElement('div');
  h.className = 'ptitle';
  h.textContent = state.title;
  el.appendChild(h);

  state.poem.forEach((line, i) => {
    const d = document.createElement('div');
    const last = i === state.poem.length - 1;
    if (last && opts.caughtWord && line.endsWith(opts.caughtWord)) {
      d.appendChild(document.createTextNode(line.slice(0, line.length - opts.caughtWord.length)));
      const sp = document.createElement('span');
      sp.className = 'caught';
      sp.textContent = opts.caughtWord;
      d.appendChild(sp);
    } else {
      d.textContent = line;
    }
    el.appendChild(d);
  });

  if (opts.cursor) {
    const d = document.createElement('div');
    const sp = document.createElement('span');
    sp.className = 'cursor';
    sp.textContent = '_';
    d.appendChild(sp);
    el.appendChild(d);
  }
}

function askLine(caughtWord) {
  state.words = [];
  const n = state.poem.length + 1;
  renderPoem($('line-poem'), { caughtWord: caughtWord, cursor: true });
  $('line-label').textContent = n === 1
    ? L('lineFirst')
    : L2('lineNext', { n: L('ordinal')[n] || n });
  $('line-err').textContent = '';
  $('line-input').value = '';
  show('s-line');
  setTimeout(() => $('line-input').focus(), 120);
}

function submitLine() {
  const v = $('line-input').value.trim().replace(/\s+/g, ' ');
  if (!v) { $('line-err').textContent = L('errEmpty'); return; }
  if (v.split(' ').length > 6) { $('line-err').textContent = L('errLong'); return; }
  snd.click();
  $('line-input').blur();
  state.poem.push(v);
  startRound();
}
$('line-next').onclick = submitLine;
$('line-input').addEventListener('keydown', e => { if (e.key === 'Enter') submitLine(); });

/* ---------- раунд ---------- */
function startRound() {
  const list = state.lists[state.caught % state.lists.length];
  state.words = list.map((w, i) => makeWord(w, i));
  state.freeze = 0;
  state.hero.x = state.hero.target = W / 2;
  $('hud').textContent = L2('hud', { n: state.poem.length, total: CONFIG.CATCHES });
  $('tip').classList.remove('hide');
  setTimeout(() => $('tip').classList.add('hide'), 3200);
  show('s-game');
}

function makeWord(text, i) {
  g.font = wordFont();
  const w = g.measureText(text).width;
  return {
    text: text, w: w, h: 16,
    x: 8 + Math.random() * (W - 16 - w),
    y: -20 - i * (40 + Math.random() * 70),
    v: CONFIG.WORD_SPEED_MIN + Math.random() * (CONFIG.WORD_SPEED_MAX - CONFIG.WORD_SPEED_MIN),
    ph: Math.random() * 6
  };
}

function wordFont() { return 'bold 14px Menlo, Consolas, "Courier New", monospace'; }

function onCatch(word) {
  snd.catchWord();
  state.poem[state.poem.length - 1] += ' ' + word.text;
  state.caught++;
  for (let i = 0; i < 22; i++) {
    state.sparks.push({
      x: state.hero.x, y: state.hero.y + 20,
      vx: (Math.random() - 0.5) * 90, vy: -Math.random() * 90,
      life: 0.7 + Math.random() * 0.5
    });
  }
  state.freeze = 0.9;
  setTimeout(() => {
    if (state.caught >= CONFIG.CATCHES) finish(word.text);
    else askLine(word.text);
  }, 900);
}

/* ---------- финал ---------- */
/* Заголовок партии остаётся только на экране — тем, чем делятся,
   уходят одни строки стихотворения. */
function poemText() {
  return state.poem.join('\n');
}

/* Текст для мессенджеров — на языке, на котором играли, и со ссылками
   целиком: короткий вид без http годится для картинки, но не для чата. */
function shareText() {
  return poemText() +
    '\n\n— — —\n' +
    L('shareWrote') + ' ' + CONFIG.SITE_URL + '\n' +
    L('shareAbout') + '\n' +
    L('shareListen') + ' ' + CONFIG.RELEASE_URL;
}

function finish(caughtWord) {
  state.words = [];
  snd.done();
  stopEditing(false);
  renderPoem($('final-poem'), { caughtWord: caughtWord });
  $('hud').textContent = '';
  show('s-final');
}

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  $('ui').appendChild(t);
  setTimeout(() => t.remove(), 2600);
}

/* ---------- правка текста перед отправкой ---------- */
let editing = false;

function startEditing() {
  editing = true;
  const ta = $('final-edit');
  ta.value = (state.title ? state.title + '\n' : '') + state.poem.join('\n');
  ta.rows = Math.min(9, state.poem.length + 2);
  $('final-poem').hidden = true;
  ta.hidden = false;
  $('sh-edit').textContent = L('editDone');
  ta.focus();
  ta.setSelectionRange(ta.value.length, ta.value.length);
}

function stopEditing(save) {
  const ta = $('final-edit');
  if (editing && save) {
    const rows = ta.value.split('\n').map(l => l.trim()).filter(Boolean).slice(0, 9);
    if (rows.length) {
      state.title = rows[0];
      state.poem = rows.slice(1);
    }
    renderPoem($('final-poem'), {});
  }
  editing = false;
  ta.hidden = true;
  $('final-poem').hidden = false;
  $('sh-edit').textContent = L('edit');
}

function syncEdit() { if (editing) stopEditing(true); }

$('sh-edit').onclick = () => {
  snd.click();
  if (editing) stopEditing(true); else startEditing();
};

/* ---------- картинка для инстаграма ---------- */

/* Фон сториз всегда один — ива из Карадугана, крупным планом.
   Сцену рисуем заново в отдельный буфер, чтобы картинка не зависела
   от того, какую партию человек играл и что было на экране. */
const POSTER_BG = { x0: 0, y0: -89, w: 320 };  // окно в сцене (в её пикселях)
const POSTER_T = 0.6;                          // время анимации — чтобы кадр был всегда один и тот же
const POSTER_BANDS = { top: 150, bottom: 1600 };

function sceneBuffer() {
  const bc = document.createElement('canvas');
  bc.width = W; bc.height = H;
  const b = bc.getContext('2d');
  b.imageSmoothingEnabled = false;
  return { canvas: bc, ctx: b };
}

/* натягивает буфер сцены на сторис через одно и то же окно */
function blitScene(p, bc, PW, PH) {
  const k = PW / POSTER_BG.w;                  // масштаб сцены на сторис
  const ch = PH / k;                           // высота окна в пикселях сцены
  const y0 = POSTER_BG.y0;

  p.imageSmoothingEnabled = false;
  if (y0 < 0) {                                // окно выше сцены — добираем небо
    const gap = -y0 * k;
    p.drawImage(bc, POSTER_BG.x0, 0, POSTER_BG.w, 1, 0, 0, PW, gap);
    p.drawImage(bc, POSTER_BG.x0, 0, POSTER_BG.w, ch + y0, 0, gap, PW, PH - gap);
    return;
  }
  p.drawImage(bc, POSTER_BG.x0, y0, POSTER_BG.w, ch, 0, 0, PW, PH);
}

function drawPosterBg(p, PW, PH) {
  const buf = sceneBuffer();
  SCENES.meadow.draw(buf.ctx, POSTER_T);
  blitScene(p, buf.canvas, PW, PH);
}

/* Ива переднего плана — поверх облака со стихом, чтобы облако не висело
   отдельной каплей, а пряталось в ветвях. Координаты обязаны совпадать
   с той же ивой в сцене, иначе она двоится. */
const POSTER_TREE = { x: 199, base: 362 };

function drawPosterTree(p, PW, PH) {
  const buf = sceneBuffer();
  willow(buf.ctx, POSTER_TREE.x, POSTER_TREE.base, POSTER_T, -1);
  blitScene(p, buf.canvas, PW, PH);
}

const CLOUD_STEP = 4;   // ступенька у облаков
const PIXEL_STEP = 1;   // текст рисуем в полный размер: мельче — и татарские буквы не различить

/* надпись: отдельный буфер, чтобы её можно было огрубить до пикселей */
function pixelText(p, text, cx, top, px, color, bold) {
  const fs = Math.max(8, Math.round(px / PIXEL_STEP));
  const font = (bold ? 'bold ' : '') + fs + 'px Menlo, Consolas, "Courier New", monospace';
  const buf = document.createElement('canvas');
  let b = buf.getContext('2d');
  b.font = font;
  buf.width = Math.ceil(b.measureText(text).width) + 2;
  buf.height = Math.ceil(fs * 1.45);
  b = buf.getContext('2d');
  b.font = font;
  b.textBaseline = 'top';
  b.fillStyle = '#000000';
  b.fillText(text, 1, 0);
  harden(b, buf.width, buf.height, color, 128);

  const w = buf.width * PIXEL_STEP, h = buf.height * PIXEL_STEP;
  p.imageSmoothingEnabled = false;
  p.drawImage(buf, Math.round(cx - w / 2), Math.round(top), w, h);
  return w;
}

/* ширина надписи на готовом кегле */
function pixelWidth(text, px) {
  const fs = Math.max(8, Math.round(px / PIXEL_STEP));
  const b = document.createElement('canvas').getContext('2d');
  b.font = fs + 'px Menlo, Consolas, "Courier New", monospace';
  return b.measureText(text).width * PIXEL_STEP;
}

/* Сглаживание превращает мелкий буфер в мутную кашу при растяжении.
   Поэтому полутона выжигаем: пиксель либо есть, либо нет. */
function harden(b, w, h, color, threshold) {
  const img = b.getImageData(0, 0, w, h);
  const d = img.data;
  const r = parseInt(color.slice(1, 3), 16);
  const g2 = parseInt(color.slice(3, 5), 16);
  const bl = parseInt(color.slice(5, 7), 16);
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] >= (threshold || 128)) {
      d[i] = r; d[i + 1] = g2; d[i + 2] = bl; d[i + 3] = 255;
    } else {
      d[i + 3] = 0;
    }
  }
  b.putImageData(img, 0, 0);
}

/* Облако с каймой — как в интерфейсе игры, но ступеньками:
   рисуем в мелкий буфер и растягиваем без сглаживания, как надписи. */
function drawCloud(p, x, y, w, h, opts) {
  opts = opts || {};
  const S = CLOUD_STEP;
  const cw = Math.ceil(p.canvas.width / S), ch = Math.ceil(p.canvas.height / S);
  const c = document.createElement('canvas');
  c.width = cw; c.height = ch;
  let b = c.getContext('2d');

  const rx = x / S, ry = y / S, rw = w / S, rh = h / S;
  /* колбаска: ровная капсула с одинаковыми пузырями по краям —
     та же лепка, что у облаков, только вытянутая и симметричная */
  const parts = opts.roll ? (() => {
    const a = [{ t: 'r', x: rx, y: ry, w: rw, h: rh, r: rh / 2 }];
    for (let i = 0; i < 6; i++) {                 // ровная волна по обоим краям
      const cx = rx + rw * (0.14 + i * 0.144);
      a.push({ t: 'e', cx: cx, cy: ry,      rx: rw * 0.085, ry: rh * 0.20 });
      a.push({ t: 'e', cx: cx, cy: ry + rh, rx: rw * 0.085, ry: rh * 0.20 });
    }
    return a;
  })() : [
    { t: 'r', x: rx, y: ry, w: rw, h: rh },
    { t: 'e', cx: rx + rw * 0.24, cy: ry + 8 / S,      rx: rw * 0.17, ry: rh * 0.38 },
    { t: 'e', cx: rx + rw * 0.51, cy: ry - 8 / S,      rx: rw * 0.20, ry: rh * 0.46 },
    { t: 'e', cx: rx + rw * 0.78, cy: ry + 10 / S,     rx: rw * 0.15, ry: rh * 0.34 },
    // низ: либо два пузыря, либо один широкий — чтобы облако не выглядело вымем
    opts.wideBottom
      ? { t: 'e', cx: rx + rw * 0.50, cy: ry + rh, rx: rw * 0.36, ry: rh * 0.15 }
      : { t: 'e', cx: rx + rw * 0.29, cy: ry + rh, rx: rw * 0.16, ry: rh * 0.32 },
    opts.wideBottom
      ? { t: 'e', cx: rx + rw * 0.50, cy: ry + rh, rx: rw * 0.36, ry: rh * 0.15 }
      : { t: 'e', cx: rx + rw * 0.69, cy: ry + rh - 6 / S, rx: rw * 0.14, ry: rh * 0.28 }
  ];
  const paint = (grow, color) => {
    b.fillStyle = color;
    parts.forEach(s => {
      b.beginPath();
      if (s.t === 'r') {
        const r = ((s.r !== undefined ? s.r * S : 40) + grow * S) / S;
        if (b.roundRect) b.roundRect(s.x - grow, s.y - grow, s.w + 2 * grow, s.h + 2 * grow, r);
        else b.rect(s.x - grow, s.y - grow, s.w + 2 * grow, s.h + 2 * grow);
      } else {
        b.ellipse(s.cx, s.cy, s.rx + grow, s.ry + grow, 0, 0, Math.PI * 2);
      }
      b.fill();
    });
  };
  paint((opts.grow || 10) / S, '#000000');
  harden(b, cw, ch, opts.edge || '#ffc2dd');

  const c2 = document.createElement('canvas');
  c2.width = cw; c2.height = ch;
  const b2 = c2.getContext('2d');
  const outer = b;
  b = b2;
  paint(0, '#000000');
  harden(b2, cw, ch, opts.fill || '#fffdfa');
  outer.globalCompositeOperation = 'source-over';
  outer.drawImage(c2, 0, 0);

  p.imageSmoothingEnabled = false;
  p.drawImage(c, 0, 0, cw, ch, 0, 0, cw * S, ch * S);
}

/* подбирает кегль пиксельной надписи под ширину */
function pixelFit(p, text, maxW, from, to) {
  const buf = document.createElement('canvas').getContext('2d');
  let px = from;
  while (px > to) {
    const fs = Math.max(8, Math.round(px / PIXEL_STEP));
    buf.font = fs + 'px Menlo, Consolas, "Courier New", monospace';
    if (buf.measureText(text).width * PIXEL_STEP <= maxW) break;
    px -= PIXEL_STEP;
  }
  return px;
}

function buildPoster(cb) {
  const PW = 1080, PH = 1920;
  const pc = document.createElement('canvas');
  pc.width = PW; pc.height = PH;
  const p = pc.getContext('2d');
  p.imageSmoothingEnabled = false;

  drawPosterBg(p, PW, PH);

  p.textAlign = 'center';
  p.textBaseline = 'top';

  /* подбирает кегль так, чтобы строка влезла в ширину */
  const fit = (text, max, from, to, bold) => {
    let s = from;
    while (s > to) {
      p.font = (bold ? 'bold ' : '') + s + 'px Menlo, Consolas, "Courier New", monospace';
      if (p.measureText(text).width <= max) break;
      s -= 2;
    }
    p.font = (bold ? 'bold ' : '') + s + 'px Menlo, Consolas, "Courier New", monospace';
    return s;
  };

  /* ---- облако со стихотворением: середина кадра, без заголовка ---- */
  const lines = state.poem;
  const bw = 690, bx = (PW - bw) / 2;
  const maxW = bw - 84;

  let size = 45;
  lines.forEach(l => { size = Math.min(size, pixelFit(p, l, maxW, size, 20)); });
  const lh = Math.round(size * 1.7);
  const bodyH = 50 + lines.length * lh + 26;
  const by = Math.round((PH - bodyH) / 2);

  drawCloud(p, bx, by, bw, bodyH, { edge: '#ff8fbb', fill: '#fff3c4', grow: 16, wideBottom: true });

  lines.forEach((l, i) => pixelText(p, l, bx + bw / 2, by + 50 + i * lh, size, '#3a1c44'));

  drawPosterTree(p, PW, PH);

  /* ---- подписи в облачках, сверху и снизу ----
     Облачка не прижаты к краям кадра: сверху и снизу сторис перекрывает
     интерфейс инстаграма, и подпись там просто не увидят. */
  const speech = (y, rows, shape) => {
    const inner = 860;
    const head = rows.slice(0, -1), link = rows[rows.length - 1];
    let sHead = 34;
    head.forEach(t => { sHead = Math.min(sHead, pixelFit(p, t, inner, sHead, 25)); });
    const sLink = pixelFit(p, link, inner, 52, 28);

    const step = sHead + 16;
    const h = 28 + head.length * step + 10 + Math.round(sLink * 1.45) + 24;
    let w = pixelWidth(link, sLink);
    head.forEach(t => { w = Math.max(w, pixelWidth(t, sHead)); });
    w = Math.min(940, w + (shape === 'roll' ? 120 : 150));
    const x = Math.round((PW - w) / 2);

    drawCloud(p, x, y, w, h, { roll: shape === 'roll' });

    let yy = y + 28;
    head.forEach(t => { pixelText(p, t, PW / 2, yy, sHead, '#4a2a58'); yy += step; });
    pixelText(p, link, PW / 2, yy + 10, sLink, '#c0356a', true);
  };

  speech(POSTER_BANDS.top, L('posterTop'));
  speech(POSTER_BANDS.bottom, L('posterBottom'), 'roll');

  pc.toBlob(cb, 'image/png');
}

$('sh-insta').onclick = () => {
  syncEdit();
  snd.click();
  toast(L('toastDrawing'));
  buildPoster(async blob => {
    if (!blob) { toast(L('toastDrawFail')); return; }
    const file = new File([blob], 'kuk-hervakyt-ayaz.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: poemText() });
        return;
      } catch (e) { if (e && e.name === 'AbortError') return; }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kuk-hervakyt-ayaz.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    toast(L('toastSaved'));
  });
};

$('sh-native').onclick = async () => {
  syncEdit();
  const text = shareText();
  if (navigator.share) {
    try { await navigator.share({ title: CONFIG.ARTIST + ' — ' + CONFIG.SINGLE, text: text }); return; }
    catch (e) { if (e && e.name === 'AbortError') return; }
  }
  copy(text);
};
/* Телеграм сам подставляет url отдельной строкой — туда идёт сайт,
   а ссылка на песню остаётся в тексте. */
$('sh-tg').onclick = () => { syncEdit(); open('https://t.me/share/url?url=' +
  encodeURIComponent(CONFIG.SITE_URL) + '&text=' + encodeURIComponent(poemText() +
  '\n\n' + L('shareAbout') + '\n' + L('shareListen') + ' ' + CONFIG.RELEASE_URL + '\n' +
  L('shareWrote'))); };
$('sh-wa').onclick = () => { syncEdit(); open('https://wa.me/?text=' + encodeURIComponent(shareText())); };
$('sh-mail').onclick = () => { syncEdit(); open('mailto:?subject=' +
  encodeURIComponent(L('mailSubject') + CONFIG.ARTIST + ' — ' + CONFIG.SINGLE) +
  '&body=' + encodeURIComponent(shareText())); };
$('sh-copy').onclick = () => { syncEdit(); copy(shareText()); };
$('sh-again').onclick = () => {
  snd.click();
  music.play('title');
  state.poem = []; state.caught = 0; state.words = []; state.scene = 'title';
  state.party = null; state.title = ''; stopEditing(false);
  show('s-title');
};

function copy(text) {
  const done = () => toast(L('toastCopied'));
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done));
  } else fallbackCopy(text, done);
}
function fallbackCopy(text, done) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;opacity:0;';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); done(); } catch (e) { toast(L('toastCopyFail')); }
  ta.remove();
}

/* ---------- управление ---------- */
const keys = {};
window.addEventListener('keydown', e => {
  if (['ArrowLeft', 'ArrowRight', 'a', 'd', 'A', 'D'].includes(e.key)) { keys[e.key] = true; e.preventDefault(); }
});
window.addEventListener('keyup', e => { keys[e.key] = false; });

/* Счётчик для отладки звука: ?diag=1 в адресе. Показывает, насколько браузер
   опаздывает раскладывать ноты и сколько раз пришлось сдвинуть отсчёт петли.
   До 50 мс — нормально; большие числа значат, что отрисовка душит звук. */
if (new URLSearchParams(location.search).get('diag')) {
  const d = document.createElement('div');
  d.style.cssText = 'position:fixed;left:6px;top:6px;z-index:99;background:rgba(0,0,0,0.6);' +
                    'color:#9f9;font:11px Menlo,monospace;padding:4px 6px;border-radius:4px;pointer-events:none';
  document.body.appendChild(d);
  let fpsT = performance.now();
  setInterval(() => {
    const now = performance.now();
    const fps = Math.round(drawn * 1000 / (now - fpsT));
    drawn = 0; fpsT = now;
    d.textContent = 'кадров/с ' + fps +
                    ' · опоздание ' + Math.round(music.lag * 1000) + ' мс' +
                    ' · швов ' + music.skips +
                    ' · буфер ' + (AUDIO.ctx ? Math.round(AUDIO.ctx.baseLatency * 1000) : '—') + ' мс';
  }, 700);
}

/* браузер не даёт звучать до первого касания — заставка включается с него */
function firstTouch() {
  window.removeEventListener('pointerdown', firstTouch);
  window.removeEventListener('keydown', firstTouch);
  snd.init();
  if (state.screen === 's-title') music.play('title');
}
window.addEventListener('pointerdown', firstTouch);
window.addEventListener('keydown', firstTouch);

let pointerDown = false;
function pointerX(e) {
  const r = frame.getBoundingClientRect();
  return (e.clientX - r.left) / (frame._scale || 1);
}
frame.addEventListener('pointerdown', e => {
  snd.init();
  if (state.screen !== 's-game') return;
  pointerDown = true;
  state.hero.target = pointerX(e);
  $('tip').classList.add('hide');
});
frame.addEventListener('pointermove', e => {
  if (pointerDown && state.screen === 's-game') state.hero.target = pointerX(e);
});
window.addEventListener('pointerup', () => { pointerDown = false; });
window.addEventListener('pointercancel', () => { pointerDown = false; });
document.addEventListener('touchmove', e => {
  if (state.screen === 's-game') e.preventDefault();
}, { passive: false });

/* ---------- цикл ---------- */
let last = performance.now(), clock = 0;

/* Потолок частоты кадров. Тридцати хватает: пиксельная графика при них и
   задумывалась, а нагрузка на отрисовку вдвое меньше — Safari иначе не успевает
   и начинает трещать звуком. ?fps=60 в адресе снимает потолок. */
const FPS_PARAM = new URLSearchParams(location.search).get('fps');
const FPS_CAP = FPS_PARAM === null ? 30 : parseFloat(FPS_PARAM) || 0;
let nextFrame = 0, drawn = 0;

function loop(now) {
  requestAnimationFrame(loop);

  if (FPS_CAP > 0) {
    if (now < nextFrame) return;
    nextFrame = now + 1000 / FPS_CAP;
  }
  drawn++;

  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.1) dt = 0.1;
  clock += dt;

  const scene = SCENES[state.scene] || SCENES.title;
  scene.draw(g, clock);

  if (state.scene !== 'title') {
    if (state.screen === 's-game') update(dt);
    drawWords(scene);
    (scene.drawHero || drawHero)(g, state.hero.x, state.hero.y, scene.hero, clock, state.hero.dir);
    drawSparks(g, dt);
  }
}

function update(dt) {
  const h = state.hero;

  let kv = 0;
  if (keys['ArrowLeft'] || keys['a'] || keys['A']) kv -= 1;
  if (keys['ArrowRight'] || keys['d'] || keys['D']) kv += 1;
  if (kv) h.target = h.x + kv * 40;

  h.target = Math.max(24, Math.min(W - 24, h.target));
  const before = h.x;
  h.x += (h.target - h.x) * Math.min(1, 9 * dt);
  h.x = Math.max(24, Math.min(W - 24, h.x));
  if (h.x - before > 0.4) h.dir = 1;
  else if (h.x - before < -0.4) h.dir = -1;

  if (state.freeze > 0) { state.freeze -= dt; return; }

  const hb = (SCENES[state.scene] || {}).heroBox || { w: 42, h: 58 };
  const box = { x: h.x - hb.w / 2, y: h.y, w: hb.w, h: hb.h };
  for (const wd of state.words) {
    wd.y += wd.v * dt;
    wd.x += Math.sin(clock * 0.8 + wd.ph) * 0.25;
    wd.x = Math.max(4, Math.min(W - 4 - wd.w, wd.x));
    if (wd.x < box.x + box.w && wd.x + wd.w > box.x &&
        wd.y < box.y + box.h && wd.y + wd.h > box.y) {
      onCatch(wd);
      state.words = [];
      return;
    }
    if (wd.y > H + 24) {
      wd.y = -20 - Math.random() * 120;
      wd.x = 8 + Math.random() * (W - 16 - wd.w);
    }
  }
}

function drawWords(scene) {
  const pal = scene.word || { fill: '#fff', shadow: '#000' };
  g.font = wordFont();
  g.textAlign = 'left';
  g.textBaseline = 'top';
  for (const wd of state.words) {
    if (wd.y < -20) continue;
    g.fillStyle = pal.shadow;
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [2, 2]]) {
      g.fillText(wd.text, Math.round(wd.x) + dx, Math.round(wd.y) + dy);
    }
    g.fillStyle = pal.fill;
    g.fillText(wd.text, Math.round(wd.x), Math.round(wd.y));
  }
}

function drawSparks(g, dt) {
  for (let i = state.sparks.length - 1; i >= 0; i--) {
    const s = state.sparks[i];
    s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 120 * dt; s.life -= dt;
    if (s.life <= 0) { state.sparks.splice(i, 1); continue; }
    R(g, s.x, s.y, 2, 2, s.life > 0.4 ? '#ffffff' : '#ffd6ea');
  }
}

requestAnimationFrame(loop);

/* Язык: запомненный с прошлого раза или тот, что стоит в CONFIG.
   Вызов внизу файла — applyLang трогает состояние, объявленное выше. */
let savedLang = null;
try { savedLang = localStorage.getItem('ayaz-lang'); } catch (e) { /* приватный режим */ }
if (savedLang === 'ru' || savedLang === 'tt') CONFIG.LANG = savedLang;
applyLang();
