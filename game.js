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

// ── Enemigo caza (dispara proyectiles) ────────────────────────────────────────
const ENEMY_SPEED        = 110;   // px/s, lento para poder esquivarlo
const ENEMY_RADIUS       = 15;
const ENEMY_POINTS       = 150;
const ENEMY_FIRE_INT     = 1.6;   // segundos entre disparos
const ENEMY_SPAWN_DELAY  = 10;    // segundos sin caza antes de que aparezca otro
const ENEMY_TTL          = 20;    // red de seguridad por si no sale de pantalla
const ENEMY_BULLET_SPEED = 190;   // px/s (la nave dispara a 520)
const ENEMY_BULLET_TTL   = 4;

class EnemyBullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * ENEMY_BULLET_SPEED;
    this.vy = Math.sin(angle) * ENEMY_BULLET_SPEED;
    this.radius = 3;
    this.ttl    = ENEMY_BULLET_TTL;
    this.dead   = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    // Estela corta detrás del proyectil
    ctx.strokeStyle = 'rgba(255, 102, 102, 0.35)';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();

    ctx.fillStyle = '#f66';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Atraviesa la pantalla en línea recta y desaparece al salir por el otro lado
// (a diferencia del resto de entidades, no hace wrap: es un invasor).
class Enemy {
  constructor(x, y, angle) {
    this.x      = x;
    this.y      = y;
    this.radius = ENEMY_RADIUS;
    this.points = ENEMY_POINTS;
    this.vx     = Math.cos(angle) * ENEMY_SPEED;
    this.vy     = Math.sin(angle) * ENEMY_SPEED;
    this.fireTimer = ENEMY_FIRE_INT;
    this.ttl    = ENEMY_TTL;
    this.dead   = false;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.ttl -= dt;

    if (this.ttl <= 0 ||
        this.x < -this.radius || this.x > W + this.radius ||
        this.y < -this.radius || this.y > H + this.radius) {
      this.dead = true;
      return;
    }

    if (ship.dead) return;   // durante 'dead' la nave no es un objetivo

    this.fireTimer -= dt;
    if (this.fireTimer <= 0) {
      this.fireTimer = ENEMY_FIRE_INT;
      const angle = Math.atan2(ship.y - this.y, ship.x - this.x) + rand(-0.1, 0.1);
      enemyBullets.push(new EnemyBullet(this.x, this.y, angle));
    }
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.strokeStyle = '#f88';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    // Cúpula
    ctx.beginPath();
    ctx.arc(0, 0, 8, Math.PI, 0);
    ctx.stroke();

    // Casco: platillo
    ctx.beginPath();
    ctx.ellipse(0, 0, this.radius, 5, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Luces
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.arc(i * 6, 0, 1.5, 0, Math.PI * 2);
      ctx.stroke();
    }

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
const SHIELD_DURATION  = 8;      // segundos de inmunidad total
const SHIELD_RADIUS    = 24;     // radio del anillo (y de intercepción)

class PowerUp {
  constructor(x, y, type = 'velocidad') {
    this.x = x;
    this.y = y;
    this.radius = 14;
    this.type = type;   // 'velocidad' | 'cadencia' | 'escudo'
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
    const shield  = this.type === 'escudo';
    const pulse = 1 + Math.sin(performance.now() / 180) * 0.08;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(pulse, pulse);
    ctx.strokeStyle = cadence ? '#fd4' : shield ? '#6f9' : '#4df';
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
    } else if (shield) {
      // Anillo con núcleo: protección
      ctx.moveTo(this.radius - 5, 0);
      ctx.arc(0, 0, this.radius - 5, 0, Math.PI * 2);
      ctx.moveTo(3, 0);
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
    } else {
      // Doble chevrón ">>"
      ctx.moveTo(-8, -6); ctx.lineTo( 0, 0); ctx.lineTo(-8, 6);
      ctx.moveTo( 1, -6); ctx.lineTo( 9, 0); ctx.lineTo( 1, 6);
    }
    ctx.stroke();

    ctx.restore();
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
    this.shieldTimer   = 0;   // segundos restantes de "escudo"
    this.dead          = false;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.speedTimer    > 0) this.speedTimer    -= dt;
    if (this.rapidTimer    > 0) this.rapidTimer    -= dt;
    if (this.shieldTimer   > 0) this.shieldTimer   -= dt;

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
    return [new Bullet(ox, oy, this.angle)];
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = this.shieldTimer > 0 ? '#6f9'
                    : this.rapidTimer  > 0 ? '#fd4'
                    : this.speedTimer  > 0 ? '#4df'
                    : '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    // Silueta clásica: triángulo con muesca trasera
    ctx.beginPath();
    ctx.moveTo( 20,  0);   // nariz
    ctx.lineTo(-12, -9);   // ala izquierda
    ctx.lineTo( -7,  0);   // muesca trasera
    ctx.lineTo(-12,  9);   // ala derecha
    ctx.closePath();
    ctx.stroke();

    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - rand(6, 14), 0);
      ctx.lineTo(-8,  4);
      ctx.strokeStyle = 'rgba(255, 130, 0, 0.85)';
      ctx.stroke();
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
let ship, bullets, asteroids, particles, powerups, enemies, enemyBullets;
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer, enemyTimer;

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

// Entra desde un borde apuntando hacia la nave y cruza la pantalla
function spawnEnemy() {
  const edge = randInt(0, 3);
  let x, y;
  if (edge === 0) {          // superior
    x = rand(0, W); y = 0;
  } else if (edge === 1) {   // derecha
    x = W;          y = rand(0, H);
  } else if (edge === 2) {   // inferior
    x = rand(0, W); y = H;
  } else {                   // izquierda
    x = 0;          y = rand(0, H);
  }
  // Apunta a la nave, pero garantiza que entre hacia el interior de la pantalla
  let dx = ship.x - x, dy = ship.y - y;
  const len = Math.hypot(dx, dy) || 1;
  dx /= len;
  dy /= len;
  const INWARD = 0.35;
  if (edge === 0) dy = Math.max(dy,  INWARD);   // hacia abajo
  if (edge === 1) dx = Math.min(dx, -INWARD);   // hacia la izquierda
  if (edge === 2) dy = Math.min(dy, -INWARD);   // hacia arriba
  if (edge === 3) dx = Math.max(dx,  INWARD);   // hacia la derecha

  enemies.push(new Enemy(x, y, Math.atan2(dy, dx)));
  enemyTimer = ENEMY_SPAWN_DELAY;
}

function initGame() {
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  powerups  = [];
  enemies       = [];
  enemyBullets  = [];
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  enemyTimer = ENEMY_SPAWN_DELAY;
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  powerups  = [];
  enemies      = [];
  enemyBullets = [];
  enemyTimer   = ENEMY_SPAWN_DELAY;
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
  enemyBullets = [];   // no dejar proyectiles volando durante la reaparición
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
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
    enemies.forEach(e => e.update(dt));
    enemies = enemies.filter(e => !e.dead);
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
  enemies.forEach(e => e.update(dt));
  enemyBullets.forEach(b => b.update(dt));
  particles.forEach(p => p.update(dt));
  powerups.forEach(p => p.update(dt));

  bullets      = bullets.filter(b => !b.dead);
  enemyBullets = enemyBullets.filter(b => !b.dead);
  particles    = particles.filter(p => !p.dead);
  powerups     = powerups.filter(p => !p.dead);

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        score += a.points;
        explode(a.x, a.y, a.size * 5);
        if (a instanceof ShootingStar) dropPowerUp(a.x, a.y, 'cadencia');
        else maybeDropPowerUp(a.x, a.y);
        newAsteroids.push(...a.split());
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Bala vs caza
  for (const b of bullets) {
    for (const e of enemies) {
      if (!e.dead && !b.dead && dist(b, e) < e.radius) {
        b.dead = true;
        e.dead = true;
        score += e.points;
        explode(e.x, e.y, 12);
        dropPowerUp(e.x, e.y, 'escudo');   // recompensa fija, como la estrella
      }
    }
  }
  enemies = enemies.filter(e => !e.dead);
  bullets = bullets.filter(b => !b.dead);

  // Aparición del caza: uno a la vez, desde el nivel 2
  if (level >= 2 && enemies.length === 0) {
    enemyTimer -= dt;
    if (enemyTimer <= 0) spawnEnemy();
  }

  // Nave vs power-up
  for (const p of powerups) {
    if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
      p.dead = true;
      if (p.type === 'cadencia') ship.rapidTimer = RAPID_DURATION;
      else if (p.type === 'escudo') ship.shieldTimer = SHIELD_DURATION;
      else                       ship.speedTimer = POWERUP_DURATION;
      explode(p.x, p.y, 8);
    }
  }
  powerups = powerups.filter(p => !p.dead);

