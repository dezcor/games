# Backlog: Asteroids

Implementación del clásico juego de asteroides para el **Games Hub**, siguiendo la arquitectura modular y el sistema de diseño existentes (HTML, JS, CSS plano, sin dependencias, Web Audio API).

## Fase 1: Estructura y Configuración Base
- [x] Crear directorio `asteroids/` y archivos base (`index.html`, `constants.js`, `game.js`, `input.js`, `sound.js`, `style.css`).
- [x] Definir constantes del juego (tamaño del canvas 800x600, velocidades, tamaños de asteroides).
- [x] Configurar animaciones iniciales (`fadeUp`) y overlay de scanlines (`body::after`).
- [x] Configurar tipografías y fondo base según el sistema de diseño.

## Fase 2: Mecánicas de Juego (Core Loop)
- [ ] Implementar la nave del jugador (rotación, aceleración, fricción espacial).
- [ ] Sistema de generación aleatoria de asteroides (evitando spawn sobre la nave).
- [ ] Lógica de proyectiles (disparos, tiempo de vida, eliminación fuera de pantalla).
- [ ] Sistema de fragmentación (Asteroides: Grande -> Mediano -> Pequeño al recibir impacto).
- [ ] Detección de colisiones (Nave vs Asteroides, Proyectil vs Asteroides).

## Fase 3: Audio y UI
- [ ] Integrar `SoundManager` con Web Audio API para efectos de:
  - [ ] Aceleración (pulso).
  - [ ] Disparo (láser corto).
  - [ ] Explosión de asteroides (ruido blanco/decaimiento).
- [ ] Diseñar pantallas de UI (Start, Game Over, Pause) usando los estilos de botones tipo "píldora".
- [ ] Implementar controles de teclado y DAS (Delayed Action System) si aplica.
- [ ] Implementar controles táctiles en pantalla y gestos.

## Fase 4: Persistencia e Integración
- [ ] Sistema de `localStorage` para High Scores (`asteroids_highscores`).
- [ ] Guardar nombre de jugador (`asteroids_player_name`).
- [x] Añadir enlace al juego en el `index.html` principal del hub.
- [ ] Verificar el guardado de la tabla de mejores puntuaciones con medallas.

## Fase 5: Características Avanzadas
- [ ] **Niveles de dificultad:** Configuraciones fácil/medio/difícil (velocidad de asteroides, frecuencia de aparición).
- [ ] **Power-ups:** Escudo temporal, doble disparo, vida extra (generados al destruir asteroides).
- [ ] **Enemigo OVNI:** Implementar OVNI clásico que aparece aleatoriamente, se mueve por la parte superior y dispara a la nave.
- [ ] **Sistema de partículas:** Fragmentos visuales en explosiones y propulsor de la nave.
- [ ] **Hiperespacio:** Mecanismo de teletransporte aleatorio de la nave (con riesgo de generar sobre un asteroide).

## Fase 6: Polish y Extras
- [ ] **Música dinámica (BGM):** `MusicPlayer` que cambie de ritmo o tono según la intensidad (ej. ritmo más rápido al aparecer un OVNI).
- [ ] **Logros/Medallas:** Sistema de achievements locales desbloqueables (ej. "Primer Millón", "Superviviente").
- [ ] **Personalización de nave:** Selector de color/diseño de la nave en la pantalla de inicio (persistido en `localStorage`).
- [ ] **Tutorial interactivo:** Mini-guía visual de los controles y el objetivo en la primera partida.
- [ ] **Compatibilidad móvil:** Adaptar layout del canvas y botones para modo portrait.
