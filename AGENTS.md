# AGENTS.md

Static HTML5 canvas Asteroids clone. **No package manager, build, tests, linter, CI, or dependencies** — don't add or assume them.

- `index.html` — page shell, fixed 800×600 canvas, loads `game.js` as a classic script.
- `game.js` — the entire game: classes, state, collision, rendering, loop.
- `ARCHITECTURE.md` — flowcharts (Mermaid) of the loop, `update()` per state, state machine and entity relations.
- `favicon.svg` — icon only.

## Run / verify

- Open `index.html` directly, or `npx serve .` per README.
- Only automated check: `node --check game.js` (syntax only). Gameplay must be verified manually in a browser.

## Gotchas

- Canvas size is duplicated: `width`/`height` in `index.html` and `W`/`H` in `game.js`. Change both.
- `game.js` is a classic script (`<script src>`, no modules): everything shares global scope. Don't add `import`/`export` without converting the page.
- The world is toroidal (`wrap()` on every moving entity), but collision `dist()` ignores wrap-around, so objects straddling a screen edge never collide. Consider this before changing hit detection.
- `pressed(code)` consumes `justPressed`. Call it once per frame per key; `update()`'s early `return`s for `dead`/`gameover` states already skip input, so don't add redundant reads.
- `RADII`, `SPEEDS`, and `POINTS` are indexed by size 1–3; index 0 is an unused placeholder.
- Power-ups: `PowerUp` is the only type ("velocidad"). Destroyed asteroids drop one with `POWERUP_CHANCE` (14 %, max `POWERUP_MAX` on screen), it drifts with `wrap()` and expires via `ttl` (14 s). Touching it sets `ship.speedTimer = 5`, multiplying thrust by `POWERUP_MULT` (2); `reset()` cancels it and the HUD countdown only renders in `'playing'`.
- Frame loop clamps `dt` to 0.05 s, and `Ship.update` multiplies by `DRAG = 0.987` per frame (not per second) — physics is frame-rate dependent. Preserve this when tuning feel.
- States are `'playing' | 'dead' | 'gameover'` only; there is no pause. Space both shoots and restarts from game over.
- User-facing strings and comments are Spanish (`NIVEL`, `PUNTAJE`, README). Keep that convention.
