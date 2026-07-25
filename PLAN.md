# Plan para terminar Games Hub

## Diagnóstico

- `BACKLOG.md` de Asteroids declaraba 9 tareas abiertas al inicio del plan. Las Fases 1-5 cierran P0, gameplay avanzado, polish (logros/skin/tutorial/mobile/accesibilidad) y consistencia del hub (Tetris scoring real, innerHTML→createElement, audio persistido en 3 juegos, docs alineadas, easter egg unificado).
- Los errores P0 de Asteroids descritos anteriormente fueron corregidos en la Fase 1: configuración, nivel, controles táctiles, Top 5, colisiones, progresión y audio.
- `space-invaders-backlog.md` declara 100%; la Fase 2 también dejó verificados los metadatos, scoring avanzado, combos, UFO, animaciones y UX móvil.
- Tetris ahora implementa combos/Tetris reales (Single/Double/Triple/Tetris con back-to-back x1.5) y el alias documentado `JSnow` está alineado con el código.
- Todos los JS pasan `node --check`; no hay tests automáticos ni CI.

## Estado actual

- Fase 1: **completada**. Asteroids y Space Invaders tienen los cambios P0 implementados y verificados con pruebas de navegador.
- Fase 2: **completada**. Space Invaders tiene metadatos centralizados, scoring por tipo, combos, disparos limitados, colisión entre proyectiles, UFO escalado, efectos con límite y controles móviles robustos.
- Fase 3: **completada**. Asteroids tiene base común de entidades, partículas con tope global, tres power-ups (escudo/doble/vida) con HUD, hiperespacio con cooldown y 10% de self-destruct, OVNI grande + pequeño con disparos, y BGM dinámico con tempo variable y capa de OVNI.
- Fase 4: **completada**. Asteroids suma 5 logros persistentes con notificación toast y panel en menú, selector de 6 colores de nave, tutorial inicial 4 pasos con persistencia, layout portrait y pinch-zoom con double-tap reset, ARIA global, focus-visible y refuerzo de teclado en el tutorial. Los otros 4 juegos recibieron ARIA + focus-visible base. Tras la implementación se hizo un repaso de UI: alineación del top UI con el resto del hub (eliminado `#player-display` y `#main-start-btn`, flex-wrap, max-width 380px), estilo consistente de botones (START con gradiente cyan, touch buttons redondeados con tinte cyan/magenta, diff buttons con estilos base, sound controls como card, game over como modal card con blur 20px).
- Fase 5: **completada**. Tetris tiene scoring real (Single 100 / Double 300 / Triple 500 / Tetris 800 × nivel) con back-to-back Tetris x1.5 y banner visual. `innerHTML` reemplazado por `createElement` + `textContent` en Tetris y Arkanoid. Persistencia de audio SFX (Snake, Tetris, Arkanoid) y BGM (Tetris, Arkanoid) en `localStorage` con helpers `getStoredNumber`/`getStoredBoolean`/`saveAudioSetting` y slider sincronizado al cargar. Asteroids acepta `jsnow` además de `jsnof`/`jonsnow`/`jon` para medalla de oro. Documentación alineada: `README.md` añade sección Asteroids y controles, `AGENTS.md` corrige el alias a `JSnow` y lista storage keys de asteroids, los 3 backlogs marcan todas las fases como completadas.
- Verificación completada: `node --check` en los 13 JS del proyecto; QA matrix: los 5 juegos cargan con localStorage corrupto sin errores en consola; audio se persiste y restaura correctamente en reload; combos de Tetris verificados (Single 100, Double 300, Triple 500×nivel, Tetris 800×nivel, back-to-back 800×1.5); easter egg de Tetris funciona con `JSnow`/`Jon`/`Jon Snow` (con espacios); easter egg de Asteroids acepta `jsnow`/`jsnof`/`JSnow`/`JSnof`/`jonsnow`/`jon`; combo banner aparece y respeta `prefers-reduced-motion`; 20 ciclos de input en Asteroids sin errores de consola; high scores tables renderizan con `createElement` (sin `<script>` inyectado en HTML).
- Verificación pendiente: suite Playwright formal y ejecución en 120 Hz real (no headless). En headless webkit se mantiene a 60-61 FPS estable; el `dt` ya está normalizado en los 5 juegos, por lo que un monitor de 120 Hz debe funcionar sin cambios.

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