  // Proyectil enemigo vs nave (el escudo lo intercepta antes de tocar el casco)
  if (!ship.dead) {
    for (const b of enemyBullets) {
      if (b.dead) continue;
      if (ship.shieldTimer > 0) {
        if (dist(ship, b) < SHIELD_RADIUS + b.radius) {
          b.dead = true;
          explode(b.x, b.y, 4);
        }
      } else if (ship.invincible > 0) {
        if (dist(ship, b) < ship.radius + b.radius) b.dead = true;
      } else if (dist(ship, b) < ship.radius + b.radius) {
        b.dead = true;
        killShip();
        break;
      }
    }
    enemyBullets = enemyBullets.filter(b => !b.dead);
  }

  // Nave vs caza
  if (!ship.dead && ship.invincible <= 0 && ship.shieldTimer <= 0) {
    for (const e of enemies) {
      if (dist(ship, e) < ship.radius + e.radius) {
        killShip();
        break;
      }
    }
  }

  // Nave vs asteroide (el escudo también protege del choque)
  if (!ship.dead && ship.invincible <= 0 && ship.shieldTimer <= 0) {
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius * 0.82) {
        killShip();
        break;
      }
    }
  }

  // Nivel completado (el caza no cuenta: es un extra)
  if (!ship.dead && asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth   = 1.2;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  ctx.moveTo( 9,  0);
  ctx.lineTo(-6, -5);
  ctx.lineTo(-3,  0);
  ctx.lineTo(-6,  5);
  ctx.closePath();
  ctx.stroke();
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

  // Contadores de efectos activos, apilados por orden de prioridad visual
  if (state === 'playing') {
    const timers = [];
    if (ship.speedTimer  > 0) timers.push(['VELOCIDAD', ship.speedTimer,  '#4df']);
    if (ship.rapidTimer  > 0) timers.push(['CADENCIA',  ship.rapidTimer,  '#fd4']);
    if (ship.shieldTimer > 0) timers.push(['ESCUDO',    ship.shieldTimer, '#6f9']);

    ctx.textAlign = 'left';
    let y = 48;
    for (const [label, time, color] of timers) {
      ctx.fillStyle = color;
      ctx.fillText(`${label} ${time.toFixed(1)}s`, 14, y);
      y += 18;
    }
  }
}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

