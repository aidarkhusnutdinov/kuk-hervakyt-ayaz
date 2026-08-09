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
  init() { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); },
  play(freq, dur, type, vol) {
    if (!this.on) return;
    try {
      this.init();
      const o = this.ctx.createOscillator(), a = this.ctx.createGain();
      o.type = type || 'square';
      o.frequency.value = freq;
      a.gain.setValueAtTime(vol || 0.05, this.ctx.currentTime);
      a.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur);
      o.connect(a); a.connect(this.ctx.destination);
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
  if (snd.on) snd.click();
};

/* ---------- состояние ---------- */
const state = {
  screen: 'title',
  scene: 'title',
  party: null,
  title: '',       // заголовок стихотворения (сначала название партии, можно поправить)
  poem: [],        // строки стихотворения (название партии — отдельно, это заголовок)
  lists: [],       // списки падающих слов по раундам
  caught: 0,
  words: [],       // активные падающие слова
  hero: { x: W / 2, target: W / 2, y: 168 },
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
PARTIES.forEach((p, i) => {
  const b = document.createElement('button');
  b.className = 'btn party';
  b.innerHTML = '<span class="num">' + (i + 1) + '</span>' +
                '<span class="nm">' + p.title + '<span class="hint">' + p.hint + '</span></span>';
  b.onclick = () => choose(p);
  partiesEl.appendChild(b);
});

function choose(p) {
  snd.click();
  state.party = p;
  state.scene = p.scene;
  state.title = p.title;
  state.poem = [];
  state.caught = 0;
  buildLists();
  $('howto-line').textContent = '«' + p.title + '»';
  show('s-howto');
}

$('howto-next').onclick = () => { snd.click(); askLine(); };

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

const ORDINAL = ['', 'первой', 'второй', 'третьей', 'четвёртой', 'пятой', 'шестой'];

function askLine(caughtWord) {
  state.words = [];
  const n = state.poem.length + 1;
  renderPoem($('line-poem'), { caughtWord: caughtWord, cursor: true });
  $('line-label').textContent = n === 1
    ? 'Напиши начало первой строчки — два-три слова. Конец поймаешь в небе.'
    : 'Напиши начало ' + (ORDINAL[n] || '') + ' строчки. Конец поймаешь в небе.';
  $('line-err').textContent = '';
  $('line-input').value = '';
  show('s-line');
  setTimeout(() => $('line-input').focus(), 120);
}

function submitLine() {
  const v = $('line-input').value.trim().replace(/\s+/g, ' ');
  if (!v) { $('line-err').textContent = 'Нужно хотя бы одно слово'; return; }
  if (v.split(' ').length > 6) { $('line-err').textContent = 'Слишком длинно — два-три слова'; return; }
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
  $('hud').textContent = 'строка ' + state.poem.length + ' из ' + CONFIG.CATCHES + '  ·  поймай слово';
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
function poemText() {
  return (state.title ? state.title + '\n\n' : '') + state.poem.join('\n');
}

function shareText() {
  return poemText() +
    '\n\n— — —\n' +
    'Стихотворение написано здесь: ' + CONFIG.SITE_URL + '\n' +
    'Новый сингл ' + CONFIG.ARTIST + ' — «' + CONFIG.SINGLE + '»: ' + CONFIG.RELEASE_URL;
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
  $('sh-edit').textContent = 'готово';
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
  $('sh-edit').textContent = 'править';
}

function syncEdit() { if (editing) stopEditing(true); }

$('sh-edit').onclick = () => {
  snd.click();
  if (editing) stopEditing(true); else startEditing();
};

/* ---------- картинка для инстаграма ---------- */
function buildPoster(cb) {
  const PW = 1080, PH = 1920;
  const pc = document.createElement('canvas');
  pc.width = PW; pc.height = PH;
  const p = pc.getContext('2d');
  p.imageSmoothingEnabled = false;

  // фон — текущая сцена, растянутая на всю сторис
  p.drawImage(cv, 0, 0, W, H, -100, 0, W * 4, H * 4);
  p.fillStyle = 'rgba(30,8,40,0.18)';
  p.fillRect(0, 0, PW, PH);

  // облако с текстом
  const lines = state.poem;
  const lh = lines.length > 6 ? 70 : 86;
  const bodyH = 150 + lines.length * lh + 50;
  const bx = 100, bw = 880;
  const by = Math.max(320, Math.min(1040, 1680 - bodyH));
  const parts = [
    { t: 'r', x: bx, y: by, w: bw, h: bodyH },
    { t: 'e', cx: bx + 210, cy: by + 10,      rx: 150, ry: 80 },
    { t: 'e', cx: bx + 450, cy: by - 14,      rx: 175, ry: 105 },
    { t: 'e', cx: bx + 690, cy: by + 16,      rx: 135, ry: 76 },
    { t: 'e', cx: bx + 250, cy: by + bodyH,      rx: 145, ry: 72 },
    { t: 'e', cx: bx + 600, cy: by + bodyH - 8,  rx: 125, ry: 62 }
  ];
  const paint = (grow, color) => {
    p.fillStyle = color;
    parts.forEach(s => {
      p.beginPath();
      if (s.t === 'r') {
        if (p.roundRect) p.roundRect(s.x - grow, s.y - grow, s.w + 2 * grow, s.h + 2 * grow, 44 + grow);
        else p.rect(s.x - grow, s.y - grow, s.w + 2 * grow, s.h + 2 * grow);
      } else {
        p.ellipse(s.cx, s.cy, s.rx + grow, s.ry + grow, 0, 0, Math.PI * 2);
      }
      p.fill();
    });
  };
  paint(10, '#ffc2dd');
  paint(0, '#fffdfa');

  // заголовок — название партии
  p.textAlign = 'center';
  p.textBaseline = 'top';
  p.fillStyle = '#c0356a';
  p.font = 'bold 54px Menlo, Consolas, "Courier New", monospace';
  p.fillText(state.title, bx + bw / 2, by + 46);

  p.fillStyle = '#ffc2dd';
  p.fillRect(bx + 120, by + 122, bw - 240, 4);

  // строки
  p.fillStyle = '#3a1c44';
  let size = 46;
  const maxW = bw - 120;
  lines.forEach(l => {
    while (size > 26) {
      p.font = '' + size + 'px Menlo, Consolas, "Courier New", monospace';
      if (p.measureText(l).width <= maxW) break;
      size -= 2;
    }
  });
  p.font = '' + size + 'px Menlo, Consolas, "Courier New", monospace';
  lines.forEach((l, i) => p.fillText(l, bx + bw / 2, by + 170 + i * lh));

  // подпись
  p.fillStyle = '#ffffff';
  p.shadowColor = 'rgba(30,8,40,0.85)';
  p.shadowOffsetX = 3; p.shadowOffsetY = 3;
  p.font = 'bold 40px Menlo, Consolas, "Courier New", monospace';
  p.fillText(CONFIG.ARTIST + ' — «' + CONFIG.SINGLE + '»', PW / 2, by + bodyH + 130);
  p.font = '30px Menlo, Consolas, "Courier New", monospace';
  p.fillText(CONFIG.SITE_URL.replace(/^https?:\/\//, ''), PW / 2, by + bodyH + 190);
  p.shadowOffsetX = 0; p.shadowOffsetY = 0;

  pc.toBlob(cb, 'image/png');
}

$('sh-insta').onclick = () => {
  syncEdit();
  snd.click();
  toast('Рисую картинку…');
  buildPoster(async blob => {
    if (!blob) { toast('Не вышло сделать картинку'); return; }
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
    toast('Картинка сохранилась — выложи её в сторис');
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
$('sh-tg').onclick = () => { syncEdit(); open('https://t.me/share/url?url=' +
  encodeURIComponent(CONFIG.RELEASE_URL) + '&text=' + encodeURIComponent(poemText() +
  '\n\nСтихотворение написано здесь: ' + CONFIG.SITE_URL + '\nНовый сингл ' + CONFIG.ARTIST + ' — «' + CONFIG.SINGLE + '»:')); };
$('sh-wa').onclick = () => { syncEdit(); open('https://wa.me/?text=' + encodeURIComponent(shareText())); };
$('sh-mail').onclick = () => { syncEdit(); open('mailto:?subject=' +
  encodeURIComponent('Стихотворение · ' + CONFIG.ARTIST + ' — ' + CONFIG.SINGLE) +
  '&body=' + encodeURIComponent(shareText())); };
$('sh-copy').onclick = () => { syncEdit(); copy(shareText()); };
$('sh-again').onclick = () => {
  snd.click();
  state.poem = []; state.caught = 0; state.words = []; state.scene = 'title';
  state.party = null; state.title = ''; stopEditing(false);
  show('s-title');
};

function copy(text) {
  const done = () => toast('Скопировано');
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
  try { document.execCommand('copy'); done(); } catch (e) { toast('Не вышло скопировать'); }
  ta.remove();
}

/* ---------- управление ---------- */
const keys = {};
window.addEventListener('keydown', e => {
  if (['ArrowLeft', 'ArrowRight', 'a', 'd', 'A', 'D'].includes(e.key)) { keys[e.key] = true; e.preventDefault(); }
});
window.addEventListener('keyup', e => { keys[e.key] = false; });

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

function loop(now) {
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.1) dt = 0.1;
  clock += dt;

  const scene = SCENES[state.scene] || SCENES.title;
  scene.draw(g, clock);

  if (state.scene !== 'title') {
    if (state.screen === 's-game') update(dt);
    drawWords(scene);
    drawHero(g, state.hero.x, state.hero.y, scene.hero, clock);
    drawSparks(g, dt);
  }

  requestAnimationFrame(loop);
}

function update(dt) {
  const h = state.hero;

  let kv = 0;
  if (keys['ArrowLeft'] || keys['a'] || keys['A']) kv -= 1;
  if (keys['ArrowRight'] || keys['d'] || keys['D']) kv += 1;
  if (kv) h.target = h.x + kv * 40;

  h.target = Math.max(24, Math.min(W - 24, h.target));
  h.x += (h.target - h.x) * Math.min(1, 9 * dt);
  h.x = Math.max(24, Math.min(W - 24, h.x));

  if (state.freeze > 0) { state.freeze -= dt; return; }

  const box = { x: h.x - 21, y: h.y, w: 42, h: 58 };
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
