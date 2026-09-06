# Una pregunta rara — Especificación para implementación

## Objetivo
Crear una microexperiencia web privada, minimalista y ligeramente misteriosa, pensada para una persona llamada **Vero**.

La experiencia funciona como un pequeño juego de preguntas personales. Si la persona correcta entra, podrá responder con total libertad sabiendo que sus respuestas **no se guardan, no se envían y no podrán ser leídas posteriormente**.

---

## Flujo general
1. Mostrar una pantalla inicial.
2. Solicitar un nombre.
3. Normalizar el nombre con `trim()` y `lowercase()`.
4. Si el nombre es distinto de `vero`, terminar el juego con un mensaje neutro.
5. Si el nombre es `vero`, mostrar una introducción especial.
6. Seleccionar aleatoriamente varias preguntas de un banco de 20.
7. Mostrar una pregunta por pantalla.
8. Permitir responder, omitir o avanzar.
9. Descartar cada respuesta inmediatamente al avanzar.
10. Mostrar una pantalla final.
11. Limpiar cualquier estado temporal al terminar.

---

## Reglas funcionales

### 1. Validación del nombre
Aceptar únicamente el valor exacto `vero` después de normalizar:

```js
name.trim().toLowerCase()
```

Deben ser válidos:
- `Vero`
- `vero`
- ` Vero `
- combinaciones de mayúsculas/minúsculas

No deben ser válidos:
- `Verónica`
- `Veronica`
- `Vero Lara`
- cualquier otro valor

### 2. Si escribe otro nombre
No mostrar ninguna pregunta personal.

Mostrar:

> Parece que este juego no era para esa persona. 👀

Botón:

> Volver al inicio

No revelar:
- cuál era el nombre correcto;
- que existe una persona específica;
- cuántas preguntas existen;
- qué habría sucedido con otro nombre.

### 3. Si escribe Vero
Mostrar secuencialmente:

> Ah...

> Entonces sí eres tú.

> Este juego tiene algunas preguntas raras.

> Responde lo primero que pienses.

> Nadie verá tus respuestas. Ni siquiera yo.

Botón:

> Empezar

---

## Privacidad
La privacidad es un requisito absoluto.

Las respuestas **jamás** deben:
- enviarse a una API;
- guardarse en una base de datos;
- almacenarse en `localStorage`;
- almacenarse en `sessionStorage`;
- almacenarse en cookies;
- aparecer en logs;
- incluirse en analytics;
- incluirse en URLs o query params;
- persistir después de refrescar.

Las respuestas solo pueden existir temporalmente en memoria mientras se muestra la pregunta actual.

Flujo:

```text
Pregunta
↓
Usuario escribe respuesta
↓
Continuar
↓
Descartar respuesta
↓
Siguiente pregunta
```

No conservar historial de respuestas.

---

## Banco de 20 preguntas
1. ¿Qué fue lo primero que pensaste de mí cuando me conociste?
2. ¿Qué es lo que más te gusta de mi forma de ser?
3. ¿Qué cosa mía te desespera un poquito?
4. ¿Alguna vez pensaste que entre nosotros podía pasar algo?
5. ¿Hubo algún momento en el que sentiste que yo te gustaba?
6. ¿Qué recuerdo conmigo te da más nostalgia?
7. ¿Qué momento nuestro te hubiera gustado vivir diferente?
8. Si pudieras volver a un día conmigo, ¿cuál sería?
9. ¿Qué crees que entiendo de ti que otras personas no?
10. ¿Qué crees que tú entiendes de mí que casi nadie entiende?
11. Si alguien preguntara qué soy para ti, ¿qué responderías?
12. ¿Crees que somos parecidos o simplemente nos entendemos bien?
13. ¿Alguna vez imaginaste cómo habría sido si hubiéramos salido?
14. ¿Qué crees que habría sido lo mejor de nosotros como pareja?
15. ¿Qué habría sido lo más complicado?
16. ¿Hay algo que alguna vez quisiste decirme y nunca dijiste?
17. ¿Alguna vez te preocupó que yo interpretara mal algo que hiciste o dijiste?
18. Si pudiéramos pasar un día juntos sin consecuencias ni interpretaciones, ¿qué haríamos?
19. ¿Crees que quedó algo pendiente entre nosotros?
20. ¿Hay algo de mí que todavía te dé curiosidad?

