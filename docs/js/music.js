/* =========================================================================
   МУЗЫКА — псевдовосьмибитная версия «Күк һәрвакыт аяз»

   Ноты сняты с миди из проекта Ableton (папка «музыка» в корне репозитория):
   bass.mid, chords.mid, main melody.mid, extra.mid.
   Оригинал — 107 BPM, до мажор, петля в 16 тактов.

   Гармония:  C  →  Cmaj7  →  Fadd9  →  Am   (по такту на аккорд)
   Мелодия:   фраза в 8 тактов, звучит дважды
   Бас:       свой рисунок на каждый из четырёх тактов

   Звука-файлов нет: браузер синтезирует всё сам, как приставка.
   Четыре голоса — квадратный лид, квадратная гармония, треугольный бас, шум.
   ========================================================================= */

/* ---------- общий аудиоконтекст (им же пользуются звуки игры) ---------- */
const AUDIO = {
  ctx: null,
  music: null,   // шина музыки
  sfx: null,     // шина звуков игры
  get() {
    if (!this.ctx) {
      // Размер звукового буфера. По умолчанию браузер держит его крошечным
      // (6 мс) — звук готовится впритык, и любая заминка слышна как треск.
      // Больший буфер даёт запас, но если браузер всё же не успел, провал
      // выходит длиннее и заметнее. Что лучше — зависит от машины, поэтому
      // подбирается на слух: ?lat=0.05 в адресе страницы.
      const lat = parseFloat(new URLSearchParams(location.search).get('lat'));
      const Ctor = window.AudioContext || window.webkitAudioContext;
      try { this.ctx = lat > 0 ? new Ctor({ latencyHint: lat }) : new Ctor(); }
      catch (e) { this.ctx = new Ctor(); }
      this.music = this.ctx.createGain();
      this.music.gain.value = 0.9;
      this.music.connect(this.ctx.destination);
      this.sfx = this.ctx.createGain();
      this.sfx.gain.value = 1;
      this.sfx.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }
};

/* =========================================================================
   НОТЫ. Время — в долях от начала петли (64 доли = 16 тактов).
   Высота — номер миди-ноты, до первой октавы = 60.
   ========================================================================= */

/* Аккорды: по одному на такт, петля из четырёх */
const M_CHORDS = [
  [48, 52, 55, 60],       // C     — до ми соль до
  [48, 55, 59, 64],       // Cmaj7 — до соль си ми
  [53, 57, 60, 65, 67],   // Fadd9 — фа ля до фа соль
  [45, 48, 57, 64]        // Am    — ля до ля ми
];

/* Бас: 4 такта = 16 долей, дальше повторяется */
const M_BASS = [
  { b: 0.0,  d: 0.9,  p: 48 }, { b: 1.5,  d: 1.0,  p: 48 },
  { b: 2.5,  d: 0.5,  p: 43 }, { b: 3.0,  d: 1.0,  p: 45 },
  { b: 4.0,  d: 0.9,  p: 48 }, { b: 5.0,  d: 0.35, p: 48 },
  { b: 5.5,  d: 0.95, p: 55 }, { b: 6.5,  d: 0.55, p: 53 },
  { b: 7.0,  d: 0.75, p: 52 },
  { b: 8.0,  d: 0.85, p: 41 }, { b: 9.5,  d: 0.95, p: 41 },
  { b: 10.5, d: 0.6,  p: 45 }, { b: 11.0, d: 0.5,  p: 48 },
  { b: 11.5, d: 0.5,  p: 50 },
  { b: 12.0, d: 0.85, p: 45 }, { b: 13.5, d: 0.55, p: 45 },
  { b: 14.5, d: 0.35, p: 48 }, { b: 15.0, d: 1.0,  p: 40 }
];

/* Мелодия: 8 тактов = 32 доли, звучит дважды за петлю */
const M_LEAD = [
  { b: 0.0,  d: 1.0,  p: 64 },
  { b: 1.5,  d: 0.5,  p: 62 }, { b: 2.0,  d: 0.5,  p: 64 },
  { b: 2.5,  d: 0.5,  p: 64 }, { b: 3.0,  d: 2.3,  p: 67 },
  { b: 5.5,  d: 0.5,  p: 64 }, { b: 6.0,  d: 2.0,  p: 64 },
  { b: 9.5,  d: 0.5,  p: 57 }, { b: 10.0, d: 0.5,  p: 57 },
  { b: 10.5, d: 0.25, p: 65 }, { b: 11.0, d: 0.5,  p: 65 },
  { b: 11.5, d: 0.25, p: 65 }, { b: 11.75,d: 0.25, p: 65 },
  { b: 12.0, d: 2.4,  p: 64 }, { b: 14.5, d: 0.5,  p: 67 },
  { b: 15.0, d: 0.5,  p: 64 }, { b: 15.5, d: 0.5,  p: 67 },
  { b: 16.0, d: 1.0,  p: 64 },
  { b: 17.5, d: 0.5,  p: 64 }, { b: 18.0, d: 0.5,  p: 64 },
  { b: 18.5, d: 0.5,  p: 64 }, { b: 19.0, d: 1.7,  p: 67 },
  { b: 21.5, d: 0.5,  p: 64 }, { b: 22.0, d: 2.0,  p: 64 },
  { b: 25.5, d: 0.5,  p: 57 }, { b: 26.0, d: 0.5,  p: 57 },
  { b: 26.5, d: 0.4,  p: 65 }, { b: 27.0, d: 0.5,  p: 65 },
  { b: 27.5, d: 0.5,  p: 65 },
  { b: 28.0, d: 1.0,  p: 64 }, { b: 29.5, d: 0.5,  p: 60 },
  { b: 30.0, d: 0.5,  p: 64 }, { b: 30.5, d: 0.4,  p: 65 },
  { b: 31.0, d: 0.5,  p: 65 }, { b: 31.5, d: 0.5,  p: 65 }
];

/* Сбивка из extra.mid — 12-й такт петли */
const M_FILL = [
  { b: 45.5, d: 0.25, p: 64 }, { b: 45.5, d: 0.25, p: 69 }, { b: 45.5, d: 0.3, p: 72 },
  { b: 46.4, d: 0.3,  p: 76 }, { b: 46.5, d: 0.3,  p: 72 }, { b: 46.5, d: 0.3, p: 69 },
  { b: 47.0, d: 0.4,  p: 64 }, { b: 47.0, d: 0.4,  p: 67 }, { b: 47.0, d: 0.4, p: 71 }
];

const M_LOOP = 64;   // длина петли в долях

/* =========================================================================
   ПЯТЬ ВЕРСИЙ — по одной на партию, плюс тихая для заставки.

   drums: 16 шагов на такт. k — бочка, s — рабочий, h — хэт.
   ========================================================================= */

const ARRANGEMENTS = {

  /* заставка — тихо, только арпеджио и бас, мелодия во второй половине */
  title: {
    bpm: 96, cut: 3200, gain: 0.55,
    lead: { duty: 0.5, oct: 0, gain: 0.16, from: 32, vib: 0.3 },
    harm: { mode: 'arp8', duty: 0.25, oct: 0, gain: 0.06 },
    bass: { wave: 'triangle', oct: -1, gain: 0.22 },
    drums: null,
    echo: { time: 0.34, fb: 0.25, mix: 0.22 }
  },

  /* «Ак күзле төн карый» — ночная.
     Медленно, гулко, длинное эхо, ударных почти нет. */
  night: {
    bpm: 88, cut: 2400, gain: 0.7,
    lead: { duty: 0.5, oct: 0, gain: 0.15, from: 32, vib: 0.6, glide: true },
    harm: { mode: 'pad', duty: 0.5, oct: 0, gain: 0.05 },
    bass: { wave: 'triangle', oct: -1, gain: 0.26, click: true },
    drums: { k: 'x...............', s: '................', h: '....x.......x...', gain: 0.1 },
    echo: { time: 0.42, fb: 0.42, mix: 0.35 }
  },

  /* «Болыннар гүзәл» — Карадуган.
     Бодрое поп-чиптюн: аккорды на слабую долю, ровный бит. */
  meadow: {
    bpm: 107, cut: 9000, gain: 0.85,
    lead: { duty: 0.25, oct: 0, gain: 0.2, vib: 0.25 },
    harm: { mode: 'stab', duty: 0.25, oct: 0, gain: 0.09 },
    bass: { wave: 'triangle', oct: -1, gain: 0.3 },
    drums: { k: 'x.......x...x...', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', gain: 0.3 },
    fill: true
  },

  /* «Кызар» — злая.
     Быстро, жёстко, шестнадцатые в гармонии, лид продублирован октавой ниже. */
  red: {
    bpm: 128, cut: 12000, gain: 0.78,
    lead: { duty: 0.125, oct: 0, gain: 0.2, double: -12, detune: 8 },
    harm: { mode: 'arp16', duty: 0.125, oct: 0, gain: 0.06 },
    bass: { wave: 'square', oct: -1, gain: 0.17, click: true },
    drums: { k: 'x..x..x...x.x...', s: '....x.......x...', h: 'xxxxxxxxxxxxxxxx', gain: 0.27 },
    fill: true
  },

  /* «Диңгез» — под водой.
     Всё придушено фильтром, звук плывёт, вместо ударных — булькание. */
  sea: {
    bpm: 92, cut: 850, gain: 0.95,
    lead: { duty: 0.5, oct: -1, gain: 0.26, vib: 1.2, glide: true },
    harm: { mode: 'arp8', duty: 0.5, oct: 0, gain: 0.12 },
    bass: { wave: 'triangle', oct: -1, gain: 0.4 },
    drums: { k: 'x.......x.......', s: '................', h: '......x.......x.', gain: 0.16, blub: true },
    echo: { time: 0.38, fb: 0.4, mix: 0.4 },
    wobble: true
  },

  /* «Алтын кояш нурлары» — золотая.
     Торжественно: лид удвоен октавой выше, поверх мерцает быстрое арпеджио. */
  gold: {
    bpm: 100, cut: 7000, gain: 0.85,
    lead: { duty: 0.5, oct: 0, gain: 0.18, double: 12, vib: 0.4 },
    harm: { mode: 'nesarp', duty: 0.25, oct: 12, gain: 0.05 },
    bass: { wave: 'triangle', oct: -1, gain: 0.3 },
    drums: { k: 'x.......x.......', s: '....x.......x...', h: '..x...x...x...x.', gain: 0.2 },
    echo: { time: 0.3, fb: 0.3, mix: 0.28 },
    fill: true
  }
};

/* =========================================================================
   ПЛЕЕР
   ========================================================================= */

const music = {
  on: true,
  scene: null,
  arr: null,
  playing: false,
  t0: 0,          // время начала петли
  beat: 0,        // следующая доля к планированию
  lag: 0,         // самое большое опоздание планировщика, секунды
  skips: 0,       // сколько раз пришлось сдвигать отсчёт
  timer: null,
  nodes: null,    // цепочка эффектов текущей версии
  waves: {},      // кэш форм волны
  noise: null,

  /* ---------- формы волны ---------- */
  pulse(duty) {
    const key = 'p' + duty;
    if (this.waves[key]) return this.waves[key];
    const ctx = AUDIO.get(), n = 40;
    const real = new Float32Array(n), imag = new Float32Array(n);
    for (let i = 1; i < n; i++) imag[i] = (2 / (i * Math.PI)) * Math.sin(Math.PI * i * duty);
    const w = ctx.createPeriodicWave(real, imag);
    this.waves[key] = w;
    return w;
  },

  noiseBuf() {
    if (this.noise) return this.noise;
    const ctx = AUDIO.get();
    const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.noise = b;
    return b;
  },

  /* ---------- запуск и остановка ---------- */
  play(sceneId) {
    const arr = ARRANGEMENTS[sceneId];
    if (!arr) return;
    if (this.playing && this.scene === sceneId) return;
    this.stop();
    this.scene = sceneId;
    this.arr = arr;
    if (!this.on) return;
    this.build();
    const ctx = AUDIO.get();
    this.t0 = ctx.currentTime + 0.12;
    this.beat = 0;
    this.lag = 0;
    this.skips = 0;
    this.playing = true;
    this.tick();
    this.timer = setInterval(() => this.tick(), 60);
  },

  stop() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this.playing = false;
    if (this.nodes) {
      const ctx = AUDIO.ctx, n = this.nodes, t = ctx.currentTime;
      n.out.gain.setTargetAtTime(0.0001, t, 0.08);
      setTimeout(() => { try { n.out.disconnect(); } catch (e) {} }, 600);
      this.nodes = null;
    }
  },

  setOn(v) {
    this.on = v;
    if (!v) { const s = this.scene; this.stop(); this.scene = s; }
    else if (this.scene) { const s = this.scene; this.scene = null; this.play(s); }
  },

  /* ---------- цепочка эффектов под конкретную версию ---------- */
  build() {
    const ctx = AUDIO.get(), a = this.arr;

    const out = ctx.createGain();
    out.gain.value = a.gain;
    out.connect(AUDIO.music);

    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = a.cut;
    filt.Q.value = a.wobble ? 4 : 0.7;
    filt.connect(out);

    // под водой фильтр слегка плавает — звук «дышит»
    if (a.wobble) {
      const lfo = ctx.createOscillator(), amt = ctx.createGain();
      lfo.frequency.value = 0.13;
      amt.gain.value = 320;
      lfo.connect(amt); amt.connect(filt.frequency);
      lfo.start();
    }

    let echo = null;
    if (a.echo) {
      const dl = ctx.createDelay(1.0), fb = ctx.createGain(), mix = ctx.createGain();
      dl.delayTime.value = a.echo.time;
      fb.gain.value = a.echo.fb;
      mix.gain.value = a.echo.mix;
      dl.connect(fb); fb.connect(dl);
      dl.connect(mix); mix.connect(filt);
      echo = dl;
    }

    // Панорама и фильтры шума — общие на всю версию. Раньше они создавались
    // на каждую ноту и на каждый удар; Safari на таком количестве узлов
    // захлёбывается, а разницы на слух нет никакой.
    const pan = p => {
      if (!ctx.createStereoPanner) return filt;
      const n = ctx.createStereoPanner();
      n.pan.value = p;
      n.connect(filt);
      return n;
    };
    const hp = f => {
      const n = ctx.createBiquadFilter();
      n.type = 'highpass';
      n.frequency.value = f;
      n.connect(filt);
      return n;
    };

    this.nodes = {
      out: out, filt: filt, echo: echo,
      panL: pan(-0.25), panR: pan(0.25),
      hpS: hp(1400), hpH: hp(7000)
    };
  },

  /* ---------- один голос ---------- */
  voice(t, dur, midi, o) {
    const ctx = AUDIO.ctx, n = this.nodes;
    if (!n) return;
    const freq = 440 * Math.pow(2, (midi - 69) / 12);
    const osc = ctx.createOscillator();
    if (o.duty !== undefined) osc.setPeriodicWave(this.pulse(o.duty));
    else osc.type = o.wave || 'triangle';

    if (o.glide) {
      osc.frequency.setValueAtTime(freq * 0.94, t);
      osc.frequency.exponentialRampToValueAtTime(freq, t + 0.05);
    } else {
      osc.frequency.setValueAtTime(freq, t);
    }
    if (o.detune) osc.detune.setValueAtTime(o.detune, t);

    // вибрато вступает не сразу — только на длинных нотах
    if (o.vib && dur > 0.35) {
      const lfo = ctx.createOscillator(), amt = ctx.createGain();
      lfo.frequency.value = 5.5;
      amt.gain.setValueAtTime(0, t);
      amt.gain.linearRampToValueAtTime(o.vib * 14, t + Math.min(0.3, dur * 0.6));
      lfo.connect(amt); amt.connect(osc.detune);
      lfo.onended = () => { try { lfo.disconnect(); amt.disconnect(); } catch (e) {} };
      lfo.start(t); lfo.stop(t + dur + 0.1);
    }

    const g = ctx.createGain();
    const v = o.gain, atk = o.atk || 0.006, rel = o.rel || 0.05;
    const dec = Math.min(0.09, dur * 0.3);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + atk);
    g.gain.exponentialRampToValueAtTime(v * (o.sus || 0.72), t + atk + dec);
    g.gain.setValueAtTime(v * (o.sus || 0.72), t + Math.max(dur, atk + dec));
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, atk + dec) + rel);

    // Щипок: очень короткий призвук двумя октавами выше в самом начале ноты.
    // Низкий бас без него «наплывает» и кажется опаздывающим — ухо ловит момент
    // начала ноты по верхним частотам, а у 41 Гц их просто нет.
    if (o.click) {
      const co = ctx.createOscillator(), cg = ctx.createGain();
      co.type = 'square';
      co.frequency.setValueAtTime(freq * 4, t);
      cg.gain.setValueAtTime(v * 0.22, t);
      cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
      co.connect(cg); cg.connect(n.filt);
      co.onended = () => { try { co.disconnect(); cg.disconnect(); } catch (e) {} };
      co.start(t); co.stop(t + 0.04);
    }

    osc.connect(g);
    g.connect(o.pan < -0.05 ? n.panL : o.pan > 0.05 ? n.panR : n.filt);
    if (o.echo && n.echo) g.connect(n.echo);

    // Убираем за собой: Chrome освобождает отыгравшие узлы сам, Safari копит их
    // и постепенно задыхается.
    osc.onended = () => { try { osc.disconnect(); g.disconnect(); } catch (e) {} };

    osc.start(t);
    osc.stop(t + Math.max(dur, atk + dec) + rel + 0.03);
  },

  /* ---------- ударные ---------- */
  hit(t, kind, vol) {
    const ctx = AUDIO.ctx, n = this.nodes;
    if (!n) return;
    const dest = n.filt;

    if (kind === 'k') {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(150, t);
      o.frequency.exponentialRampToValueAtTime(44, t + 0.09);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      o.connect(g); g.connect(dest);
      o.onended = () => { try { o.disconnect(); g.disconnect(); } catch (e) {} };
      o.start(t); o.stop(t + 0.18);
      return;
    }

    if (kind === 'blub') {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(320, t);
      o.frequency.exponentialRampToValueAtTime(1100, t + 0.07);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
      o.connect(g); g.connect(dest);
      o.onended = () => { try { o.disconnect(); g.disconnect(); } catch (e) {} };
      o.start(t); o.stop(t + 0.12);
      return;
    }

    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf();
    src.playbackRate.value = 0.8 + Math.random() * 0.4;
    const g = ctx.createGain();
    const dur = kind === 's' ? 0.14 : 0.035;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(g); g.connect(kind === 's' ? n.hpS : n.hpH);
    src.onended = () => { try { src.disconnect(); g.disconnect(); } catch (e) {} };
    src.start(t, Math.random()); src.stop(t + dur + 0.02);

    if (kind === 's') {
      const o = ctx.createOscillator(), og = ctx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(195, t);
      og.gain.setValueAtTime(vol * 0.5, t);
      og.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
      o.connect(og); og.connect(dest);
      o.onended = () => { try { o.disconnect(); og.disconnect(); } catch (e) {} };
      o.start(t); o.stop(t + 0.1);
    }
  },

  /* ---------- планировщик ----------
     Ноты не играются в момент, когда нужны, а заранее записываются на будущее.
     Раз в 60 мс заглядываем на полсекунды вперёд и раскладываем туда доли.

     Safari подвешивает таймеры сильнее Chrome. Если он проспал момент, доли
     оказываются в прошлом — Web Audio играет такие ноты немедленно, залпом.
     Поэтому, проснувшись с опозданием, сдвигаем отсчёт петли вперёд: музыка
     продолжается с той же ноты, но со швом длиной в паузу вместо очереди,
     вываливающейся разом. */
  tick() {
    if (!this.playing) return;
    const ctx = AUDIO.ctx;
    const spb = 60 / this.arr.bpm;
    const late = ctx.currentTime - (this.t0 + this.beat * spb);
    if (late > this.lag) this.lag = late;   // для диагностики, см. музыка.html
    if (late > 0.05) {
      const skip = Math.ceil(late / spb);
      this.t0 += skip * spb;
      this.skips++;
    }
    let guard = 16;
    while (this.t0 + this.beat * spb < ctx.currentTime + 0.5 && guard-- > 0) {
      this.scheduleBeat(this.beat, this.t0 + this.beat * spb, spb);
      this.beat++;
    }
  },

  scheduleBeat(absBeat, t, spb) {
    const a = this.arr;
    const beat = absBeat % M_LOOP;          // доля внутри петли
    const bar = Math.floor(beat / 4);       // такт петли, 0..15
    const half = bar < 8 ? 0 : 1;           // первая или вторая половина
    const chord = M_CHORDS[bar % 4];
    const inBar = beat % 4;

    /* — мелодия — */
    const lp = beat % 32;
    for (const n of M_LEAD) {
      if (n.b < lp || n.b >= lp + 1) continue;
      if (a.lead.from !== undefined && beat < a.lead.from) continue;
      const at = t + (n.b - lp) * spb;
      const dur = n.d * spb * 0.95;
      this.voice(at, dur, n.p + a.lead.oct * 12, {
        duty: a.lead.duty, gain: a.lead.gain, vib: a.lead.vib,
        glide: a.lead.glide, detune: a.lead.detune, echo: true, sus: 0.8
      });
      if (a.lead.double !== undefined) {
        this.voice(at, dur, n.p + a.lead.oct * 12 + a.lead.double, {
          duty: a.lead.duty, gain: a.lead.gain * 0.45, vib: a.lead.vib, sus: 0.8
        });
      }
    }

    /* — бас — */
    const bp = beat % 16;
    for (const n of M_BASS) {
      if (n.b < bp || n.b >= bp + 1) continue;
      this.voice(t + (n.b - bp) * spb, n.d * spb * 0.9, n.p + a.bass.oct * 12, {
        wave: a.bass.wave, gain: a.bass.gain, sus: 0.85,
        atk: 0.002, click: a.bass.click
      });
    }

    /* — гармония — */
    const h = a.harm, ho = h.oct || 0;
    if (h.mode === 'pad' && inBar === 0) {
      chord.forEach((p, i) => this.voice(t, spb * 3.7, p + ho, {
        duty: h.duty, gain: h.gain, atk: 0.12, sus: 0.9, rel: 0.3,
        echo: true, pan: (i - 1.5) * 0.14
      }));
    }
    if (h.mode === 'stab' && (inBar === 1 || inBar === 3)) {
      chord.forEach((p, i) => this.voice(t + spb * 0.5, spb * 0.28, p + ho, {
        duty: h.duty, gain: h.gain, pan: (i - 1.5) * 0.18
      }));
    }
    if (h.mode === 'arp8' || h.mode === 'arp16') {
      const per = h.mode === 'arp16' ? 4 : 2;
      for (let i = 0; i < per; i++) {
        const step = Math.round(inBar * per) + i;
        const p = chord[(step + bar) % chord.length] + ho;
        this.voice(t + (i / per) * spb, spb / per * 0.8, p, {
          duty: h.duty, gain: h.gain, pan: (i % 2 ? 0.2 : -0.2), echo: h.mode === 'arp8'
        });
      }
    }
    if (h.mode === 'nesarp') {
      // классическое приставочное дрожание: аккорд разложен очень мелко.
      // Во второй половине петли — вдвое чаще, звук разгорается.
      const per = half === 0 ? 4 : 8;
      for (let i = 0; i < per; i++) {
        const p = chord[i % chord.length] + ho;
        this.voice(t + (i / per) * spb, spb / per * 0.9, p, {
          duty: h.duty, gain: h.gain, atk: 0.003, rel: 0.01
        });
      }
    }

    /* — сбивка из extra.mid — */
    if (a.fill) {
      for (const n of M_FILL) {
        if (n.b < beat || n.b >= beat + 1) continue;
        this.voice(t + (n.b - beat) * spb, n.d * spb, n.p, {
          duty: 0.25, gain: 0.09, echo: true
        });
      }
    }

    /* — ударные — */
    const d = a.drums;
    if (d) {
      const vol = d.gain * (half === 0 ? 0.78 : 1);   // вторая половина громче
      for (let i = 0; i < 4; i++) {
        const step = inBar * 4 + i;
        const at = t + (i / 4) * spb;
        if (d.k[step] === 'x') this.hit(at, 'k', vol);
        if (d.s[step] === 'x') this.hit(at, d.blub ? 'blub' : 's', vol * 0.8);
        if (d.h[step] === 'x') this.hit(at, d.blub ? 'blub' : 'h', vol * (i === 0 ? 0.5 : 0.3));
      }
      // сбивка на рабочем в конце каждой половины — только там, где он вообще есть
      if ((bar === 7 || bar === 15) && inBar === 3 && d.s.indexOf('x') >= 0) {
        for (let i = 0; i < 4; i++) this.hit(t + (i / 4) * spb, 's', vol * (0.5 + i * 0.15));
      }
    }
  }
};
