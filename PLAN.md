# Plan para terminar Games Hub

## Diagnóstico

- `BACKLOG.md` de Asteroids declaraba 9 tareas abiertas al inicio del plan. Las Fases 1-3 cerraron P0, gameplay avanzado y polish. La Fase 4 cerró personalización de nave, tutorial, accesibilidad y compatibilidad móvil/portrait, y añadió además un repaso de UI consistente con el hub.
- Los errores P0 de Asteroids descritos anteriormente fueron corregidos en la Fase 1: configuración, nivel, controles táctiles, Top 5, colisiones, progresión y audio.
- `space-invaders-backlog.md` declara 100%; la Fase 2 también dejó verificados los metadatos, scoring avanzado, combos, UFO, animaciones y UX móvil.
- Tetris figura completo, pero no implementa combos/Tetris reales (`tetris/js/game.js:223-255`) y el alias documentado `JSnof` no coincide con el código. Pendiente para Fase 5.
- Todos los JS pasan `node --check`; no hay tests automáticos ni CI.

## Estado actual

- Fase 1: **completada**. Asteroids y Space Invaders tienen los cambios P0 implementados y verificados con pruebas de navegador.
- Fase 2: **completada**. Space Invaders tiene metadatos centralizados, scoring por tipo, combos, disparos limitados, colisión entre proyectiles, UFO escalado, efectos con límite y controles móviles robustos.
- Fase 3: **completada**. Asteroids tiene base común de entidades, partículas con tope global, tres power-ups (escudo/doble/vida) con HUD, hiperespacio con cooldown y 10% de self-destruct, OVNI grande + pequeño con disparos, y BGM dinámico con tempo variable y capa de OVNI.
- Fase 4: **completada**. Asteroids suma 5 logros persistentes con notificación toast y panel en menú, selector de 6 colores de nave, tutorial inicial 4 pasos con persistencia, layout portrait y pinch-zoom con double-tap reset, ARIA global, focus-visible y refuerzo de teclado en el tutorial. Los otros 4 juegos recibieron ARIA + focus-visible base. Tras la implementación se hizo un repaso de UI: alineación del top UI con el resto del hub (eliminado `#player-display` y `#main-start-btn`, flex-wrap, max-width 380px), estilo consistente de botones (START con gradiente cyan, touch buttons redondeados con tinte cyan/magenta, diff buttons con estilos base, sound controls como card, game over como modal card con blur 20px).
- Fase 5: **pendiente**.
- Verificación completada: `node --check` en los 13 JS del proyecto; pruebas con Playwright de los 14 escenarios de Fase 3; verificación de Fase 4 (5 logros se desbloquean, persisten y muestran toast; selector de nave persiste; tutorial aparece, avanza con ArrowRight, se cierra con Escape, checkbox "no mostrar de nuevo" persiste; pinch-zoom + double-tap en portrait; ARIA labels y focus-visible presentes en los 5 juegos; 20 ciclos de input sin errores de consola); capturas de menu/playing/paused/game over con game over card destacado sobre canvas borroso.
- Verificación pendiente: matriz completa de los cinco juegos en QA final, comportamiento a 60 y 120 Hz, reduced motion explícito, prueba de localStorage corrupto y datos antiguos, suite Playwright formal.

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

Commits: `3a65401 fix(asteroids)`, `bcbd77d fix(space-invaders)`.

### 2. Cerrar Space Invaders [COMPLETADA]

Estimación: 2-3 días.

- [x] Centralizar metadatos de los tres tipos de alien: forma, tamaño, puntos, velocidad y probabilidad de disparo.
- [x] Corregir el orden de tipos y puntuación.
- [x] Implementar combos y bonus de supervivencia con reglas explícitas.
- [x] Mejorar disparos alienígenas y permitir que las balas del jugador destruyan proyectiles enemigos.
- [x] Fijar el scheduler del UFO, escalarlo por nivel y conectar `playUFO()`.
- [x] Mejorar explosiones, game over, animaciones y controles móviles.
- [x] Separar y persistir correctamente volumen SFX y BGM.

