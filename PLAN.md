# Plan para terminar Games Hub

## Diagnóstico

- `BACKLOG.md` de Asteroids declaraba 9 tareas abiertas al inicio del plan. La Fase 3 cerró los ítems de power-ups, OVNI, hiperespacio y partículas/BGM dinámico; quedan pendientes personalización de nave, tutorial y compatibilidad móvil (Fase 4) y un repaso de la persistencia móvil/portrait.
- Los errores P0 de Asteroids descritos anteriormente fueron corregidos en la Fase 1: configuración, nivel, controles táctiles, Top 5, colisiones, progresión y audio.
- `space-invaders-backlog.md` declara 100%; la Fase 2 también dejó verificados los metadatos, scoring avanzado, combos, UFO, animaciones y UX móvil.
- Tetris figura completo, pero no implementa combos/Tetris reales (`tetris/js/game.js:223-255`) y el alias documentado `JSnof` no coincide con el código.
- Todos los JS pasan `node --check`; no hay tests automáticos ni CI.

## Estado actual

- Fase 1: **completada**. Asteroids y Space Invaders tienen los cambios P0 implementados y verificados con pruebas de navegador.
- Fase 2: **completada**. Space Invaders tiene metadatos centralizados, scoring por tipo, combos, disparos limitados, colisión entre proyectiles, UFO escalado, efectos con límite y controles móviles robustos.
- Fase 3: **completada**. Asteroids tiene base común de entidades, partículas con tope global, tres power-ups (escudo/doble/vida) con HUD, hiperespacio con cooldown y 10% de self-destruct, OVNI grande + pequeño con disparos, y BGM dinámico con tempo variable y capa de OVNI.
- Fases 4 y 5: **pendientes**.
- Verificación completada: `node --check` en los 4 JS de Asteroids, pruebas con Playwright de los 14 escenarios de Fase 3 (hiperespacio teclado/touch/cooldown, recogida de cada power-up, escudo absorbiendo colisión, spawn y muerte de OVNI grande y pequeño, tope de partículas, intensidad BGM 0/1/2, pausa/reinicio, reinicio al menú), 15 s de simulación sin errores de consola.
- Verificación pendiente: matriz completa de los cinco juegos, portrait, reduced motion, foco, accesibilidad y QA final de release.

## Plan de ejecución

### 1. Fundación y correcciones P0 [COMPLETADA]

Estimación: 1-2 días.

- [x] Corregir contratos de configuración, niveles y estados en Asteroids.
- [x] Normalizar el uso de `dt` para que la velocidad no dependa de los FPS.
- [x] Aplicar `maxBullets`, `fireRate` e invulnerabilidad.
- [x] Corregir colisiones, ciclo de vida de proyectiles y progresión de niveles.
- [x] Arreglar localStorage, Top 5, nombres seguros y favicon.
- [x] Reparar controles táctiles, pausa/reinicio y audio muteable.
- [x] En Space Invaders, eliminar el bonus de nivel duplicado y validar la dificultad almacenada.

### 2. Cerrar Space Invaders [COMPLETADA]

Estimación: 2-3 días.

- [x] Centralizar metadatos de los tres tipos de alien: forma, tamaño, puntos, velocidad y probabilidad de disparo.
- [x] Corregir el orden de tipos y puntuación.
- [x] Implementar combos y bonus de supervivencia con reglas explícitas.
- [x] Mejorar disparos alienígenas y permitir que las balas del jugador destruyan proyectiles enemigos.
- [x] Fijar el scheduler del UFO, escalarlo por nivel y conectar `playUFO()`.
- [x] Mejorar explosiones, game over, animaciones y controles móviles.
- [x] Separar y persistir correctamente volumen SFX y BGM.

### 3. Gameplay avanzado de Asteroids [COMPLETADA]

Estimación: 3-5 días.

