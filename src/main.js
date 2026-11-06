import './style.css';
import { config } from './config.js';
import { confetti, celebrate } from './confetti.js';
import { music, sfx } from './audio.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};
const show = (e) => e.classList.remove('hidden');
const rand = (a, b) => a + Math.random() * (b - a);
const burstAt = (node, opts = {}) => {
  const r = node.getBoundingClientRect();
  confetti({ x: r.left + r.width / 2, y: r.top + r.height / 2, ...opts });
};

// ---------- Personalisation ----------
document.documentElement.style.setProperty('--accent', config.accent);
document.title = `Happy Birthday, ${config.name}! 🎂`;
$$('[data-bind]').forEach((e) => (e.textContent = config[e.dataset.bind]));

// ---------- Floating background ----------
const bg = $('#bg');
const glyphs = ['✦', '✧', '✨', '⭐', '🎈', '·'];
for (let i = 0; i < 26; i++) {
  const s = el('span', null, glyphs[i % glyphs.length]);
  s.style.left = `${rand(0, 100)}%`;
  s.style.setProperty('--s', `${rand(10, 26)}px`);
  s.style.setProperty('--d', `${rand(14, 30)}s`);
  s.style.setProperty('--delay', `${-rand(0, 30)}s`);
  bg.append(s);
}

// Tap empty space for a little sparkle
document.addEventListener('pointerdown', (e) => {
  if (e.target.matches('body, main, .scene')) {
    confetti({ x: e.clientX, y: e.clientY, count: 18, power: 5 });
  }
});

// ---------- Scene navigation ----------
const scenes = $$('.scene');
const dots = $('#dots');
dots.classList.add('hidden');
let current = 0;
let maxSeen = 0;
const onEnter = {};

scenes.forEach((_, i) => {
  const d = el('button', 'dot');
  d.setAttribute('aria-label', `Step ${i + 1}`);
  d.addEventListener('click', () => i <= maxSeen && goTo(i));
  dots.append(d);
});

function goTo(i) {
  if (i < 0 || i >= scenes.length) return;
  scenes[current].classList.remove('active');
  current = i;
  maxSeen = Math.max(maxSeen, i);
  scenes[i].classList.add('active');
  $$('.dot').forEach((d, j) => {
    d.classList.toggle('on', j === i);
    d.classList.toggle('seen', j <= maxSeen);
  });
  window.scrollTo({ top: 0 });
  sfx.whoosh();
  onEnter[scenes[i].id]?.();
}
$$('.next').forEach((b) => b.addEventListener('click', () => goTo(current + 1)));

// ---------- Sound toggle ----------
const soundBtn = $('#sound-toggle');
const syncSound = () => (soundBtn.textContent = music.enabled ? '🔊' : '🔈');
syncSound();
soundBtn.addEventListener('click', () => {
  music.toggle();
  syncSound();
});

// ---------- 1. Gift ----------
const title = $('#title');
let li = 0;
`Happy Birthday, ${config.name}!`.split(' ').forEach((word) => {
  const w = el('span', 'word');
  Array.from(word).forEach((ch) => {
    const s = el('span', 'letter', ch);
    s.style.setProperty('--i', li++);
    s.addEventListener('click', () => {
      s.classList.remove('boing');
      void s.offsetWidth;
      s.classList.add('boing');
      sfx.chime(500 + Math.random() * 600);
      burstAt(s, { count: 14, power: 6 });
    });
    w.append(s);
  });
  title.append(w, ' ');
});

$('#age-line').textContent = config.age
  ? `${config.age} trips around the sun, and somehow you keep getting better.`
  : 'Another trip around the sun, and somehow you keep getting better.';

const gift = $('#gift');
gift.addEventListener('click', () => {
  if (gift.classList.contains('open')) return;
  gift.classList.add('open');
  $('#gift-hint').classList.add('hidden');
  sfx.pop();
  music.start();
  setTimeout(() => {
    celebrate();
    gift.classList.add('hidden');
    show($('#hello'));
    show(dots);
    $$('.dot')[0].classList.add('on', 'seen');
  }, 700);
});

