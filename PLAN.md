# Plan para terminar Games Hub

## Diagnóstico

- `BACKLOG.md` de Asteroids tiene 9 tareas abiertas. Power-ups, OVNI, hiperespacio, personalización y tutorial no existen; partículas, BGM dinámico, logros y móvil están parcialmente implementados.
- Asteroids también tiene errores en tareas marcadas como completas: la dificultad sobrescribe sus propios valores (`asteroids/js/game.js:32-38`), el nivel aparece como `undefined` (`game.js:448`), los controles táctiles de pausa/reinicio no actúan y el Top 5 no se muestra correctamente.
- `space-invaders-backlog.md` declara 100%, pero los tipos de alien, scoring, bonus de nivel, dificultad, UFO, persistencia, animaciones y controles móviles siguen incompletos.
- Tetris figura completo, pero no implementa combos/Tetris reales (`tetris/js/game.js:223-255`) y el alias documentado `JSnof` no coincide con el código.
- El repositorio está limpio, todos los JS pasan `node --check`, y no hay tests automáticos ni CI.

## Plan de ejecución

### 1. Fundación y correcciones P0

Estimación: 1-2 días.

- Corregir contratos de configuración, niveles y estados en Asteroids.
- Normalizar el uso de `dt` para que la velocidad no dependa de los FPS.
- Aplicar `maxBullets`, `fireRate` e invulnerabilidad.
- Corregir colisiones, ciclo de vida de proyectiles y progresión de niveles.
- Arreglar localStorage, Top 5, nombres seguros y favicon.
- Reparar controles táctiles, pausa/reinicio y audio muteable.
- En Space Invaders, eliminar el bonus de nivel duplicado y validar la dificultad almacenada.

### 2. Cerrar Space Invaders

Estimación: 2-3 días.

- Centralizar metadatos de los tres tipos de alien: forma, tamaño, puntos, velocidad y probabilidad de disparo.
- Corregir el orden de tipos y puntuación.
- Implementar combos y bonus de supervivencia con reglas explícitas.
- Mejorar disparos alienígenas y decidir si las balas pueden destruirse entre sí.
- Fijar el scheduler del UFO, escalarlo por nivel y conectar `playUFO()`.
- Mejorar explosiones, game over, animaciones y controles móviles.
- Separar y persistir correctamente volumen SFX y BGM.

### 3. Gameplay avanzado de Asteroids

Estimación: 3-5 días.

- Crear una base común para entidades, proyectiles, drops y efectos.
- Implementar partículas de explosión, propulsión y destrucción de la nave, con límite global.
- Añadir power-ups: escudo, doble disparo y vida extra, incluyendo HUD, duración, colisiones y sonidos.
- Añadir hiperespacio con tecla y botón táctil, cooldown, destino seguro y riesgo controlado.
- Implementar OVNI con aparición aleatoria, movimiento, disparos, colisiones y puntuación.
- Conectar la intensidad del juego y la aparición del OVNI con el BGM dinámico.

### 4. Polish y UX

Estimación: 2-3 días.

- Implementar logros persistentes basados en eventos reales del juego.
- Añadir selector de color/diseño de nave y persistencia.
- Crear tutorial inicial descartable y accesible.
- Completar layout portrait, botones táctiles y feedback visual.
- Añadir estados ARIA, foco visible, soporte de teclado y respetar el zoom del usuario.

### 5. Consistencia del hub y release

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
