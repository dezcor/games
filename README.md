# Games Hub 🎮

Colección de juegos clásicos web hechos con HTML5 Canvas, JavaScript vanilla y Web Audio API. Sin frameworks, sin dependencias, sin build tools.

## Juegos

### 🐍 Snake

Juego de la serpiente clásica. Controlá la serpiente con las flechas del teclado o WASD, comé comida para crecer y sumar puntos, y evitá chocarte contra las paredes o tu propio cuerpo.

- Tablero cuadrado de 20×20 celdas
- La velocidad aumenta con cada comida (mínimo 50ms por tick)
- High score guardado en localStorage
- Volumen SFX y estado de mute persistentes
- Soporte para gestos swipe en dispositivos táctiles

### ☄️ Asteroids

Arcade clásico con asteroides fragmentables, power-ups, OVNI e hiperespacio.

- Tablero 800×600 canvas
- 4 niveles de dificultad (Fácil/Normal/Difícil/Loco) persistentes
- 3 power-ups: escudo (absorbe 1 impacto), doble disparo y vida extra
- Hiperespacio (tecla H) con cooldown de 5 s y 10 % de riesgo
- OVNI grande (200 pts) y pequeño (1000 pts desde nivel 3)
- BGM dinámico con tempo variable según la intensidad
- 5 logros persistentes con notificación y panel en el menú
- Selector de 6 colores de nave persistente
- Tutorial inicial 4 pasos (descartable, con persistencia)
- Pinch-zoom y double-tap reset en portrait
- Top 5 high scores persistentes con nombre de jugador
- **Easter egg:** ingresá "jsnow" / "jonsnow" / "jon" / "jsnof" como nombre para obtener la medalla de oro en la tabla de high scores

### 🧱 Tetris

Tetris completo con sistema DAS/ARR, ghost piece, vista previa de la siguiente pieza y tabla de high scores.

- Tablero de 12 columnas × 20 filas, bloques de 20px
- 7 tetriminós (I, J, L, O, S, T, Z) con colores distintivos
- Sistema de rotación con wall kick (desplazamiento automático)
- Hard drop, línea de clearing con animación
- Scoring real: Single 100 / Double 300 / Triple 500 / Tetris 800 × nivel
- Back-to-back Tetris con multiplicador x1.5
- Banner visual de TETRIS / DOUBLE / TRIPLE / BACK-TO-BACK con puntos
- Niveles que aumentan la velocidad de gravedad
- Volumen SFX, BGM y mute persistentes
- Top 5 high scores persistentes con nombre de jugador
- **Easter egg:** ingresá "Jon Snow" / "Jon" / "JSnow" como nombre para activar el tema "North" (Game of Thrones)

### 🕹️ Arkanoid

Breakout/Arkanoid con 3 niveles, power-ups y bricks especiales.

- 3 niveles con layouts crecientes (más filas, pelota más rápida)
- Bricks especiales amarillos (3 HP) que sueltan power-ups
- Power-ups: multi-ball (divide la pelota en 3) y extra life
- Controles: teclado, mouse o botones táctiles para la paleta
- Volumen SFX, BGM y mute persistentes
- Top 5 high scores persistentes con nombre de jugador

### 👾 Space Invaders

Shooter retro con aliens que disparan, UFO bonus, niveles de dificultad y pantalla de game over enriquecida.

- 3 tipos de aliens con diferentes formas y puntuaciones
- Scoring por tipo, combos de bajas y bonus por completar niveles con vidas restantes
- Aliens que disparan con sonido variado por tipo
- Naves UFO bonus (50-300 pts) que cruzan la pantalla
- Las balas del jugador pueden destruir proyectiles alienígenas
- 4 niveles de dificultad (Easy/Normal/Hard/Insane) con persistencia
- Volumen SFX, BGM y mute persistentes
- Niveles progresivos con bonificación por completar
- Animaciones de entrada/salida de nivel y flash de score
- Pantalla de game over con score final, nivel alcanzado y reinicio rápido
- Controles táctiles con botón de pausa incluido
- Top 5 high scores persistentes con nombre de jugador