- [x] Crear una base común para entidades, proyectiles, drops y efectos. (`game.js`: nuevos grupos `powerups`, `ufo`, `ufoBullets`, `effects`; clases `PowerUp`, `Ufo`, `UfoBullet`, `FlashEffect` con convención `update/draw/dead`.)
- [x] Implementar partículas de explosión, propulsión y destrucción de la nave, con límite global. (`MAX_PARTICLES = 200` con recorte FIFO, `createThrustParticles` y `createPlayerExplosion`.)
- [x] Añadir power-ups: escudo, doble disparo y vida extra, incluyendo HUD, duración, colisiones y sonidos. (`POWERUP_TYPES` con `shield`/`double`/`life`, drop rates 15/10/5%, `#powerup-status` con barras de progreso, SFX `playPowerupSpawn`/`playPowerupPickup`.)
- [x] Añadir hiperespacio con tecla y botón táctil, cooldown, destino seguro y riesgo controlado. (Tecla `H` y botón `⇋`, cooldown 5 s, búsqueda segura 20 intentos, 10% self-destruct, invuln 0.3 s al reaparecer.)
- [x] Implementar OVNI con aparición aleatoria, movimiento, disparos, colisiones y puntuación. (`UFO_SIZES` con `large` (200 pts) y `small` (1000 pts, sólo desde nivel 3), spawn 18-30 s reducido por nivel, `UfoBullet` con jitter, `playUfoShoot`/`playUfoExplode`.)
- [x] Conectar la intensidad del juego y la aparición del OVNI con el BGM dinámico. (`MusicPlayer.setIntensity(0|1|2)` con tempos 110/125/140 y `linearRampToValueAtTime`; `setUfoActive(bool)` con `ufoLayerGain` independiente para la sirena del OVNI.)

### 4. Polish y UX [PENDIENTE]

Estimación: 2-3 días.

- Implementar logros persistentes basados en eventos reales del juego. (Anclaje ya preparado: `asteroid_powerups_collected` opcional en BACKLOG; eventos de Fase 3 — OVNI destruido, power-up recogido, hiperespacio exitoso — son candidatos naturales a achievements.)
- Añadir selector de color/diseño de nave y persistencia. (`GAME_CONFIG.shipColor` ya está parametrizado; hace falta UI en el menú y `asteroid_ship_skin` en localStorage.)
- Crear tutorial inicial descartable y accesible. (Reutilizar el patrón `body::after` + `backdrop-filter: blur(10px)` del overlay de pausa para una pantalla de bienvenida.)
- Completar layout portrait, botones táctiles y feedback visual. (Los botones táctiles de Asteroids ya cubren landscape; falta verificar portrait a <400 px y reorganizar la rejilla si hace falta.)
- Añadir estados ARIA, foco visible, soporte de teclado y respetar el zoom del usuario. (Fase 3 ya añadió `aria-label` a los botones táctiles; pendiente foco visible en `#powerup-status`, soporte de teclado del overlay de pausa y verificar `user-scalable=no` del viewport.)

### 5. Consistencia del hub y release [PENDIENTE]

Estimación: 1-2 días.

- Corregir Tetris: scoring de combos, alias `JSnof` y persistencia de audio.
- Revisar Snake, Arkanoid y Tetris para nombres sin `innerHTML` inseguro y preferencias de audio persistentes.
- Actualizar `README.md`, `AGENTS.md` y los tres backlogs para reflejar el estado real.
- No marcar tareas como completas hasta pasar la matriz de QA.

## Criterios de cierre

- Probar los cinco juegos en escritorio y móvil, incluyendo portrait.
- Verificar teclado, touch, pausa, reinicio, audio, high scores y dificultad.
- Probar localStorage vacío, corrupto y con datos antiguos.
- Verificar comportamiento a 60 y 120 Hz.
- Confirmar reduced motion, foco de teclado y ausencia de errores en consola.
- Ejecutar `node --check` y una prueba manual completa por juego.

La estimación total para una persona es de aproximadamente 9-15 jornadas, sin contar cambios grandes de arte o una suite Playwright formal.