### Pregunta final fija
Seleccionar 6 preguntas al azar y agregar una séptima pregunta fija:

> Si supieras con absoluta certeza que nunca voy a leer esta respuesta… ¿qué me dirías ahora mismo?

No repetir preguntas dentro de la misma sesión.

---

# Diseño visual

## Estética
La experiencia debe sentirse:
- oscura;
- minimalista;
- íntima;
- elegante;
- ligeramente misteriosa;
- personal;
- no cursi.

Evitar corazones flotantes, rosas, confeti o elementos infantiles.

## Paleta
```css
--background: #09090D;
--surface: #14141B;
--surface-hover: #1C1C26;
--primary: #D946EF;
--secondary: #8B5CF6;
--accent: #F9A8D4;
--text-primary: #F7F7FA;
--text-secondary: #A6A6B3;
--border: #292934;
```

Gradiente:

```css
linear-gradient(135deg, #D946EF, #8B5CF6);
```

## Tipografía
- **Manrope** para títulos.
- **Inter** para texto.

---

## Pantalla inicial
Título:

> Tengo una pregunta rara.

Subtítulo:

> Pero primero necesito saber quién eres.

Input:

> Escribe tu nombre

Botón:

> Continuar

Texto inferior:

> No necesitas iniciar sesión.

---

## Animación al detectar Vero
Al validar correctamente:
1. Glow magenta muy sutil.
2. Mostrar textos de introducción progresivamente.
3. Transiciones suaves de 250–300 ms.

---

## Pantalla de preguntas
Mostrar una sola pregunta por pantalla.

Ejemplo:

```text
3 / 7

¿Crees que quedó algo pendiente entre nosotros?

[ Escribe lo que realmente piensas... ]

Prefiero no responder

                 Continuar →
```

Textarea:
- máximo 500 caracteres;
- contador discreto;
- no obligatorio;
- cómodo en móvil;
- sin autoguardado;
- sin persistencia.

Siempre permitir:

> Prefiero no responder

---

## Barra de progreso
Ejemplo:

```text
━━━━━━────────────
3 de 7
```

Usar el gradiente principal.

No revelar cuántas preguntas existen en el banco completo.

---

## Animaciones
Entre preguntas:

```text
opacity: 0 → 1
translateY: 8px → 0
duration: 250ms
```

Respetar `prefers-reduced-motion`.

No usar:
- confeti;
- corazones flotantes;
- partículas excesivas;
- animaciones infantiles.

---

## Pantalla final
Mostrar:

> Listo.

Después:

> Todo lo que respondiste se queda aquí…  
> y desaparece cuando cierres esta página.

Después:

> Gracias por jugar, Vero. ✨

Después:

> Algunas preguntas quizá no necesitaban respuesta.

Botón:

> Terminar

Al terminar:
- limpiar estado temporal;
- borrar respuesta actual;
- impedir recuperar contenido previo.

---

## Reglas UX
- Mobile-first.
- Optimizado para 360–480 px.
- Responsive en desktop.
- WCAG AA.
- Botones mínimo 44 px de alto.
- Sin login.
- Sin correo.
- Sin teléfono.
- Sin tracking.
- Sin analytics.
- Sin modales o menús innecesarios.
- Soporte de teclado.
- Respetar `prefers-reduced-motion`.

---

## Ocultar realmente el nombre
Si todo está en frontend, alguien podría inspeccionar el JS y encontrar:

```js
if (name === "vero")
```

Para ocultarlo de verdad, validar en servidor:

```http
POST /api/start
```

Body:

```json
{
  "name": "Vero"
}
```

Respuesta:

```json
{
  "allowed": true
}
```

El frontend nunca debe recibir el nombre esperado.

---

## Arquitectura sugerida
Puede implementarse con React + Vite, Next.js, Vue, Svelte o HTML/CSS/JS puro.

Estructura sugerida:

```text
src/
├── components/
│   ├── NameGate
│   ├── Intro
│   ├── QuestionCard
│   ├── ProgressBar
│   └── FinalScreen
├── data/
│   └── questions
├── utils/
│   ├── shuffle
│   └── normalizeName
├── styles/
│   └── theme
└── App
```

