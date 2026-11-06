// All personal details come from .env (VITE_* vars). Defaults keep the site usable without one.
const env = import.meta.env;

const list = (value, sep = '|') =>
  (value || '').split(sep).map((s) => s.trim()).filter(Boolean);

const DEFAULT_REASONS = [
  'You make ordinary days feel like a party',
  "You're the first person I call with good news",
  'Your laugh is dangerously contagious',
  'You show up. Every single time.',
];


const name = env.VITE_NAME || 'Friend';
const reasons = list(env.VITE_REASONS);

export const config = {
  name,
  nickname: env.VITE_NICKNAME || name,
  age: parseInt(env.VITE_AGE, 10) || null,
  from: env.VITE_FROM || 'Your friend',
  accent: env.VITE_ACCENT || '#ff5e8a',
  music: env.VITE_MUSIC !== 'false',
  reasons: reasons.length ? reasons : DEFAULT_REASONS,
  balloonWish: env.VITE_BALLOON_WISH || 'May all your dreams come true',
  secret: env.VITE_SECRET || 'A surprise is waiting for you. Ask me about it 😉',
  letter: (env.VITE_LETTER || 'Wishing you the happiest of birthdays!').replace(/\\n/g, '\n'),
};
