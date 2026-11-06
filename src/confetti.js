// Lightweight canvas confetti, no dependencies.
const canvas = document.getElementById('confetti');
const c = canvas.getContext('2d');
const COLORS = ['#ff5e8a', '#ffd166', '#06d6a0', '#4cc9f0', '#b388ff', '#ffffff'];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

let parts = [];
let raf = null;

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener('resize', resize);
resize();

export function confetti({
  x = innerWidth / 2,
  y = innerHeight / 2,
  count = 120,
  angle = -Math.PI / 2,
  spread = Math.PI * 2,
  power = 12,
} = {}) {
  const n = reduced ? Math.floor(count / 4) : count;
  for (let i = 0; i < n; i++) {
    const a = angle + (Math.random() - 0.5) * spread;
    const v = power * (0.4 + Math.random() * 0.8);
    parts.push({
      x, y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      r: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.3,
      color: COLORS[(Math.random() * COLORS.length) | 0],
      round: Math.random() < 0.3,
      life: 0,
      max: 160 + Math.random() * 100,
    });
  }
  if (!raf) raf = requestAnimationFrame(loop);
}

function loop() {
  c.clearRect(0, 0, innerWidth, innerHeight);
  parts = parts.filter((p) => p.life < p.max && p.y < innerHeight + 40);
  for (const p of parts) {
    p.vy += 0.22;
    p.vx *= 0.985;
    p.vy *= 0.985;
    p.x += p.vx;
    p.y += p.vy;
    p.r += p.vr;
    p.life++;
    c.save();
    c.globalAlpha = Math.min(1, (p.max - p.life) / 40);
    c.translate(p.x, p.y);
    c.rotate(p.r);
    c.scale(1, Math.cos(p.life * 0.12));
    c.fillStyle = p.color;
    if (p.round) {
      c.beginPath();
      c.arc(0, 0, p.w / 2, 0, Math.PI * 2);
      c.fill();
    } else {
      c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    }
    c.restore();
  }
  raf = parts.length ? requestAnimationFrame(loop) : null;
}

// Big multi-cannon celebration
export function celebrate() {
  const h = innerHeight;
  confetti({ x: 0, y: h, angle: -Math.PI / 3, spread: 0.8, power: 22, count: 90 });
  confetti({ x: innerWidth, y: h, angle: (-2 * Math.PI) / 3, spread: 0.8, power: 22, count: 90 });
  setTimeout(() => confetti({ y: h * 0.35, count: 120, power: 10 }), 250);
}
