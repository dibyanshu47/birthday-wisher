# Birthday Wisher 🎂

An interactive birthday site in 6 tap-through scenes: gift unwrap, cake with blowable candles (tap or mic), reason cards, balloon-pop wish, scratch card, and a typed letter. Music and sounds are synthesized in the browser.

## Run
```bash
cp .env.example .env   # edit with your friend's details
npm install
npm run dev            # http://localhost:5173
npm run build          # static files in dist/
```
To test on your phone on the same Wi-Fi: `npm run dev -- --host`.

All personal content lives in `.env` (see comments in `.env.example`). Restart the dev server after editing it.