// ---------- 2. Cake ----------
const cake = $('#cake');
const candleCount = config.age ? Math.min(config.age, 10) : 5;
let lit = candleCount;

if (config.age) {
  const ageTag = el('span', 'cake-age', String(config.age));
  $('.tier.bottom', cake).append(ageTag);
}

for (let i = 0; i < candleCount; i++) {
  const c = el('div', 'candle');
  c.style.setProperty('--h', `${rand(38, 52)}px`);
  const f = el('button', 'flame');
  f.setAttribute('aria-label', `Blow out candle ${i + 1}`);
  f.addEventListener('click', () => blow(c));
  c.append(f);
  $('#candles').append(c);
}

function blow(c) {
  if (c.classList.contains('out')) return;
  c.classList.add('out');
  sfx.whoosh();
  lit--;
  if (!lit) cakeDone();
}

function cakeDone() {
  cake.classList.remove('lit');
  stopMic();
  $('#cake-status').textContent = 'Wish locked in. No take-backs 🤫';
  setTimeout(celebrate, 200);
  show($('#cake-next'));
}

let micStream = null;
let micRaf = null;
const micBtn = $('#mic-btn');
micBtn.addEventListener('click', async () => {
  if (micStream || !lit) return;
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const c = new (window.AudioContext || window.webkitAudioContext)();
    const an = c.createAnalyser();
    an.fftSize = 512;
    c.createMediaStreamSource(micStream).connect(an);
    const data = new Uint8Array(an.fftSize);
    let loud = 0;
    const tick = () => {
      an.getByteTimeDomainData(data);
      let sum = 0;
      for (const v of data) sum += ((v - 128) / 128) ** 2;
      const rms = Math.sqrt(sum / data.length);
      loud = rms > 0.12 ? loud + 1 : Math.min(loud, 0);
      if (loud > 4) {
        loud = -10; // cooldown between candles
        const next = $('.candle:not(.out)');
        if (next) blow(next);
      }
      if (lit) micRaf = requestAnimationFrame(tick);
    };
    tick();
    micBtn.textContent = 'listening… blow! 🌬️';
  } catch {
    micBtn.textContent = 'mic blocked, tap instead';
  }
});

function stopMic() {
  cancelAnimationFrame(micRaf);
  micStream?.getTracks().forEach((t) => t.stop());
}

// ---------- 3. Reasons deck ----------
const deck = $('#deck');
const counter = $('#reason-count');
const finalCard = el('div', 'card final');
finalCard.append(el('span', 'card-num', '∞'), el('p', null, '…and a million more reasons ❤️'));
finalCard.style.setProperty('--rot', '0deg');
deck.append(finalCard);

const cards = config.reasons.map((r, i) => {
  const c = el('div', 'card');
  c.append(el('span', 'card-num', `#${i + 1}`), el('p', null, r));
  c.style.setProperty('--rot', `${rand(-6, 6)}deg`);
  c.style.zIndex = config.reasons.length - i + 1;
  deck.append(c);
  return c;
});

let ri = 0;
const updateCounter = () =>
  (counter.textContent = ri < cards.length ? `Reason ${ri + 1} of ${cards.length}` : 'and counting…');
updateCounter();

function nextReason() {
  if (ri >= cards.length) return;
  const c = cards[ri];
  c.style.setProperty('--fx', Math.random() < 0.5 ? -1 : 1);
  c.classList.add('fly');
  sfx.chime(600 + ri * 70);
  ri++;
  updateCounter();
  if (ri === cards.length) {
    burstAt(deck, { count: 60 });
    show($('#reasons-next'));
  }
}
deck.addEventListener('click', nextReason);
deck.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    nextReason();
  }
});

