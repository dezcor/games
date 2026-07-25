# Plan para terminar Games Hub

## Diagnóstico

- `BACKLOG.md` de Asteroids tiene 9 tareas abiertas. Power-ups, OVNI, hiperespacio, personalización y tutorial no existen; partículas, BGM dinámico, logros y móvil están parcialmente implementados.
- Los errores P0 de Asteroids descritos anteriormente fueron corregidos en la Fase 1: configuración, nivel, controles táctiles, Top 5, colisiones, progresión y audio.
- `space-invaders-backlog.md` declara 100%, pero todavía requiere centralizar metadatos, scoring avanzado, combos, UFO, animaciones y UX; la Fase 1 corrigió únicamente los contratos P0, bonus, dificultad, tiempo y audio.
- Tetris figura completo, pero no implementa combos/Tetris reales (`tetris/js/game.js:223-255`) y el alias documentado `JSnof` no coincide con el código.
- Todos los JS pasan `node --check`; no hay tests automáticos ni CI.

## Estado actual

- Fase 1: **completada**. Asteroids y Space Invaders tienen los cambios P0 implementados y verificados con pruebas de navegador.
- Fase 2: **en progreso**. La persistencia y separación de volumen SFX/BGM de Space Invaders ya está corregida; el resto sigue pendiente.
- Fases 3, 4 y 5: **pendientes**.
- Verificación completada: `node --check`, `git diff --check`, carga sin errores de consola, pausa/reinicio/touch, localStorage corrupto, dificultad, bonus único y equivalencia temporal a 60/120 Hz en Asteroids y Space Invaders.
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

### 2. Cerrar Space Invaders [EN PROGRESO]

Estimación: 2-3 días.

- Centralizar metadatos de los tres tipos de alien: forma, tamaño, puntos, velocidad y probabilidad de disparo.
- Corregir el orden de tipos y puntuación.
- Implementar combos y bonus de supervivencia con reglas explícitas.
- Mejorar disparos alienígenas y decidir si las balas pueden destruirse entre sí.
- Fijar el scheduler del UFO, escalarlo por nivel y conectar `playUFO()`.
- Mejorar explosiones, game over, animaciones y controles móviles.
- [x] Separar y persistir correctamente volumen SFX y BGM.

### 3. Gameplay avanzado de Asteroids [PENDIENTE]

Estimación: 3-5 días.

- Crear una base común para entidades, proyectiles, drops y efectos.
- Implementar partículas de explosión, propulsión y destrucción de la nave, con límite global.
- Añadir power-ups: escudo, doble disparo y vida extra, incluyendo HUD, duración, colisiones y sonidos.
- Añadir hiperespacio con tecla y botón táctil, cooldown, destino seguro y riesgo controlado.
- Implementar OVNI con aparición aleatoria, movimiento, disparos, colisiones y puntuación.
- Conectar la intensidad del juego y la aparición del OVNI con el BGM dinámico.

### 4. Polish y UX [PENDIENTE]

Estimación: 2-3 días.

- Implementar logros persistentes basados en eventos reales del juego.
- Añadir selector de color/diseño de nave y persistencia.
- Crear tutorial inicial descartable y accesible.
- Completar layout portrait, botones táctiles y feedback visual.
- Añadir estados ARIA, foco visible, soporte de teclado y respetar el zoom del usuario.

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
