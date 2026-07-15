# Space Invaders - Backlog

## 🎯 Prioridad ALTA (Core Gameplay)

### 1. Aliens que disparan hacia el jugador
**Descripción:** Los aliens deben disparar balas hacia abajo como en el original
**Impacto:** Mejora significativa en dificultad y gameplay
**Dificultad:** Baja - requiere lógica de disparo de aliens
**Estimación:** 2-3 horas

**Detalles:**
- Aliens superiores deben disparar más frecuentemente
- Probabilidad de disparo basada en número de aliens vivos
- Balas enemigas deben bajar y ser destruidas por el jugador
- Audio de disparo de aliens

**Archivos a modificar:**
- `js/game.js` - agregar lógica de disparo de aliens
- `js/sound.js` - agregar efecto de sonido para disparo de alien

---

### 2. Explosiones visuales más elaboradas
**Descripción:** Mejorar la visualización de explosiones cuando aliens mueren
**Impacto:** Mejor feedback visual y satisfacción
**Dificultad:** Baja - solo visual
**Estimación:** 1-2 horas

**Detalles:**
- Partículas que se expanden al morir
- Animación de los aliens al morir (expansión)
- Explosiones con múltiples colores
- Fade out de la explosión

**Archivos a modificar:**
- `js/game.js` - implementar sistema de partículas
- `css/style.css` - animaciones de explosiones

---

### 3. Sistema de scoring más completo
**Descripción:** Mejorar el sistema de puntuación con múltiples factores
**Impacto:** Más engagement y variedad en el juego
**Dificultad:** Baja - solo lógica
**Estimación:** 2-3 horas

**Detalles:**
- Puntuación diferente por tipo de alien (3 tipos)
- Bonificaciones por combos/ráfagas
- Puntuación por nivel completado
- Bonus por sobrevivir a más aliens

**Archivos a modificar:**
- `js/constants.js` - ajustar valores de puntos
- `js/game.js` - implementar sistema de scoring avanzado

---

### 4. 3 tipos de aliens con diferentes formas y puntuaciones
**Descripción:** Implementar los 3 tipos clásicos de aliens
**Impacto:** Mejor variedad visual y gameplay
**Dificultad:** Media - requiere sprites/diseño
**Estimación:** 3-5 horas

**Detalles:**
- Tipo 1 (inferior): Aliens pequeños, puntuación baja
- Tipo 2 (medio): Aliens medianos, puntuación media
- Tipo 3 (superior): Aliens grandes, puntuación alta
- Diferentes velocidades para cada tipo
- Diferentes probabilidades de disparo

**Archivos a modificar:**
- `js/constants.js` - definir tipos de aliens
- `js/game.js` - renderizar diferentes formas
- `js/sound.js` - diferentes sonidos por tipo

---

## 📊 Prioridad MEDIA (Features)

### 5. Naves UFO intermedias
**Descripción:** Implementar la nave UFO que vuela arriba y abajo
**Impacto:** Elemento clásico y emocionante
**Dificultad:** Media - requiere lógica de movimiento aleatorio
**Estimación:** 3-4 horas

**Detalles:**
- UFO aparece ocasionalmente arriba
- Vuela de izquierda a derecha
- Puntuación variable (50-300 puntos)
- Audio distintivo del UFO
- Aparece más frecuente en niveles altos

**Archivos a modificar:**
- `js/game.js` - agregar lógica del UFO
- `js/sound.js` - efecto de sonido del UFO
- `css/style.css` - estilo del UFO

---

### 6. Opciones de dificultad
**Descripción:** Permitir al jugador ajustar la dificultad
**Impacto:** Rejugabilidad y personalización
**Dificultad:** Baja - solo UI y config
**Estimación:** 2-3 horas

**Detalles:**
- Velocidad base de aliens
- Velocidad por nivel
- Número de vidas iniciales
- Probabilidad de disparo de aliens
- Mute de música vs efectos

**Archivos a modificar:**
- `js/constants.js` - definir valores de dificultad
- `js/game.js` - aplicar configuración
- `index.html` - agregar controles de dificultad
- `css/style.css` - UI de opciones

---

### 7. Persistencia de configuración
**Descripción:** Guardar preferencias del jugador
**Impacto:** Mejor UX y personalización
**Dificultad:** Baja - localStorage
**Estimación:** 1-2 horas

**Detalles:**
- Guardar nombre de jugador
- Guardar volumen preferido
- Guardar dificultad seleccionada
- Guardar high scores

**Archivos a modificar:**
- `js/game.js` - agregar persistencia
- `js/constants.js` - claves de localStorage

---

## 🎨 Prioridad BAJA (UX/Polish)

### 8. Pantalla de "Game Over" más completa
**Descripción:** Mejorar la pantalla de game over
**Impacto:** Mejor feedback y finalización
**Dificultad:** Baja - UI
**Estimación:** 1-2 horas

