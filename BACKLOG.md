# Backlog: Asteroids

Implementación del clásico juego de asteroides para el **Games Hub**, siguiendo la arquitectura modular y el sistema de diseño existentes (HTML, JS, CSS plano, sin dependencias, Web Audio API).

## Estado actual

Todas las fases están completadas (ver `PLAN.md`). El juego incluye persistencia de audio (SFX + BGM, volumen + mute), high scores con nombre y medallas, 4 niveles de dificultad, 3 power-ups, OVNI grande y pequeño, hiperespacio con cooldown, BGM dinámico, 5 logros persistentes, selector de 6 colores de nave, tutorial 4 pasos, layout portrait con pinch-zoom y double-tap reset, y repaso de UI consistente con el hub (top UI, botones, sound card, game over modal).

## Fase 1: Estructura y Configuración Base ✅ COMPLETADO
- [x] Crear directorio `asteroids/` y archivos base (`index.html`, `constants.js`, `game.js`, `input.js`, `sound.js`, `style.css`).
- [x] Definir constantes del juego (tamaño del canvas 800x600, velocidades, tamaños de asteroides).
- [x] Configurar animaciones iniciales (`fadeUp`) y overlay de scanlines (`body::after`).
- [x] Configurar tipografías y fondo base según el sistema de diseño.

## Fase 2: Mecánicas de Juego (Core Loop) ✅ COMPLETADO
- [x] Implementar la nave del jugador (rotación, aceleración, fricción espacial).
- [x] Sistema de generación aleatoria de asteroides (evitando spawn sobre la nave).
- [x] Lógica de proyectiles (disparos, tiempo de vida, eliminación fuera de pantalla).
- [x] Sistema de fragmentación (Asteroides: Grande → Mediano → Pequeño al recibir impacto).
- [x] Detección de colisiones (Nave vs Asteroides, Proyectil vs Asteroides).
- [x] Mejorar rendering de asteroides con sombras y formas más naturales.
- [x] Refinar sistema de partículas con colores y tamaños variados.
- [x] Mejorar efectos de thrust de la nave con flame variable y glow.

## Fase 3: Audio y UI ✅ COMPLETADO
- [x] Integrar `SoundManager` con Web Audio API para efectos de:
  - [x] Aceleración (pulso).
  - [x] Disparo (láser corto).
  - [x] Explosión de asteroides (ruido blanco/decaimiento).
- [x] Diseñar pantallas de UI (Start, Game Over, Pause) usando los estilos de botones tipo "píldora".
- [x] Implementar controles de teclado y DAS (Delayed Action System) si aplica.
- [x] Implementar controles táctiles en pantalla y gestos.

## Fase 4: Persistencia e Integración ✅ COMPLETADO
- [x] Sistema de `localStorage` para High Scores (`asteroid_highscores`).
- [x] Guardar nombre de jugador (`asteroid_player_name`).
- [x] Persistencia de audio SFX + BGM (volumen + mute).
- [x] Añadir enlace al juego en el `index.html` principal del hub.
- [x] Medallas en tabla de mejores puntuaciones (gold/silver/bronze, easter egg JSnow/JSnof).
- [x] Formato de fechas en español (es-ES locale).

## Fase 5: Características Avanzadas ✅ COMPLETADO
- [x] **Niveles de dificultad:** Configuraciones Fácil/Normal/Difícil/Loco (velocidad de asteroides, frecuencia de aparición, vidas, invulnerabilidad).
- [x] **Power-ups:** Escudo temporal, doble disparo, vida extra (generados al destruir asteroides, con HUD y SFX).
- [x] **Enemigo OVNI:** OVNI grande (200 pts) y pequeño (1000 pts desde nivel 3) con disparos y SFX.
- [x] **Sistema de partículas:** Fragmentos visuales en explosiones y propulsor de la nave, con tope global (MAX_PARTICLES).
- [x] **Hiperespacio:** Teletransporte aleatorio con tecla/botón, cooldown 5 s, 10 % self-destruct, 0.3 s invuln al reaparecer.

## Fase 6: Polish y Extras ✅ COMPLETADO
- [x] **Música dinámica (BGM):** `MusicPlayer` con tempo variable (110/125/140 BPM) según intensidad + capa de sirena OVNI.
- [x] **Logros/Medallas:** 5 achievements persistentes (`first_ufo`, `first_powerup`, `hyperspace_safe`, `reach_level_5`, `score_10k`) con notificación toast y panel en menú.
- [x] **Personalización de nave:** Selector de 6 colores (cyan/amber/green/pink/white/magenta) persistido en `asteroid_ship_skin`.
- [x] **Tutorial interactivo:** 4 pasos (controles, power-ups, hiperespacio, OVNI), descartable, persistido en `asteroid_tutorial_dismissed`.
- [x] **Compatibilidad móvil:** Layout portrait con media query, pinch-zoom 1x-2x, double-tap reset, indicator de zoom.
- [x] **Accesibilidad:** `aria-label` en canvas/botones, `aria-live` en score, `aria-pressed` en toggles, `aria-expanded` en achievements, `role=dialog/tab/radio/list`, focus-visible global, soporte de teclado del tutorial.
