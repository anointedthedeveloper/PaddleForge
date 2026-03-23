# PaddleForge – AI Pong Arena

A modern Pong game vs an AI opponent. Built with Next.js, Canvas API, and packaged as a PWA.

## Features

- 🎮 Player vs AI Pong with real physics & ball speed increase
- 🤖 AI with 3 difficulty levels (Easy / Medium / Hard) + trajectory prediction
- 💥 Particle effects on paddle hit
- 🔊 Retro sound effects via Web Audio API
- 📱 Mobile touch controls
- ⏸ Pause / Resume (P or Escape)
- 🏆 Local leaderboard (last 5 games via localStorage)
- 📦 PWA – installable + offline capable
- 🔍 SEO optimized with Open Graph + structured data

## Tech Stack

- **Next.js 14** – routing & SSR
- **Canvas API** – game rendering
- **Web Audio API** – sound effects
- **Vercel** – hosting

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Generate Icons

```bash
npm install canvas --save-dev
node scripts/gen-icons.js
```

## Deploy

Push to GitHub and connect to [Vercel](https://vercel.com). Deploy automatically.

## Controls

| Action | Keys |
|--------|------|
| Move Up | W / ↑ |
| Move Down | S / ↓ |
| Pause | P / Escape |
| Mobile | Touch drag |

## Project Structure

```
/public
  manifest.json
  service-worker.js
  preview.png
  icons/
/src
  /components
    GameCanvas.jsx
  /logic
    physics.js
    ai.js
  /pages
    index.js
    _app.js
    _document.js
```

---

Built by AnointedTheDeveloper