### 💣 Minesweeper

Buscador de minas con 3 dificultades, cursor de teclado y tabla de high scores.

- 3 dificultades: Fácil (9×9, 10 minas), Normal (16×16, 40 minas) y Difícil (16×24, 70 minas)
- Tablero con celdas de 24px
- Scoring: 10 pts por bandera, 5 pts por celda revelada, 500 pts de bonus por ganar
- Volumen SFX, BGM y mute persistentes
- Top 5 high scores persistentes con nombre de jugador
- Dificultad persistente

### 🐱 El Gato (Tris de tiza)

Tris de tiza sobre pizarra contra un gato que juega con la O.

- Tablero 3×3 con 8 líneas ganadoras
- 3 dificultades: fácil (aleatorio), normal (heurística) y difícil (minimax, nunca pierde)
- El gato "piensa" 520 ms + jitter de 480 ms antes de jugar
- Marcador de victorias/derrotas/empates, ronda y racha persistentes
- Sonido persistente

### 🌙 Una pregunta rara

Una pequeña experiencia privada de preguntas. Las respuestas existen solo en memoria y se descartan al avanzar; no hay historial ni almacenamiento.

- Nombre esperado almacenado como códigos de caracteres (nunca literal)
- 7 preguntas por sesión, con cierre final y resumen de temas
- Sin localStorage, sessionStorage, cookies, URLs, logs ni red
- Disponible solo de 11:00 PM a 6:00 AM (restricción desactivada en la build actual)
- Sin controles arcade

## Controles

### Snake
| Tecla | Acción |
|-------|--------|
| ↑ / W | Arriba |
| ↓ / S | Abajo |
| ← / A | Izquierda |
| → / D | Derecha |
| Espacio | Reiniciar (game over) |

### Asteroids
| Tecla | Acción |
|-------|--------|
| ← / → o A / D | Rotar la nave |
| ↑ o W | Impulso |
| Espacio | Disparar |
| H | Hiperespacio |
| P / Escape | Pausa |
| R | Reiniciar |
| Enter | Empezar partida |

### Tetris
| Tecla | Acción |
|-------|--------|
| ← → | Mover |
| ↓ | Bajar |
| ↑ | Rotar |
| Espacio | Hard drop |
| P / Escape | Pausa |
| R | Reiniciar |
| Enter | Empezar partida |

### Arkanoid
| Tecla | Acción |
|-------|--------|
| ← → | Mover paleta |
| Mouse | Mover paleta |
| R | Reiniciar |
| P / Escape | Pausa |
| Enter | Empezar partida |

### Space Invaders
| Tecla | Acción |
|-------|--------|
| ← → / A / D | Mover |
| Espacio / Enter | Disparar |
| P / Escape | Pausa |
| R | Reiniciar |
| Touch | Botones en pantalla (incluye pausa y reinicio) |

### Minesweeper
| Tecla | Acción |
|-------|--------|
| ↑ ↓ ← → | Mover cursor |
| Enter / Espacio | Revelar celda |
| F | Bandeja |
| R | Reiniciar |
| P / Escape | Pausa |
| 1 / 2 / 3 | Dificultad (Fácil / Normal / Difícil) |

### El Gato
| Tecla | Acción |
|-------|--------|
| 1-9 | Elegir celda |
| N | Nueva ronda |
| M | Sonido |
| B | Borrar marcador |

### Una pregunta rara
| Tecla | Acción |
|-------|--------|
| (sin teclado) | Botones en pantalla: Continuar, Empezar, Responder, Enviar |

## Servir localmente

```sh
python3 -m http.server 8000
# o
npx serve .
```

Luego abrí `http://localhost:8000` en el navegador.

## Audio

Todos los juegos generan sonido y música sintetizada mediante Web Audio API (osciladores). No requieren archivos de audio externos. El audio necesita una interacción del usuario para activarse (política de autoplay del navegador). La configuración de volumen y silencio se persiste por juego.

## Estructura del proyecto

