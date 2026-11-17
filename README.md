# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Incluye los power-ups **Velocidad** (doble propulsión y doble tope de velocidad durante 5 segundos) y **Cadencia** (disparo rápido y continuo durante 6 segundos), que suelta la **estrella fugaz** a partir del nivel 2.

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

| Asteroide | Puntos |
| --------- | ------ |
| Grande    | 20     |
| Mediano   | 50     |
| Pequeño   | 100    |

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- Estrella fugaz especial desde el nivel 2, que cruza rápido y se desvanece sola

## Power-ups

| Power-up      | Efecto                                                        |
| ------------- | ------------------------------------------------------------- |
| **Velocidad** | Doble propulsión y doble tope de velocidad durante 5 s (la nave se ve celeste) |
| **Cadencia**  | Disparo rápido y continuo durante 6 s (la nave se ve ámbar)   |

Al destruir un asteroide hay un 14 % de probabilidad de que suelte el power-up **Velocidad** (doble chevrón celeste). Se recoge tocándolo con la nave, flota por la pantalla y desaparece a los 14 segundos (parpadea en los últimos 3).

Con **Cadencia** (tres barras verticales ámbar) mantener pulsado `Espacio` dispara automáticamente y el tiempo entre disparos baja de 0,2 s a 0,08 s. La estrella fugaz la suelta siempre al ser destruida.

## Estrella fugaz

Desde el nivel 2 aparece **una** estrella fugaz por nivel. Entra desde un borde de la pantalla, se mueve a 250 px/s (mucho más rápido que cualquier asteroide) y se desvanece sola a los 8 segundos (parpadea en los últimos 2). No se parte en fragmentos.

- Vale **200 puntos** y siempre suelta el power-up **Cadencia** al ser destruida.
- Si se desvanece por tiempo no da puntos ni recompensa.
- Mientras siga en pantalla cuenta para completar el nivel, pero su desaparición automática evita que el nivel quede bloqueado.

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
- Los power-ups siguen tiñendo la nave (celeste Velocidad, ámbar Cadencia) por encima del color de la skin.
- Los iconos de vida del HUD usan la silueta y el color de la skin activa.
