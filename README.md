# Junkissa Dive Web Port 1/7

## Purpose

This is the first web-port package for `純喫茶ダイブ / Junkissa Dive`.
The goal of this step is to make a GitHub Pages friendly HTML Canvas version that preserves the Codea prototype's core movement and scene flow.

## Files

- `index.html` — entry point
- `style.css` — fullscreen canvas and touch-scroll prevention
- `codea-lite.js` — Codea Lite compatibility layer supplied by the user
- `sketch.js` — JavaScript port of the current Codea prototype
- `WEB_QA_CHECKLIST_1of7.md` — first GitHub/phone test checklist

## Current scope

Included:

- Title screen
- SHIFT_START phase
- KISSA FORTUNE item roulette
- Right-side launcher
- Drag/release shot
- Coffee / cake / melon soda targets
- Basic obstacle collisions
- Melon anti-pass-through sweep
- Cake SASARI sweep
- Result effects
- PERFECT CENTER zoom only for clean center hits
- Receipt screen
- One More Shift restart
- Simple debug button

Not yet polished:

- Poster-like final visual style
- Sound
- Final stage/balance/score tuning
- Full Codea-debug log export

## Upload

Upload the folder contents to GitHub, or upload the ZIP contents into the target repository root.
For GitHub Pages, `index.html` should be at the published root.

## Notes

This is not a direct Lua runtime. `sketch.js` is a JavaScript port that keeps Codea-style structure and names where practical.