// ---------- 5. Balloons ----------
const words = config.balloonWish.split(/\s+/).filter(Boolean);
const palette = ['#ff5e8a', '#ffd166', '#06d6a0', '#4cc9f0', '#b388ff', '#ff8c42'];
const slots = words.map(() => {
  const s = el('span', 'slot', '•••');
  $('#sentence').append(s);
  return s;
});
let popped = 0;
words.forEach((w, i) => {
  const b = el('button', 'balloon');
  b.setAttribute('aria-label', 'Pop balloon');
  b.style.setProperty('--c', palette[i % palette.length]);
  b.style.setProperty('--delay', `${-rand(0, 3)}s`);
  b.addEventListener('click', () => {
    if (b.classList.contains('popped')) return;
    b.classList.add('popped');
    sfx.pop();
    burstAt(b, { count: 28, power: 7 });
    slots[i].textContent = w;
    slots[i].classList.add('in');
    if (++popped === words.length) {
      setTimeout(celebrate, 300);
      show($('#balloons-next'));
    }
  });
  $('#sky').append(b);
});

// ---------- 6. Scratch card ----------
$('#secret').textContent = config.secret;
let scratchReady = false;
onEnter['s-scratch'] = () => {
  if (scratchReady) return;
  scratchReady = true;
  requestAnimationFrame(initScratch);
};

function initScratch() {
  const cv = $('#scratch');
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  const rect = cv.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = rect.width * dpr;
  cv.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const g = ctx.createLinearGradient(0, 0, rect.width, rect.height);
  g.addColorStop(0, '#c9c9d6');
  g.addColorStop(0.5, '#f1f1f7');
  g.addColorStop(1, '#a9a9bc');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, rect.width, rect.height);
  ctx.fillStyle = '#6b6b85';
  ctx.font = '600 22px Fredoka, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✨ Scratch me ✨', rect.width / 2, rect.height / 2);

  ctx.globalCompositeOperation = 'destination-out';
  ctx.lineWidth = 44;
  ctx.lineCap = 'round';
  let drawing = false;
  let last = null;
  let moves = 0;
  let done = false;

  const pos = (e) => {
    const r = cv.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const scratch = (p) => {
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last = p;
    if (++moves % 12 === 0) check();
  };
  const check = () => {
    if (done) return;
    const { data } = ctx.getImageData(0, 0, cv.width, cv.height);
    let clear = 0;
    let total = 0;
    for (let i = 3; i < data.length; i += 4 * 40) {
      total++;
      if (data[i] === 0) clear++;
    }
    if (clear / total > 0.45) {
      done = true;
      cv.classList.add('cleared');
      sfx.chime(1046);
      celebrate();
      show($('#scratch-next'));
    }
  };

  cv.addEventListener('pointerdown', (e) => {
    drawing = true;
    cv.setPointerCapture(e.pointerId);
    last = pos(e);
    scratch(pos(e));
  });
  cv.addEventListener('pointermove', (e) => drawing && scratch(pos(e)));
  const end = () => {
    drawing = false;
    check();
  };
  cv.addEventListener('pointerup', end);
  cv.addEventListener('pointercancel', end);
}

// ---------- 7. Letter ----------
const envelope = $('#envelope');
envelope.addEventListener('click', () => {
  if (envelope.classList.contains('open')) return;
  envelope.classList.add('open');
  sfx.chime(880);
  $('#env-hint').classList.add('hidden');
  setTimeout(() => {
    envelope.classList.add('hidden');
    show($('#paper'));
    typeLetter();
  }, 700);
});

function typeLetter() {
  const out = $('#letter-text');
  const text = config.letter;
  let i = 0;
  let timer = null;
  out.classList.add('typing');
  const finish = () => {
    clearTimeout(timer);
    out.textContent = text;
    out.classList.remove('typing');
    show($('#sig'));
    show($('#finale'));
    celebrate();
    $('#paper').removeEventListener('click', finish);
  };
  const step = () => {
    out.textContent = text.slice(0, ++i);
    if (i >= text.length) return finish();
    timer = setTimeout(step, text[i - 1] === '\n' ? 280 : 28);
  };
  $('#paper').addEventListener('click', finish); // tap to skip
  step();
}

$('#more-confetti').addEventListener('click', () => {
  celebrate();
  sfx.pop();
});
$('#replay').addEventListener('click', () => location.reload());