```
├── index.html          # Hub principal
├── shared/
│   ├── arcade.css      # Kit de cabina: botones redondos, palanca y panel de control
│   └── sound-menu.js   # Popover de sonido (SFX/BGM/volumen)
├── AGENTS.md           # Instrucciones para OpenCode
├── BACKLOG.md          # Backlog de Asteroids
├── tetris_backlog.md   # Backlog de Tetris
├── space-invaders-backlog.md   # Backlog de Space Invaders
├── snake/
│   ├── index.html
│   ├── style.css
│   └── js/
│       ├── constants.js        # Constantes (tablero, velocidad, serpiente inicial)
│       ├── domain/             # Máquina de estados pura (sin DOM, localStorage ni audio)
│       ├── ports/              # Contratos: repository, renderer, input, sound, clock
│       ├── adapters/           # localStorage, canvas, teclado, touch, sonido y frame (rAF)
│       └── game.js             # Composition root: cablea dominio y adaptadores
├── arkanoid/
│   ├── index.html
│   ├── favicon.svg
│   ├── css/style.css
│   └── js/
│       ├── constants.js        # Constantes (tamaño, colores, power-ups)
│       ├── domain/             # levels, physics, game (sin DOM, localStorage ni audio)
│       ├── ports/              # Contratos
│       ├── adapters/           # Canvas, DOM UI, input, sound, repository, clock
│       └── game.js             # Composition root
├── asteroids/
│   ├── index.html
│   ├── favicon.svg
│   ├── css/style.css
│   ├── sprites/                # ship.svg, asteroid.svg, ufo.svg, bullet.svg, ufo-bullet.svg, powerup-*.svg
│   └── js/
│       ├── constants.js        # Constantes (dificultad, power-ups, UFO, BGM, achievements, skins, tutorial)
│       ├── domain/             # ship, asteroid, bullets, ufo, powerups, hyperspace, collision, difficulty, skins, achievements, scores, game
│       ├── ports/              # Contratos
│       ├── adapters/           # Canvas renderer (SpriteLoader), DOM UI, keyboard, touch, pinch-zoom, effects, repository, clock, sound
│       └── game.js             # Composition root
├── tetris/
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── constants.js        # Constantes (tamaño, colores, scoring)
│       ├── domain/             # pieces, board, scoring, highScores, das, tetris (sin DOM, localStorage ni audio)
│       ├── ports/              # Contratos
│       ├── adapters/           # Canvas, DOM UI, input, sound, repository, clock
│       └── game.js             # Composition root
├── space-invaders/
│   ├── index.html
│   ├── favicon.svg
│   ├── css/style.css
│   ├── sprites/                # player.svg, alien-{small,medium,large}.svg, ufo.svg, bullet.svg, alien-bullet.svg
│   └── js/
│       ├── constants.js        # Constantes (tablero, dificultad, partículas)
│       ├── domain/             # invaders, aliens, ufo, particles, highscores (sin DOM, localStorage ni audio)
│       ├── ports/              # Contratos
│       ├── adapters/           # Canvas renderer (SpriteLoader), DOM HUD, input, keyboard, touch, sound, frame loop, repository
│       └── game.js             # Composition root
├── minesweeper/
│   ├── index.html
│   ├── favicon.svg
│   ├── css/style.css
│   └── js/
│       ├── constants.js        # Constantes (dificultades, celdas, scoring, storage keys)
│       ├── domain/             # board, game (sin DOM, localStorage ni audio)
│       ├── ports/              # Contratos
│       ├── adapters/           # Canvas, DOM UI, keyboard, touch, sound, repository, clock
│       └── game.js             # Composition root
├── chalk-tic-tac-toe/
│   ├── index.html
│   ├── styles.css
│   └── js/
│       ├── constants.js        # Constantes (líneas ganadoras, dificultades, timing del gato)
│       ├── domain/             # board, ai, game (sin DOM, localStorage ni audio)
│       ├── ports/              # Contratos
│       ├── adapters/           # DOM UI, input, sound, repository
│       └── game.js             # Composition root
└── una-pregunta-rara/
    ├── index.html
    ├── css/style.css
    └── js/
        └── app.js              # Lógica privada (sin almacenamiento)
```

Desarrollado por Dezcor Games.
