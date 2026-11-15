# AGENTS.md

Static HTML5 canvas Asteroids clone. **No package manager, build, tests, linter, CI, or dependencies** — don't add or assume them.

- `index.html` — page shell, fixed 800×600 canvas, loads `game.js` as a classic script.
- `game.js` — the entire game: input, classes, state, collision, rendering, loop.
- `favicon.svg` — icon only.

## Run / verify

- Open `index.html` directly, or `npx serve .` per README (then `http://localhost:3000`).
- Only automated check: `node --check game.js` (syntax only). Gameplay must be verified manually in a browser.

## Gotchas

- Canvas size is duplicated: `width`/`height` in `index.html` and `W`/`H` in `game.js`. Change both.
- Classic script (`<script src>`, no modules): every declaration shares global scope. Don't add `import`/`export` without converting the page.
- README overstates features: power-ups and the "estrella fugaz" asteroid are **not implemented**. Controls, scoring, and lives in the README do match the code.
- The world is toroidal (`wrap()` on every moving entity), but collision `dist()` ignores wrap-around, so objects straddling a screen edge never collide. Consider this before changing hit detection.
- `pressed(code)` consumes `justPressed` and is only used for `Space`; movement/thrust poll `keys[...]` directly. Call `pressed` once per frame per key; `update()`'s early `return`s for `dead`/`gameover` already skip input.
- `RADII`, `SPEEDS`, and `POINTS` are indexed by size 1–3; index 0 is an unused placeholder. `Asteroid.split()` returns `[]` at size 1, otherwise two asteroids one size smaller.
- States are `'playing' | 'dead' | 'gameover'` only; there is no pause. `Space` both shoots and restarts, and `initGame()` runs once at load, so there is no title screen.
- In `'dead'` state asteroids and particles keep updating but bullets and the ship do **not** (bullets freeze until respawn). `killShip()` decrements lives, then waits 2 s before `ship.reset()`, which re-grants 3 s of invincibility.
- Levels advance automatically when `asteroids` empties: `nextLevel()` clears bullets/particles, spawns `3 + level` asteroids, and resets the ship.
- `dt` is clamped to 0.05 s and `Ship.update` applies `DRAG = 0.987` per frame (not per second), so physics is frame-rate dependent. Preserve this when tuning feel.
- User-facing text and comments are mostly Spanish (`NIVEL`, `PUNTAJE`, README), though the HUD/game-over labels are `SCORE` / `GAME OVER`. Keep the Spanish convention for new copy.
