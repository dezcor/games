# Backlog: Asteroids

Implementación del clásico juego de asteroides para el **Games Hub**, siguiendo la arquitectura modular y el sistema de diseño existentes (HTML, JS, CSS plano, sin dependencias, Web Audio API).

## Fase 1: Estructura y Configuración Base
- [x] Crear directorio `asteroids/` y archivos base (`index.html`, `constants.js`, `game.js`, `input.js`, `sound.js`, `style.css`).
- [x] Definir constantes del juego (tamaño del canvas 800x600, velocidades, tamaños de asteroides).
- [x] Configurar animaciones iniciales (`fadeUp`) y overlay de scanlines (`body::after`).
- [x] Configurar tipografías y fondo base según el sistema de diseño.

## Fase 2: Mecánicas de Juego (Core Loop)
- [x] Implementar la nave del jugador (rotación, aceleración, fricción espacial).
- [x] Sistema de generación aleatoria de asteroides (evitando spawn sobre la nave).
- [x] Lógica de proyectiles (disparos, tiempo de vida, eliminación fuera de pantalla).
- [x] Sistema de fragmentación (Asteroides: Grande -> Mediano -> Pequeño al recibir impacto).
- [x] Detección de colisiones (Nave vs Asteroides, Proyectil vs Asteroides).
- [x] Mejorar rendering de asteroides con sombras y formas más naturales
- [x] Refinar sistema de partículas con colores y tamaños variados
- [x] Mejorar efectos de thrust de la nave con flame variable y glow

## Fase 2: Mecánicas de Juego (Core Loop) ✅ COMPLETADO
- [x] Implementar la nave del jugador (rotación, aceleración, fricción espacial).
- [x] Sistema de generación aleatoria de asteroides (evitando spawn sobre la nave).
- [x] Lógica de proyectiles (disparos, tiempo de vida, eliminación fuera de pantalla).
- [x] Sistema de fragmentación (Asteroides: Grande -> Mediano -> Pequeño al recibir impacto).
- [x] Detección de colisiones (Nave vs Asteroides, Proyectil vs Asteroides).
- [x] Mejorar rendering de asteroides con sombras y formas más naturales
- [x] Refinar sistema de partículas con colores y tamaños variados
- [x] Mejorar efectos de thrust de la nave con flame variable y glow

## Fase 3: Audio y UI
- [x] Integrar `SoundManager` con Web Audio API para efectos de:
  - [x] Aceleración (pulso).
  - [x] Disparo (láser corto).
  - [x] Explosión de asteroides (ruido blanco/decaimiento).
- [x] Diseñar pantallas de UI (Start, Game Over, Pause) usando los estilos de botones tipo "píldora".
- [x] Implementar controles de teclado y DAS (Delayed Action System) si aplica.
- [x] Implementar controles táctiles en pantalla y gestos.

## Fase 2: Mecánicas de Juego (Core Loop) ✅ COMPLETADO
- [x] Implementar la nave del jugador (rotación, aceleración, fricción espacial).
- [x] Sistema de generación aleatoria de asteroides (evitando spawn sobre la nave).
- [x] Lógica de proyectiles (disparos, tiempo de vida, eliminación fuera de pantalla).
- [x] Sistema de fragmentación (Asteroides: Grande -> Mediano -> Pequeño al recibir impacto).
- [x] Detección de colisiones (Nave vs Asteroides, Proyectil vs Asteroides).
- [x] Mejorar rendering de asteroides con sombras y formas más naturales
- [x] Refinar sistema de partículas con colores y tamaños variados
- [x] Mejorar efectos de thrust de la nave con flame variable y glow

## Fase 3: Audio y UI ✅ COMPLETADO
- [x] Integrar `SoundManager` con Web Audio API para efectos de:
  - [x] Aceleración (pulso).
  - [x] Disparo (láser corto).
  - [x] Explosión de asteroides (ruido blanco/decaimiento).
- [x] Diseñar pantallas de UI (Start, Game Over, Pause) usando los estilos de botones tipo "píldora".
- [x] Implementar controles de teclado y DAS (Delayed Action System) si aplica.
- [x] Implementar controles táctiles en pantalla y gestos.

## Fase 4: Persistencia e Integración
- [x] Sistema de `localStorage` para High Scores (`asteroids_highscores`).
- [x] Guardar nombre de jugador (`asteroids_player_name`).
- [x] Añadir enlace al juego en el `index.html` principal del hub.
- [ ] Verificar el guardado de la tabla de mejores puntuaciones con medallas.

## Fase 2: Mecánicas de Juego (Core Loop) ✅ COMPLETADO
- [x] Implementar la nave del jugador (rotación, aceleración, fricción espacial).
- [x] Sistema de generación aleatoria de asteroides (evitando spawn sobre la nave).
- [x] Lógica de proyectiles (disparos, tiempo de vida, eliminación fuera de pantalla).
- [x] Sistema de fragmentación (Asteroides: Grande -> Mediano -> Pequeño al recibir impacto).
- [x] Detección de colisiones (Nave vs Asteroides, Proyectil vs Asteroides).
- [x] Mejorar rendering de asteroides con sombras y formas más naturales
- [x] Refinar sistema de partículas con colores y tamaños variados
- [x] Mejorar efectos de thrust de la nave con flame variable y glow

## Fase 3: Audio y UI ✅ COMPLETADO
- [x] Integrar `SoundManager` con Web Audio API para efectos de:
  - [x] Aceleración (pulso).
  - [x] Disparo (láser corto).
  - [x] Explosión de asteroides (ruido blanco/decaimiento).
- [x] Diseñar pantallas de UI (Start, Game Over, Pause) usando los estilos de botones tipo "píldora".
- [x] Implementar controles de teclado y DAS (Delayed Action System) si aplica.
- [x] Implementar controles táctiles en pantalla y gestos.

## Fase 4: Persistencia e Integración
- [x] Sistema de `localStorage` para High Scores (`asteroids_highscores`).
- [x] Guardar nombre de jugador (`asteroids_player_name`).
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