---

## Checklist de privacidad
- [ ] No existe `localStorage` para respuestas.
- [ ] No existe `sessionStorage` para respuestas.
- [ ] No existen cookies con respuestas.
- [ ] No existen requests de red con respuestas.
- [ ] No aparecen respuestas en logs.
- [ ] No aparecen respuestas en analytics.
- [ ] No aparecen respuestas en URLs.
- [ ] No existe historial interno de respuestas.
- [ ] Al avanzar, la respuesta anterior se elimina.
- [ ] Al recargar, todo se pierde.
- [ ] Al cerrar, todo se pierde.
- [ ] Al terminar, el estado temporal se limpia.
- [ ] El nombre correcto no se revela cuando la entrada es incorrecta.

---

# Prompt listo para Codex u otro agente

```text
Implementa una aplicación web mobile-first llamada provisionalmente
"Una pregunta rara".

OBJETIVO
Crear una pequeña experiencia interactiva privada dirigida a una persona
llamada Vero.

FLUJO
1. Mostrar una pantalla inicial que solicite un nombre.
2. Normalizar el nombre usando trim() y lowercase().
3. Únicamente si el valor es exactamente "vero" debe continuar al juego.
4. Para cualquier otro nombre:
   - No mostrar preguntas.
   - No revelar cuál era el nombre correcto.
   - Mostrar: "Parece que este juego no era para esa persona. 👀"
   - Permitir volver al inicio.
5. Si el nombre es "vero", mostrar:
   "Ah..."
   "Entonces sí eres tú."
   "Este juego tiene algunas preguntas raras."
   "Responde lo primero que pienses."
   "Nadie verá tus respuestas. Ni siquiera yo."
6. Mostrar botón "Empezar".

PREGUNTAS
- Crear un banco de 20 preguntas.
- Barajar.
- Elegir 6 sin repetir.
- Agregar una séptima pregunta final fija:
  "Si supieras con absoluta certeza que nunca voy a leer esta respuesta…
  ¿qué me dirías ahora mismo?"
- Mostrar una sola pregunta por pantalla.
- Permitir hasta 500 caracteres.
- Permitir continuar sin responder.
- Permitir "Prefiero no responder".

PRIVACIDAD — REQUISITO ABSOLUTO
Las respuestas jamás deben:
- enviarse a APIs;
- guardarse en base de datos;
- almacenarse en localStorage;
- almacenarse en sessionStorage;
- almacenarse en cookies;
- aparecer en logs;
- incluirse en analytics;
- incluirse en URLs;
- persistir tras refrescar.

Después de avanzar, descartar inmediatamente la respuesta anterior.

DISEÑO
Estética:
- oscura;
- minimalista;
- íntima;
- ligeramente misteriosa;
- elegante;
- no cursi.

Colores:
background: #09090D
surface: #14141B
surface-hover: #1C1C26
primary: #D946EF
secondary: #8B5CF6
accent: #F9A8D4
text-primary: #F7F7FA
text-secondary: #A6A6B3
border: #292934

Gradiente:
linear-gradient(135deg, #D946EF, #8B5CF6)

Tipografía:
Manrope para títulos.
Inter para texto.

ANIMACIONES
opacity 0 -> 1
translateY(8px) -> 0
duración 250ms.
Respetar prefers-reduced-motion.

PANTALLA FINAL
"Listo."
"Todo lo que respondiste se queda aquí…
y desaparece cuando cierres esta página."
"Gracias por jugar, Vero. ✨"
"Algunas preguntas quizá no necesitaban respuesta."

Botón: "Terminar"

Al terminar:
limpiar completamente cualquier estado temporal.

REQUISITOS TÉCNICOS
- Código limpio y modular.
- Componentes pequeños.
- Mobile-first.
- Responsive.
- WCAG AA.
- Sin dependencias innecesarias.
- Sin tracking.
- Sin analytics.
- No guardar respuestas bajo ninguna circunstancia.

Antes de terminar:
auditar específicamente el código para garantizar que ninguna respuesta
pueda persistir o salir del navegador.
```
