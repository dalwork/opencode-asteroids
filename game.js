'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

class Asteroid {
  constructor(x, y, size = 3) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.points = POINTS[size];
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Estrella fugaz (asteroide especial) ───────────────────────────────────────
const STAR_SPEED  = 250;   // px/s, mucho más rápida que un asteroide normal
const STAR_RADIUS = 16;    // igual al asteroide pequeño
const STAR_TTL    = 8;     // segundos antes de desvanecerse sola
const STAR_POINTS = 200;   // recompensa por derribarla

class ShootingStar extends Asteroid {
  constructor(x, y, angle) {
    super(x, y, 1);
    this.radius   = STAR_RADIUS;
    this.points   = STAR_POINTS;
    this.ttl      = STAR_TTL;
    this.rot      = angle;   // la punta de la estrella mira hacia donde vuela
    this.rotSpeed = 0;
    this.vx = Math.cos(angle) * STAR_SPEED;
    this.vy = Math.sin(angle) * STAR_SPEED;

    // Estrella de 5 puntas
    const n = 10;
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * (i % 2 === 0 ? 1 : 0.42);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    super.update(dt);
    this.ttl -= dt;
    if (this.ttl <= 0) {
      this.dead = true;
      explode(this.x, this.y, 6);
    }
  }

  split() { return []; }

