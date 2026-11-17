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
- Power-ups: `PowerUp.type` is `'velocidad'` or `'cadencia'`. Destroyed asteroids drop Velocidad with `POWERUP_CHANCE` (14 %, max `POWERUP_MAX` on screen), while the shooting star always drops Cadencia. They drift with `wrap()` and expire via `ttl` (14 s). Velocidad sets `ship.speedTimer = 5` (thrust ×`POWERUP_MULT`); Cadencia sets `ship.rapidTimer = 6` (`RAPID_COOLDOWN = 0.08 s`). `reset()` cancels both and the HUD countdowns only render in `'playing'`.
- Estrella fugaz (`ShootingStar extends Asteroid`): one per level from level 2, spawned from a screen edge at `STAR_SPEED = 250`, `STAR_RADIUS = 16`, `ttl = 8` s. It does not split (`split()` → `[]`) and is worth 200 points. It lives in the `asteroids` array, so it counts toward completing the level until it is destroyed or expires; expired stars are also filtered in the `'dead'` state. Its Cadencia drop is guaranteed (bypasses `POWERUP_CHANCE` and `POWERUP_MAX`).
- Shooting uses `a.points` (set in `Asteroid`), not `POINTS[a.size]`. With cadence active, holding `Space` auto-fires via `keys['Space']`, but `pressed('Space')` is still consumed once per playing frame so no stale `justPressed` survives when the effect ends. `SHOOT_COOLDOWN = 0.2` lives outside `Ship`, above the class.
- Frame loop clamps `dt` to 0.05 s. `Ship.update` treats `DRAG = 0.987` as a per-frame factor at `REF_FPS = 60` and applies it as `Math.pow(DRAG, dt * REF_FPS)`, so drag and terminal speed (~327–330 px/s) are essentially identical at any frame rate. `MAX_SPEED = 330` caps the velocity **magnitude** (never per axis, so diagonals aren't faster) and is multiplied by `POWERUP_MULT` while boosted. The `overCap` check skips the cap when the ship is already above it (boost just expired), so inertia decays through drag instead of snapping down.
- States are `'playing' | 'dead' | 'gameover'` only; there is no pause. Space both shoots and restarts from game over.
- User-facing strings and comments are Spanish (`NIVEL`, `PUNTAJE`, README). Keep that convention.
