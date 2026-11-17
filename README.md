# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Incluye los power-ups **Velocidad** (doble propulsión y doble tope de velocidad durante 5 segundos), **Cadencia** (disparo rápido y continuo durante 6 segundos), **Triple** (tres balas paralelas durante 5 segundos) y **Escudo** (inmunidad total durante 8 segundos). La **estrella fugaz** suelta Cadencia o Triple a partir del nivel 2, y el **caza enemigo** suelta Escudo.

## Tecnologías

- **HTML5 Canvas** — renderizado 2D
- **JavaScript (ES6+)** — lógica del juego en un solo archivo `game.js`
- Sin frameworks, sin bundler, sin dependencias

## Cómo correr

Abre `index.html` directamente en el navegador (doble clic), o usa un servidor local:

```bash
npx serve .
```

Luego visita `http://localhost:3000`.

## Controles

| Tecla     | Acción             |
| --------- | ------------------ |
| `←` `→`   | Rotar nave         |
| `↑`       | Propulsar          |
| `Espacio` | Disparar           |
| `S`       | Cambiar skin (nave) |

## Puntuación

| Objetivo  | Puntos |
| --------- | ------ |
| Asteroide grande  | 20  |
| Asteroide mediano | 50  |
| Asteroide pequeño | 100 |
| Estrella fugaz    | 200 |
| Caza enemigo      | 150 |

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- Estrella fugaz especial desde el nivel 2, que cruza rápido y se desvanece sola
- Caza enemigo desde el nivel 2, que dispara proyectiles hacia la nave
- Escudo temporal que intercepta proyectiles y choques

## Power-ups

| Power-up      | Efecto                                                        |
| ------------- | ------------------------------------------------------------- |
| **Velocidad** | Doble propulsión y doble tope de velocidad durante 5 s (la nave se ve celeste) |
| **Cadencia**  | Disparo rápido y continuo durante 6 s (la nave se ve ámbar)   |
| **Triple**    | Tres balas paralelas por disparo durante 5 s (la nave se ve verde) |
| **Escudo**    | Inmunidad total durante 8 s (la nave se ve verde y la rodea un anillo) |

Al destruir un asteroide hay un 14 % de probabilidad de que suelte el power-up **Velocidad** (doble chevrón celeste). Se recoge tocándolo con la nave, flota por la pantalla y desaparece a los 14 segundos (parpadea en los últimos 3).

Con **Cadencia** (tres barras verticales ámbar) mantener pulsado `Espacio` dispara automáticamente y el tiempo entre disparos baja de 0,2 s a 0,08 s. Con **Triple** (tres flechas paralelas verdes) cada disparo lanza tres balas separadas 9 px entre sí, todas en la misma dirección recta. Ambas se acumulan entre sí y con **Velocidad**. La estrella fugaz suelta **Cadencia** o **Triple** al azar (50 %).

Con **Escudo** (anillo verde con núcleo) la nave es inmune a todo mientras dura: los proyectiles enemigos se desintegran al tocar el anillo y los asteroides y el caza la atraviesan sin daño. Lo suelta siempre el caza al ser destruido.

## Estrella fugaz

Desde el nivel 2 aparece **una** estrella fugaz por nivel. Entra desde un borde de la pantalla, se mueve a 250 px/s (mucho más rápido que cualquier asteroide) y se desvanece sola a los 8 segundos (parpadea en los últimos 2). No se parte en fragmentos.

- Vale **200 puntos** y siempre suelta un power-up de disparo al ser destruida: **Cadencia** o **Triple** al 50 %.
- Si se desvanece por tiempo no da puntos ni recompensa.
- Mientras siga en pantalla cuenta para completar el nivel, pero su desaparición automática evita que el nivel quede bloqueado.

## Caza enemigo

Desde el nivel 2, si no hay ningún caza en pantalla, aparece uno cada 10 segundos. Entra desde un borde apuntando hacia la nave, cruza la pantalla a 110 px/s (lento, para poder esquivarlo) y dispara un proyectil rojo cada 1,6 segundos apuntando a la posición actual de la nave, con una ligera imprecisión.

- Vale **150 puntos** y siempre suelta el power-up **Escudo** al ser destruido.
- Al salir de la pantalla desaparece sin dar puntos. No cuenta para completar el nivel.
- Solo hay un caza a la vez y sus proyectiles se borran al morir la nave.

## Skins

La nave tiene cuatro apariencias intercambiables. Pulsa `S` en cualquier momento (también en GAME OVER) para ciclar entre ellas; el nombre aparece unos segundos abajo en el HUD.

| Skin           | Apariencia                                                        |
| -------------- | ----------------------------------------------------------------- |
| **Clásica**    | Triángulo wireframe blanco original, llama naranja                |
| **Interceptor**| Caza de ala en flecha verde fósforo, llama verde                  |
| **Acorazada**  | Casco hexagonal con relleno tenue magenta y dos motores            |
| **Espectro**   | Dardo afilado violeta con cabina circular                         |

- La skin elegida se guarda en `localStorage` y se restaura al recargar.
- Solo cambia el aspecto: el hitbox, la física y el punto de salida de las balas son idénticos en las cuatro.
- Los power-ups siguen tiñendo la nave (celeste Velocidad, ámbar Cadencia, verde Triple y Escudo) por encima del color de la skin.
- Los iconos de vida del HUD usan la silueta y el color de la skin activa.