  draw() {
    // Parpadeo antes de desvanecerse
    if (this.ttl < 2 && Math.floor(this.ttl * 6) % 2 === 0) return;

    // Estela detrás del movimiento
    const ux = this.vx / STAR_SPEED;
    const uy = this.vy / STAR_SPEED;
    ctx.lineWidth = 2;
    for (let i = 1; i <= 3; i++) {
      const d = 10 * i;
      ctx.strokeStyle = `rgba(255, 221, 68, ${(0.45 / i).toFixed(2)})`;
      ctx.beginPath();
      ctx.moveTo(this.x - ux * d, this.y - uy * d);
      ctx.lineTo(this.x - ux * (d + 7), this.y - uy * (d + 7));
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#fd4';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Power-ups ─────────────────────────────────────────────────────────────────
const POWERUP_DURATION = 5;      // segundos de doble velocidad
const POWERUP_MULT     = 2;      // multiplicador de empuje
const POWERUP_CHANCE   = 0.14;   // probabilidad de caer al destruir un asteroide
const POWERUP_TTL      = 14;     // segundos antes de desvanecerse
const POWERUP_MAX      = 2;      // máximo de power-ups en pantalla
const RAPID_DURATION   = 6;      // segundos de cadencia rápida
const RAPID_COOLDOWN   = 0.08;   // segundos entre disparos con cadencia
const TRIPLE_DURATION  = 5;      // segundos de disparo triple
const TRIPLE_SEPARATION = 9;     // px a cada lado del centro entre las 3 balas

class PowerUp {
  constructor(x, y, type = 'velocidad') {
    this.x = x;
    this.y = y;
    this.radius = 14;
    this.type = type;   // 'velocidad' | 'cadencia' | 'triple'
    const angle = rand(0, Math.PI * 2);
    const speed = rand(12, 28);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.ttl  = POWERUP_TTL;
    this.dead = false;
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    // Parpadeo antes de desaparecer
    if (this.ttl < 3 && Math.floor(this.ttl * 6) % 2 === 0) return;

    const cadence = this.type === 'cadencia';
    const triple  = this.type === 'triple';
    const pulse = 1 + Math.sin(performance.now() / 180) * 0.08;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(pulse, pulse);
    ctx.strokeStyle = cadence ? '#fd4' : triple ? '#8f8' : '#4df';
    ctx.lineWidth   = 2;
    ctx.lineJoin    = 'round';

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    if (cadence) {
      // Tres barras verticales: disparo continuo
      for (let i = -1; i <= 1; i++) {
        ctx.moveTo(i * 6, -6);
        ctx.lineTo(i * 6,  6);
      }
    } else if (triple) {
      // Tres flechas paralelas: disparo triple
      for (let i = -1; i <= 1; i++) {
        const y = i * 6;
        ctx.moveTo(-8, y);
        ctx.lineTo( 6, y);
        ctx.moveTo( 2, y - 4);
        ctx.lineTo( 6, y);
        ctx.lineTo( 2, y + 4);
      }
    } else {
      // Doble chevrón ">>"
      ctx.moveTo(-8, -6); ctx.lineTo( 0, 0); ctx.lineTo(-8, 6);
      ctx.moveTo( 1, -6); ctx.lineTo( 9, 0); ctx.lineTo( 1, 6);
    }
    ctx.stroke();

    ctx.restore();
  }
}

// ── Skins de la nave ──────────────────────────────────────────────────────────
// Solo cambian la apariencia: el hitbox (`radius`), la física y `NOSE` no varían.
const SKIN_KEY   = 'asteroids.skin';
const SKIN_TOAST = 1.6;   // segundos que se muestra el aviso de skin
const FLAME_MIN  = 6;
const FLAME_MAX  = 14;

const SKINS = [
  {
    nombre: 'CLÁSICA',
    color: '#fff',
    linea: 1.5,
    verts: [[20, 0], [-12, -9], [-7, 0], [-12, 9]],
    detalle: [],
    llamas: [{ x: -8, y: 0, a: 4 }],
    llamaColor: 'rgba(255, 130, 0, 0.85)',
  },
  {
    nombre: 'INTERCEPTOR',
    color: '#9f9',
    linea: 1.4,
    verts: [[20, 0], [2, -5], [-10, -12], [-6, -3], [-9, 0], [-6, 3], [-10, 12], [2, 5]],
    detalle: [],
    llamas: [{ x: -8, y: 0, a: 3 }],
    llamaColor: 'rgba(120, 255, 150, 0.8)',
  },
  {
    nombre: 'ACORAZADA',
    color: '#f9f',
    linea: 2,
    relleno: 'rgba(255, 127, 212, 0.10)',
    verts: [[16, 0], [7, -11], [-11, -11], [-15, -4], [-15, 4], [-11, 11], [7, 11]],
    detalle: [],
    llamas: [{ x: -15, y: -6, a: 3 }, { x: -15, y: 6, a: 3 }],
    llamaColor: 'rgba(255, 127, 212, 0.8)',
  },
  {
    nombre: 'ESPECTRO',
    color: '#c9f',
    linea: 1.2,
    verts: [[20, 0], [-4, -2], [-14, -8], [-8, 0], [-14, 8], [-4, 2]],
    detalle: [{ tipo: 'circulo', x: 5, y: 0, r: 2.5 }],
    llamas: [{ x: -9, y: 0, a: 2 }],
    llamaColor: 'rgba(201, 159, 255, 0.8)',
  },
];

let skinIndex = loadSkin();
let skinToast = 0;

function loadSkin() {
  try {
    const i = Number(localStorage.getItem(SKIN_KEY));
    if (Number.isInteger(i) && i >= 0 && i < SKINS.length) return i;
  } catch (e) { /* localStorage bloqueado: se usa la skin por defecto */ }
  return 0;
}

function saveSkin() {
  try { localStorage.setItem(SKIN_KEY, String(skinIndex)); }
  catch (e) { /* sin persistencia */ }
}

// Traza el contorno de la skin sin pintarlo (lo comparten nave e iconos de vida).
function traceShipPath(skin, scale = 1) {
  const v = skin.verts;
  ctx.beginPath();
  ctx.moveTo(v[0][0] * scale, v[0][1] * scale);
  for (let i = 1; i < v.length; i++)
    ctx.lineTo(v[i][0] * scale, v[i][1] * scale);
  ctx.closePath();
}

function drawShipDetail(skin, scale = 1) {
  if (!skin.detalle) return;
  for (const d of skin.detalle) {
    ctx.beginPath();
    if (d.tipo === 'circulo') {
      ctx.arc(d.x * scale, d.y * scale, d.r * scale, 0, Math.PI * 2);
    } else if (d.tipo === 'linea') {
      ctx.moveTo(d.x1 * scale, d.y1 * scale);
      ctx.lineTo(d.x2 * scale, d.y2 * scale);
    }
    ctx.stroke();
  }
}

// ── Ship ──────────────────────────────────────────────────────────────────────
const SHOOT_COOLDOWN = 0.2;   // segundos entre disparos normales

class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.speedTimer    = 0;   // segundos restantes de "velocidad"
    this.rapidTimer    = 0;   // segundos restantes de "cadencia"
    this.tripleTimer   = 0;   // segundos restantes de "triple"
    this.dead          = false;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.speedTimer    > 0) this.speedTimer    -= dt;
    if (this.rapidTimer    > 0) this.rapidTimer    -= dt;
    if (this.tripleTimer   > 0) this.tripleTimer   -= dt;

    const ROT       = 3.5;    // rad/s
    const THRUST    = 260;    // px/s²
    const DRAG      = 0.987;  // factor por frame a 60 fps
    const REF_FPS   = 60;     // Hz de referencia para normalizar DRAG
    const MAX_SPEED = 330;    // px/s; el boost lo multiplica por POWERUP_MULT
    const boost = this.speedTimer > 0 ? POWERUP_MULT : 1;
    const cap   = MAX_SPEED * boost;
    // Si el boost acaba de vencer la nave queda por encima del tope: no la frenes
    // de golpe, DRAG la hace decaer hasta que el tope vuelva a actuar.
    const overCap = Math.hypot(this.vx, this.vy) > cap;

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * boost * dt;
      this.vy += Math.sin(this.angle) * THRUST * boost * dt;
    }