// Se dibuja fuera de Ship.draw(): el parpadeo de invencibilidad oculta la nave
// pero no debe ocultar el escudo.
function drawShield() {
  if (ship.dead || ship.shieldTimer <= 0) return;

  const now   = performance.now();
  const pulse = 1 + Math.sin(now / 160) * 0.05;
  const spin  = now / 700;

  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.scale(pulse, pulse);

  ctx.strokeStyle = 'rgba(102, 255, 153, 0.9)';
  ctx.lineWidth   = 2;
  ctx.beginPath();
  ctx.arc(0, 0, SHIELD_RADIUS, 0, Math.PI * 2);
  ctx.stroke();

  // Marcas giratorias para que el anillo se lea como "activo"
  ctx.strokeStyle = 'rgba(102, 255, 153, 0.45)';
  ctx.lineWidth   = 1.5;
  for (let i = 0; i < 6; i++) {
    const a = spin + (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * (SHIELD_RADIUS - 5), Math.sin(a) * (SHIELD_RADIUS - 5));
    ctx.lineTo(Math.cos(a) * (SHIELD_RADIUS - 1), Math.sin(a) * (SHIELD_RADIUS - 1));
    ctx.stroke();
  }

  ctx.restore();
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  enemies.forEach(e => e.draw());
  bullets.forEach(b => b.draw());
  enemyBullets.forEach(b => b.draw());
  powerups.forEach(p => p.draw());
  ship.draw();
  drawShield();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
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
