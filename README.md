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
├── AGENTS.md           # Instrucciones para OpenCode
├── BACKLOG.md          # Backlog de Asteroids
├── tetris_backlog.md   # Backlog de Tetris
├── space-invaders-backlog.md   # Backlog de Space Invaders
├── snake/
│   ├── index.html
│   ├── game.js         # Lógica del juego (clase SnakeGame)
│   ├── sound.js        # Sonido y música (SoundManager + MusicPlayer)
│   └── style.css
├── arkanoid/
│   ├── index.html
│   ├── favicon.svg
│   ├── css/style.css
│   └── js/
│       ├── constants.js    # Constantes (tamaño, colores, power-ups)
│       ├── bricks.js       # Layouts de niveles y bricks especiales
│       ├── input.js        # Captura de teclado
│       ├── sound.js        # Sonido y música (SoundManager + MusicPlayer)
│       └── game.js         # Lógica del juego
├── asteroids/
│   ├── index.html
│   ├── favicon.svg
│   ├── css/style.css
│   └── js/
│       ├── constants.js    # Constantes (dificultad, power-ups, UFO, BGM, achievements, skins, tutorial)
│       ├── input.js        # Teclado, touch buttons, pinch-zoom
│       ├── sound.js        # Sonido y música (SoundManager + MusicPlayer)
│       └── game.js         # Lógica del juego
├── tetris/
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── constants.js    # Constantes (tamaño, colores, scoring)
│       ├── tetriminos.js   # Definición de piezas
│       ├── input.js        # Captura de teclado
│       ├── sound.js        # Sonido y música (SoundManager + MusicPlayer)
│       └── game.js         # Lógica del juego
└── space-invaders/
    ├── index.html
    ├── favicon.svg
    ├── css/style.css
    └── js/
        ├── constants.js    # Constantes (tablero, dificultad, partículas)
        ├── input.js        # Captura de teclado + touch buttons
        ├── sound.js        # Sonido y música (SoundManager + MusicPlayer)
        └── game.js         # Lógica del juego
```

Desarrollado por Dezcor Games.