    const drag = Math.pow(DRAG, dt * REF_FPS);
    this.vx *= drag;
    this.vy *= drag;

    // Tope de magnitud (no por eje): la diagonal no queda más rápida
    if (!overCap) {
      const speed = Math.hypot(this.vx, this.vy);
      if (speed > cap) {
        const k = cap / speed;
        this.vx *= k;
        this.vy *= k;
      }
    }

    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = this.rapidTimer > 0 ? RAPID_COOLDOWN : SHOOT_COOLDOWN;
    const NOSE = 21;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    if (this.tripleTimer > 0) {
      // Tres balas paralelas: misma dirección, desplazadas en perpendicular
      const px = Math.cos(this.angle + Math.PI / 2);
      const py = Math.sin(this.angle + Math.PI / 2);
      return [-1, 0, 1].map(k =>
        new Bullet(ox + px * TRIPLE_SEPARATION * k,
                   oy + py * TRIPLE_SEPARATION * k,
                   this.angle));
    }
    return [new Bullet(ox, oy, this.angle)];
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    const skin = SKINS[skinIndex];

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    // Los boosts tiñen la nave por encima del color propio de la skin
    ctx.strokeStyle = this.rapidTimer > 0 ? '#fd4'
                    : this.tripleTimer > 0 ? '#8f8'
                    : this.speedTimer > 0 ? '#4df'
                    : skin.color;
    ctx.lineWidth   = skin.linea;
    ctx.lineJoin    = 'round';

    traceShipPath(skin);
    if (skin.relleno) {
      ctx.fillStyle = skin.relleno;
      ctx.fill();
    }
    ctx.stroke();
    drawShipDetail(skin);