Commits: `892f7ad feat(space-invaders)`.

### 3. Gameplay avanzado de Asteroids [COMPLETADA]

Estimación: 3-5 días.

- [x] Crear una base común para entidades, proyectiles, drops y efectos. (`game.js`: nuevos grupos `powerups`, `ufo`, `ufoBullets`, `effects`; clases `PowerUp`, `Ufo`, `UfoBullet`, `FlashEffect` con convención `update/draw/dead`.)
- [x] Implementar partículas de explosión, propulsión y destrucción de la nave, con límite global. (`MAX_PARTICLES = 200` con recorte FIFO, `createThrustParticles` y `createPlayerExplosion`.)
- [x] Añadir power-ups: escudo, doble disparo y vida extra, incluyendo HUD, duración, colisiones y sonidos. (`POWERUP_TYPES` con `shield`/`double`/`life`, drop rates 15/10/5%, `#powerup-status` con barras de progreso, SFX `playPowerupSpawn`/`playPowerupPickup`.)
- [x] Añadir hiperespacio con tecla y botón táctil, cooldown, destino seguro y riesgo controlado. (Tecla `H` y botón `⇋`, cooldown 5 s, búsqueda segura 20 intentos, 10% self-destruct, invuln 0.3 s al reaparecer.)
- [x] Implementar OVNI con aparición aleatoria, movimiento, disparos, colisiones y puntuación. (`UFO_SIZES` con `large` (200 pts) y `small` (1000 pts, sólo desde nivel 3), spawn 18-30 s reducido por nivel, `UfoBullet` con jitter, `playUfoShoot`/`playUfoExplode`.)
- [x] Conectar la intensidad del juego y la aparición del OVNI con el BGM dinámico. (`MusicPlayer.setIntensity(0|1|2)` con tempos 110/125/140 y `linearRampToValueAtTime`; `setUfoActive(bool)` con `ufoLayerGain` independiente para la sirena del OVNI.)

Commits: `6ec17db feat(asteroids)`, `39399e0 feat(asteroids)`, `6fe79ad style(asteroids)`.

### 4. Polish y UX [COMPLETADA]

Estimación: 2-3 días.

- [x] Implementar 5 logros persistentes con notificación toast y panel en menú. (`ACHIEVEMENTS` en `constants.js`: `first_ufo`, `first_powerup`, `hyperspace_safe`, `reach_level_5`, `score_10k`. Disparadores en `destroyUfo`/`applyPowerup`/`tryHyperspace`/level/score. Toast con `aria-live=polite`, panel accesible con `role=list` y `sr-only` para bloqueados. Storage: `asteroid_achievements` con `{id: {unlocked, date}}`.)
- [x] Selector de color/diseño de nave con persistencia. (`SHIP_SKINS` con 6 colores `cyan/amber/green/pink/white/magenta`; UI de swatches con `role=radio`; `getShipColor(skinId)` aplicado en `Ship.draw`; storage `asteroid_ship_skin`.)
- [x] Tutorial inicial descartable y accesible. (`TUTORIAL_STEPS` con 4 slides en `role=dialog aria-modal`; navegación con dots, prev/next, Escape, ArrowLeft/Right; checkbox "no mostrar de nuevo" persiste en `asteroid_tutorial_dismissed`; animación de entrada.)
- [x] Layout portrait + pinch-zoom. (Media query portrait <500px reorganiza info-row y oculta campos secundarios; `setupPinchZoom` en `input.js` con 2 dedos, rango 1x-2x, double-tap reset, indicador de zoom, reset en cambio de orientación.)
- [x] Estados ARIA, foco visible, soporte de teclado y respeto del zoom. (`aria-label` en canvas/botones, `aria-live=polite` en score, `aria-pressed` en toggles, `aria-expanded`/`aria-controls` en achievements, `role=dialog/tab/radio/list`; `:focus-visible` global `outline: 2px solid #fbbf24` en los 5 stylesheets; soporte de teclado del tutorial y game over; `user-scalable=no` se mantiene, pinch-zoom interno en canvas.)
- [x] Accesibilidad base en los 4 juegos restantes. (snake, tetris, arkanoid, space-invaders con ARIA + focus-visible; `aria-live` en scores.)

