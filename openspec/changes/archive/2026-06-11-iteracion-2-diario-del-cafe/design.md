# Design — iteracion-2-diario-del-cafe

## Context

El MVP está desplegado (GitHub Pages + Supabase) y archivado en
`openspec/changes/archive/2026-06-11-mvp-diario-del-cafe/`; sus 12 specs son
ahora las specs principales. Esta iteración añade 6 capabilities nuevas y
amplía `coffee-inventory`, manteniendo las convenciones: dominio puro en
`src/lib/` con vitest, derivar-no-almacenar, RLS por usuario, mobile-first.

## Goals / Non-Goals

**Goals:**

- Registrar extracciones sin conexión con sincronización transparente.
- Reducir fricción de datos: OCR de etiquetas, paquete activo preseleccionado, recetas de referencia listas para usar.
- Inventario vivo: saber cuánto café queda y cuándo se acaba, sin almacenar agregados.
- Datos del usuario portables (backup) y comparables (A/B).

**Non-Goals:**

- Sincronización bidireccional con resolución de conflictos (solo cola de inserts).
- OCR perfecto: el formulario siempre es editable; el OCR solo prerellena.
- Export de fotos (solo metadatos; las fotos siguen en Storage).
- Compartir molinillos o recetas entre usuarios.

## Decisions

### D1 — Cola offline: IndexedDB nativo, solo inserts, UUID en cliente

Store `pending-brews` en IndexedDB (API nativa, sin librería). Al fallar el
insert por red, el brew se encola con un `id` UUID **generado en cliente**;
la sincronización (evento `online` + arranque de la app) reintenta el insert
con ese mismo id, de modo que un reintento duplicado choca con la PK y se
descarta — idempotencia sin protocolo de conflictos. El Diario muestra los
pendientes mezclados con una marca «pendiente de sincronizar».

- *Alternativa descartada*: librería de sync (RxDB, PowerSync) — sobredimensionada para una cola de inserts de una sola tabla.

### D2 — OCR: tesseract.js con carga perezosa y parser puro

`tesseract.js` se importa dinámicamente solo al pulsar «Escanear etiqueta»
(no engorda el bundle inicial). El worker usa traineddata `spa` del CDN.
El texto crudo pasa por `src/lib/ocrParse.ts` (puro, testeado): fechas con
regex (dd/mm/aaaa, «tostado el…»), candidatos a nombre por líneas destacadas
y matching difuso contra tostadores ya conocidos del catálogo del usuario.
El resultado solo PRERELLENA el formulario; el usuario siempre confirma.

### D3 — Backup: JSON versionado propio + CSV tabular de brews

Export JSON `{version: 1, exportedAt, coffees, coffee_bags, recipes, grinders, brews}`
(la cata jsonb viaja tal cual; las fotos solo como path). Export CSV solo de
brews (análisis en hoja de cálculo). **Import**: solo nuestro JSON; regenera
TODOS los ids y remapea las referencias (coffee_id, bag_id, recipe_id,
grinder_id) — así un backup es importable en cualquier cuenta sin colisiones
de PK ni problemas de RLS. Ficheros vía Blob + `<a download>`, sin backend.

### D4 — Inventario predictivo derivado en `src/lib/inventory.ts`

`remainingG(bag, brews)` = `weight_g − Σ dose_g` de los brews con ese
`bag_id`. Predicción de fin: consumo medio diario de los últimos 14 días del
paquete extrapolado sobre el restante. Nada se almacena (patrón macros/costes
de plan-del-hambre). El formulario de brew preselecciona el paquete abierto
más fresco en ventana óptima del café elegido.

### D5 — Molinillos: tabla `grinders` + traducción lineal por rango

Migración 002: `grinders (id, user_id, name, min_setting, max_setting, step)`
con RLS estándar; columnas opcionales `grinder_id` en `recipes` y `brews`
(`on delete set null`). Traducción en `src/lib/grinders.ts`: proporción
lineal del rango con redondeo al `step` del molinillo destino, SIEMPRE
etiquetada como aproximada. El ajuste numérico convive con el campo libre
`grind_setting` existente (no rompe datos del MVP).

- *Alternativa descartada*: curvas de calibración por pares de puntos — más fiel pero pide al usuario un trabajo de calibración que casi nadie hará.

### D6 — Recetas de referencia: catálogo estático en código

Como los métodos (D1 del MVP): `src/lib/referenceRecipes.ts` con recetas
famosas tipadas (nombre, autor, método, ratio, dosis, temperatura, fases si
aplica, fuente). Sin BD, sin red, versionadas y testeadas. «Usar» = precargar
Preparar; «guardar para un café» = fork a `recipes` del usuario eligiendo café.

### D7 — Comparador A/B: ruta propia + radar SVG artesanal

Ruta `/diario/comparar?a=<id>&b=<id>`; se entra seleccionando dos brews en el
Diario (modo comparar). Radar de 4 ejes dibujado con SVG propio (~40 líneas;
una librería de charts no se justifica). Parámetros en tabla a dos columnas
con diferencias resaltadas.

## Risks / Trade-offs

- [OCR irregular con etiquetas artísticas] → el OCR nunca bloquea: prerellena y el usuario corrige; matching contra tostadores conocidos sube el acierto con el uso.
- [IndexedDB no disponible (Safari privado)] → detección al arrancar; sin IndexedDB la app se comporta como el MVP (escrituras requieren red) con aviso.
- [Doble envío al sincronizar] → UUID de cliente como PK: el reintento duplicado falla por PK y se descarta (D1).
- [Predicción de fin engañosa con consumo irregular] → ventana móvil de 14 días y etiqueta «al ritmo actual»; sin datos suficientes no se predice.
- [Import malicioso o corrupto] → validación estructural estricta del JSON (versión, tipos, vocabulario de cata vía `parseTasting`) antes de tocar la BD.
- [tesseract.js pesa ~2 MB] → import dinámico + cache del SW tras el primer uso.

## Migration Plan

Migración 002 (aditiva, sin tocar datos existentes): tabla `grinders` +
columnas `grinder_id`. Se aplica vía Management API como la 001. Rollback:
drop de tabla/columnas, sin pérdida para el resto del sistema. El despliegue
sigue siendo el workflow de Pages existente.

## Open Questions

- Lista inicial de recetas de referencia (¿6–10? Hoffmann V60, espresso clásico 1:2, AeroPress campeonato, prensa de inmersión larga, moka clásica, cold brew 1:8) → se fija al implementar `referenceRecipes.ts`.
- ¿La cola offline cubre también altas de café/paquete? → MVP de la cola: solo brews (el caso real junto a la cafetera); ampliable después.
