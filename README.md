# Games Hub 🎮

Colección de juegos clásicos web hechos con HTML5 Canvas, JavaScript vanilla y Web Audio API. Sin frameworks, sin dependencias, sin build tools.

## Juegos

### 🐍 Snake

Juego de la serpiente clásica. Controlá la serpiente con las flechas del teclado o WASD, comé comida para crecer y sumar puntos, y evitá chocarte contra las paredes o tu propio cuerpo.

- Tablero cuadrado de 20×20 celdas
- La velocidad aumenta con cada comida (mínimo 50ms por tick)
- High score guardado en localStorage
- Soporte para gestos swipe en dispositivos táctiles

### 🧱 Tetris

Tetris completo con sistema DAS/ARR, ghost piece, vista previa de la siguiente pieza y tabla de high scores.

- Tablero de 12 columnas × 20 filas, bloques de 20px
- 7 tetriminós (I, J, L, O, S, T, Z) con colores distintivos
- Sistema de rotación con wall kick (desplazamiento automático)
- Hard drop, línea de clearing con animación, puntaje por líneas
- Niveles que aumentan la velocidad de gravedad
- Top 5 high scores persistentes con nombre de jugador
- **Easter egg:** ingresá "Jon Snow" como nombre para activar el tema "North" (Game of Thrones)

## Controles

### Snake
| Tecla | Acción |
|-------|--------|
| ↑ / W | Arriba |
| ↓ / S | Abajo |
| ← / A | Izquierda |
| → / D | Derecha |
| Espacio | Reiniciar (game over) |

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

## Servir localmente

```sh
python3 -m http.server 8000
# o
npx serve .
```

Luego abrí `http://localhost:8000` en el navegador.

## Audio

Ambos juegos generan sonido y música sintetizada mediante Web Audio API (osciladores). No requieren archivos de audio externos. El audio necesita una interacción del usuario para activarse (política de autoplay del navegador).

## Estructura del proyecto

```
├── index.html          # Hub principal
├── AGENTS.md           # Instrucciones para OpenCode
├── tetris_backlog.md   # Backlog de desarrollo
├── snake/
│   ├── index.html
│   ├── game.js         # Lógica del juego (clase SnakeGame)
│   ├── sound.js        # Sonido y música (SoundManager + MusicPlayer)
│   └── style.css
└── tetris/
    ├── index.html
    ├── css/style.css
    └── js/
        ├── constants.js    # Constantes (tamaño, colores)
        ├── tetriminos.js   # Definición de piezas
        ├── input.js        # Captura de teclado
        ├── sound.js        # Sonido y música (SoundManager + MusicPlayer)
        └── game.js         # Lógica del juego
```

Desarrollado por Dezcor Games.