Repaso de UI tras implementación (sub-tarea extra fuera del plan original, motivado por la diferencia visual con el resto del hub):

- [x] Top UI de Asteroids alineado con los otros 4 juegos. (Eliminado `#player-display` redundante y `#main-start-btn`; el input de nombre ahora se muestra solo en MENU vía `updateOverlay`; `#info-row` y `#controls-row` con `flex-wrap: wrap`; `#game-container` `max-width` 380px para igualar al hub.)
- [x] Estilo consistente de botones. (`#start-btn` con gradiente cyan `#06b6d4 → #22d3ee` igual que los gradientes de los otros 4 juegos; `.touch-btn` ahora son cuadrados redondeados de 12px con tinte cyan/magenta en lugar de píldoras blancas; `.diff-btn` con reglas base fuera del media query.)
- [x] Sound controls como card. (`#sound-controls` con `background: rgba(255,255,255,0.04)`, `border-radius: 50px`, `border`; `#mute-btn`/`#bgm-mute-btn` transparentes con hover `scale(1.15)`; `#volume-slider` con track tenue y thumb cyan con `box-shadow` glow.)
- [x] Game over como modal card con blur fuerte. (`#game-over-card` con borde verde, radio 16px, animación `cardIn`; `#pause-overlay` con `backdrop-filter: blur(20px) saturate(1.2)` y opacidad 0.92; el overlay-title se oculta en GAME_OVER porque la card tiene su propio título.)

Commits:
- `995b9bb feat(accessibility)` — ARIA + focus-visible en los 4 juegos restantes.
- `157443a feat(asteroids)` — `SHIP_SKINS`/`ACHIEVEMENTS`/`TUTORIAL_STEPS` y storage keys.
- `97659b4 feat(asteroids)` — pinch-zoom + double-tap en `input.js`.
- `ecfdb6e feat(asteroids)` — wiring en `game.js` (logros, skin, tutorial, game over card).
- `c3b16ce feat(asteroids)` — bloques HTML (ship-skin-selection, achievements-panel, tutorial-overlay, achievement-toast, game-over-card, ARIA, zoom-indicator).
- `6dcee5a feat(asteroids)` — CSS de swatches, achievements, tutorial, game over card, focus-visible, portrait, blur.

### 5. Consistencia del hub y release [PENDIENTE]

Estimación: 1-2 días.

- Corregir Tetris: scoring de combos, alias `JSnof` y persistencia de audio.
- Revisar Snake, Arkanoid y Tetris para nombres sin `innerHTML` inseguro y preferencias de audio persistentes.
- Actualizar `README.md`, `AGENTS.md` y los tres backlogs para reflejar el estado real.
- QA matrix final (ver criterios de cierre).
- No marcar tareas como completas hasta pasar la matriz de QA.

## Criterios de cierre

- Probar los cinco juegos en escritorio y móvil, incluyendo portrait.
- Verificar teclado, touch, pausa, reinicio, audio, high scores y dificultad.
- Probar localStorage vacío, corrupto y con datos antiguos.
- Verificar comportamiento a 60 y 120 Hz.
- Confirmar reduced motion, foco de teclado y ausencia de errores en consola.
- Ejecutar `node --check` y una prueba manual completa por juego.

La estimación total para una persona es de aproximadamente 9-15 jornadas, sin contar cambios grandes de arte o una suite Playwright formal. Una vez completada la Fase 5 y la matriz de QA, el proyecto queda listo para release.