Repaso de UI tras implementación:

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

### 5. Consistencia del hub y release [COMPLETADA]

Estimación: 1-2 días.

- [x] Tetris: scoring real con Single/Double/Triple/Tetris (100/300/500/800 × nivel) y back-to-back Tetris con multiplicador x1.5. Banner visual de combos con `aria-live=polite` y respeto de `prefers-reduced-motion`.
- [x] Easter egg unificado a `JSnow` (con W) en `AGENTS.md` y `README.md`. `jsnof` queda como alias legacy en Asteroids para no romper high scores existentes.
- [x] Reemplazar `innerHTML` con `createElement` + `textContent` en `renderHighScoresTable` de Tetris y Arkanoid. Defense-in-depth que sigue el patrón ya usado en Asteroids.
- [x] Persistencia de audio en Snake (SFX vol + mute), Tetris (SFX + BGM, vol + mute) y Arkanoid (SFX + BGM, vol + mute). Helpers `getStoredNumber`/`getStoredBoolean`/`saveAudioSetting`. Slider sincronizado al cargar; `aria-pressed` correcto en botones mute.
- [x] Documentación: `README.md` añade sección Asteroids y controles, actualiza Tetris/Snake/Arkanoid con persistencia de audio y scoring real. `AGENTS.md` añade `asteroids/` en Structure, lista storage keys de asteroids, corrige alias a `JSnow`. `BACKLOG.md`, `tetris_backlog.md` y `space-invaders-backlog.md` marcan todas las fases como completadas.
- [x] QA matrix: `node --check` en los 13 JS; los 5 juegos cargan con localStorage corrupto sin errores; audio se persiste y restaura correctamente; combos de Tetris verificados manualmente; easter egg funciona con todas las variantes; combo banner respeta `prefers-reduced-motion`; high scores tables no inyectan HTML.

Commits:
- `0152d73 feat(tetris)` — scoring Single/Double/Triple/Tetris + back-to-back + combo banner.
- `6cfd8a4 refactor(tetris,arkanoid)` — `innerHTML` → `createElement` en high scores.
- `809e300 feat(audio)` — persistencia de audio en Snake, Tetris, Arkanoid.
- `8cc2f38 fix(asteroids)` — añadir `jsnow` al set de aliases.
- `df079bd docs` — alinear README, AGENTS, 3 backlogs con el estado real.

## Criterios de cierre

- Probar los cinco juegos en escritorio y móvil, incluyendo portrait. ✅ verificado en desktop 1280×800 (60-61 FPS) y portrait 375×812 (pinch-zoom funcional en Asteroids).
- Verificar teclado, touch, pausa, reinicio, audio, high scores y dificultad. ✅ verificado en los 5 juegos.
- Probar localStorage vacío, corrupto y con datos antiguos. ✅ los 5 juegos cargan con `localStorage.clear()` y con valores inválidos sin errores en consola.
- Verificar comportamiento a 60 y 120 Hz. ⚠ headless webkit se mantiene a 60-61 FPS estable; el `dt` ya está normalizado en los 5 juegos, por lo que un monitor de 120 Hz real debe funcionar (no testeable en este entorno headless).
- Confirmar reduced motion, foco de teclado y ausencia de errores en consola. ✅ `prefers-reduced-motion` emulado y verificado; `:focus-visible` global con outline `#fbbf24` en los 5 stylesheets; cero errores de consola en QA matrix.
- Ejecutar `node --check` y una prueba manual completa por juego. ✅ `node --check` pasa en los 13 JS.

La estimación total para una persona es de aproximadamente 9-15 jornadas, sin contar cambios grandes de arte o una suite Playwright formal. Con la Fase 5 y la matriz de QA completadas, el proyecto queda listo para release.

## Pendientes fuera de alcance (no bloquean release)

- Suite Playwright formal con cobertura sistemática de los 5 juegos.
- Ejecución en hardware real de 120 Hz.
- Sprites SVG/PNG para Asteroids (actualmente todo en canvas drawing).
- Internacionalización (todos los textos están en español salvo términos universales).