**Detalles:**
- Mensaje de "GAME OVER" más prominente
- Mostrar puntuación final
- Tabla de high scores siempre visible
- Botón de reiniciar sin ver high scores
- Mensaje de "New High Score" destacado

**Archivos a modificar:**
- `index.html` - estructura de overlay
- `css/style.css` - estilos de game over
- `js/game.js` - lógica de pantalla

---

### 9. Audio de disparo de aliens
**Descripción:** Agregar efectos de sonido cuando aliens disparan
**Impacto:** Mejor feedback audio
**Dificultad:** Baja - audio
**Estimación:** 30 min - 1 hora

**Detalles:**
- Sonido distintivo para disparo de alien
- Diferente para cada tipo de alien

**Archivos a modificar:**
- `js/sound.js` - agregar efecto

---

### 10. Efecto de sonido de "UFO"
**Descripción:** Agregar sonido característico del UFO
**Impacto:** Mejor feedback de UFO
**Dificultad:** Baja - audio
**Estimación:** 30 min - 1 hora

**Detalles:**
- Sonido ascendente/descendente
- Distinto del resto de efectos

**Archivos a modificar:**
- `js/sound.js` - agregar efecto

---

### 11. Controles mejorados para móvil
**Descripción:** Mejorar controles táctiles
**Impacto:** Mejor UX en móvil
**Dificultad:** Media - UX/UI
**Estimación:** 2-3 horas

**Detalles:**
- Control para pausar desde móvil
- Control para reiniciar desde móvil
- Mejor feedback visual en controles
- Doble toque para disparo rápido
- Long press para movimiento rápido

**Archivos a modificar:**
- `js/input.js` - mejor manejo de touch
- `css/style.css` - mejores indicadores visuales

---

### 12. Animaciones de entrada/salida
**Descripción:** Agregar animaciones al inicio y fin de niveles
**Impacto:** Mejor transiciones y feedback
**Dificultad:** Baja - CSS animations
**Estimación:** 1-2 horas

**Detalles:**
- Animación de entrada al iniciar nivel
- Animación de "Level Complete"
- Fade in/out de UI
- Animación de "New High Score"

**Archivos a modificar:**
- `css/style.css` - agregar animaciones

---

## 📋 Historial de implementaciones previas

### ✅ Implementado (PR #14 - Sprint 2)
- **feat: space invaders sprint 2 - alien shots, UFOs, difficulty options**
- Aliens que disparan (con sonido, configurable por dificultad)
- Naves UFO intermedias (score variable 50-300)
- Opciones de dificultad (Easy/Normal/Hard/Insane) con persistencia
- Fix: botón restart touch ahora funciona

### ✅ Implementado (comit: 38f6f35)
- **feat: align Arkanoid & Space Invaders with existing game design system**

### ✅ Implementado (comit: e65a7e4)
- **feat: improve mobile responsive layout and consistent back button**

### ✅ Implementado (comit: 62463f3)
- **Merge pull request #12 from dezcor/feat/mobile-responsive-fixes**

---

## 🗓️ Roadmap sugerido

### ✅ Sprint 1 (Prioridad Alta) — COMPLETADO
1. ✅ Explosiones visuales
2. ✅ Sistema de scoring más completo
3. ✅ 3 tipos de aliens

### ✅ Sprint 2 (Prioridad Media) — COMPLETADO (PR #14)
4. ✅ Aliens que disparan hacia el jugador
5. ✅ Naves UFO intermedias
6. ✅ Opciones de dificultad

### ✅ Sprint 3 (Prioridad Baja) — COMPLETADO
7. ✅ Persistencia de configuración (volumen SFX/BGM agregado)
8. ✅ Audio de disparo de aliens (variado por tipo de alien)
9. ✅ Efecto de sonido de UFO (ya implementado)
10. ✅ Controles mejorados para móvil (botón pause agregado)
11. ✅ Animaciones de entrada/salida (level enter/complete, score flash)
12. ✅ Pantalla de game over más completa (score final, level, quick restart)

---

## 📊 Resumen de avance

| Sprint | Estado | Items | % |
|--------|--------|-------|---|
| Sprint 1 | ✅ Completado | 3/3 | 100% |
| Sprint 2 | ✅ Completado | 3/3 | 100% |
| Sprint 3 | ✅ Completado | 6/6 | 100% |
| **Total** | **100%** | **12/12** | **100%** |

---

## 📝 Notas adicionales

**Assets necesarios:**
- Sprites para los 3 tipos de aliens (SVG o canvas drawing)
- Sprite para el UFO
- Posibles mejoras en la fuente de texto

**Testing:**
- Móvil: verificar controles táctiles
- Desktop: verificar controles de teclado
- Cross-browser: asegurar compatibilidad

**Performance:**
- Limitar número de partículas
- Optimizar renderizado de aliens

**Accessibility:**
- Asegurar que controles sean accesibles
- Considerar teclado para todos los controles
- Mejor contraste en móvil