    // Llama del propulsor (una por motor de la skin)
    if (this.thrusting && Math.random() > 0.35) {
      ctx.strokeStyle = skin.llamaColor;
      for (const f of skin.llamas) {
        const largo = rand(FLAME_MIN, FLAME_MAX);
        ctx.beginPath();
        ctx.moveTo(f.x, f.y - f.a);
        ctx.lineTo(f.x - largo, f.y);
        ctx.lineTo(f.x, f.y + f.a);
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y) {
    this.x  = x;
    this.y  = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerups;
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer;

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
}

// Entra desde un borde y cruza la pantalla como una estrella fugaz
function spawnShootingStar() {
  const edge = randInt(0, 3);
  let x, y, angle;
  if (edge === 0) {          // superior
    x = rand(0, W); y = 0;              angle = Math.PI / 2 + rand(-0.6, 0.6);
  } else if (edge === 1) {   // derecha
    x = W;          y = rand(0, H);     angle = Math.PI + rand(-0.6, 0.6);
  } else if (edge === 2) {   // inferior
    x = rand(0, W); y = H;              angle = -Math.PI / 2 + rand(-0.6, 0.6);
  } else {                   // izquierda
    x = 0;          y = rand(0, H);     angle = rand(-0.6, 0.6);
  }
  asteroids.push(new ShootingStar(x, y, angle));
}

function initGame() {
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  powerups  = [];
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  powerups  = [];
  ship.reset();
  spawnAsteroids(3 + level);
  if (level >= 2) spawnShootingStar();   // una estrella fugaz por nivel desde el 2
}

function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}

function maybeDropPowerUp(x, y) {
  if (powerups.length >= POWERUP_MAX) return;
  if (Math.random() < POWERUP_CHANCE) dropPowerUp(x, y, 'velocidad');
}

// La recompensa de la estrella fugaz es fija: ignora azar y tope de power-ups.
function dropPowerUp(x, y, type) {
  powerups.push(new PowerUp(x, y, type));
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  // Se lee antes de los returns de estado: la skin se cambia incluso en 'dead'
  // y 'gameover'.
  if (pressed('KeyS')) {
    skinIndex = (skinIndex + 1) % SKINS.length;
    saveSkin();
    skinToast = SKIN_TOAST;
  }
  if (skinToast > 0) skinToast = Math.max(0, skinToast - dt);

  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    asteroids = asteroids.filter(a => !a.dead);
    powerups.forEach(p => p.update(dt));
    powerups = powerups.filter(p => !p.dead);
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar: con cadencia basta mantener Espacio. pressed() se consume siempre
  // para no dejar justPressed pendiente cuando termina el efecto.
  const firePressed = pressed('Space');
  if (ship.rapidTimer > 0 ? keys['Space'] : firePressed) {
    bullets.push(...ship.tryShoot());
  }

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  particles.forEach(p => p.update(dt));
  powerups.forEach(p => p.update(dt));

  bullets   = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);
  powerups  = powerups.filter(p => !p.dead);

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        score += a.points;
        explode(a.x, a.y, a.size * 5);
        if (a instanceof ShootingStar)
          dropPowerUp(a.x, a.y, Math.random() < 0.5 ? 'cadencia' : 'triple');
        else maybeDropPowerUp(a.x, a.y);
        newAsteroids.push(...a.split());
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Nave vs power-up
  for (const p of powerups) {
    if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
      p.dead = true;
      if (p.type === 'cadencia') ship.rapidTimer = RAPID_DURATION;
      else if (p.type === 'triple') ship.tripleTimer = TRIPLE_DURATION;
      else                       ship.speedTimer = POWERUP_DURATION;
      explode(p.x, p.y, 8);
    }
  }
  powerups = powerups.filter(p => !p.dead);

  // Nave vs asteroide
  if (ship.invincible <= 0) {
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius * 0.82) {
        killShip();
        break;
      }
    }
  }

  // Nivel completado
  if (asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  const skin  = SKINS[skinIndex];
  const SCALE = 0.45;   // reduce la silueta de la nave al tamaño del HUD
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.strokeStyle = skin.color;
  ctx.lineWidth   = 1.2;
  ctx.lineJoin    = 'round';
  traceShipPath(skin, SCALE);
  if (skin.relleno) {
    ctx.fillStyle = skin.relleno;
    ctx.fill();
  }
  ctx.stroke();
  drawShipDetail(skin, SCALE);
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

  if (state === 'playing') {
    let y = 48;
    ctx.textAlign = 'left';
    if (ship.speedTimer > 0) {
      ctx.fillStyle = '#4df';
      ctx.fillText(`VELOCIDAD ${ship.speedTimer.toFixed(1)}s`, 14, y);
      y += 18;
    }
    if (ship.rapidTimer > 0) {
      ctx.fillStyle = '#fd4';
      ctx.fillText(`CADENCIA ${ship.rapidTimer.toFixed(1)}s`, 14, y);
      y += 18;
    }
    if (ship.tripleTimer > 0) {
      ctx.fillStyle = '#8f8';
      ctx.fillText(`TRIPLE ${ship.tripleTimer.toFixed(1)}s`, 14, y);
    }
  }

  if (skinToast > 0) {
    const alpha = Math.min(1, skinToast / 0.5);
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.fillText(`SKIN: ${SKINS[skinIndex].nombre}`, W / 2, H - 22);
  }
}

function drawOverlay(title, sub, hint) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
  if (hint) {
    ctx.font      = '14px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillText(hint, W / 2, H / 2 + 52);
  }
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  bullets.forEach(b => b.draw());
  powerups.forEach(p => p.draw());
  ship.draw();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`,
                'S: CAMBIAR NAVE');
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

initGame();
requestAnimationFrame(loop);
