# CLAUDE.md — diario-del-cafe

## Comandos

- `pnpm dev` / `pnpm build` / `pnpm lint` / `pnpm test` (vitest). Siempre pnpm, nunca npm.
- Node 24 vía nvm: si `node --version` marca v18, carga nvm primero
  (`. "$HOME/.nvm/nvm.sh"`).
- OpenSpec: artefactos en `openspec/changes/mvp-diario-del-cafe/`. Antes de
  implementar algo nuevo, revisa specs y marca tareas en `tasks.md`.
- Iconos PWA: `node scripts/gen-icons.mjs` (PNG sin dependencias).

## Arquitectura

- React 19 + Vite + TS + Tailwind 4 (config CSS-first en `src/index.css`) +
  Supabase + PWA (`generateSW`, runtime caching para lecturas de Supabase).
- Sin librería de componentes ni de estado: contextos en `src/hooks/`,
  componentes propios en `src/components/`.
- Lógica pura y testeable en `src/lib/` (methods, ratio, freshness, dialin,
  tasting, caffeine, stats): ninguna función toca red; reciben datos y
  devuelven resultados.
- Métodos de preparación: catálogo ESTÁTICO en `src/lib/methods.ts` (no BD).
  El usuario no edita defaults, los sobrescribe con recetas (`recipes`).
- Modelo: `coffees` → `coffee_bags` (paquetes/frescura) y `recipes` (por
  café+método); `brews` referencia café/paquete/receta y lleva la cata en
  `brews.tasting jsonb` validado SOLO a través de `src/lib/tasting.ts`.
- Derivar, no almacenar: gasto, cafeína, ranking y precio/calidad se calculan
  al vuelo desde paquetes y brews (nunca agregados persistidos).
- Cronómetro basado en timestamps (`startedAt`), nunca `setInterval` como
  fuente de verdad: sobrevive a bloqueos de pantalla.
- Dial-in: motor de reglas determinista en `src/lib/dialin.ts`; una sola
  variable de ajuste por sugerencia, siempre con explicación.
- RLS por usuario (`auth.uid() = user_id`), sin households. Fotos en bucket
  privado `brew-photos`, comprimidas en cliente antes de subir.
- Cola offline (`src/lib/offlineQueue.ts` + `OfflineSyncProvider`): SOLO
  inserts de brews, UUID generado en cliente como PK (reintento duplicado →
  23505 = sincronizado). Sincroniza al arrancar y al evento `online`.
- OCR de etiquetas: tesseract.js SIEMPRE por import dinámico (no engordar el
  bundle); el parser puro vive en `src/lib/ocrParse.ts` y solo prerellena.
- Recetas de referencia: catálogo estático `src/lib/referenceRecipes.ts`
  (mismo patrón que methods); fork = crear/actualizar receta del usuario.
- Backup: `src/lib/exporter.ts` — el import valida (`validateBackup`),
  regenera TODOS los ids y remapea FKs (`remapBackup`); nunca insertar el
  JSON tal cual.
- Molinillos: traducción de ajustes en `src/lib/grinders.ts`, lineal por
  rango y SIEMPRE etiquetada como aproximada en la UI.

## Sistema de diseño (Carta de tostador)

- Titulares con serif **DM Serif Display** (`font-display`); cuerpo **Inter**;
  cifras tabulares para gramos/ratios/segundos (`data-numeric`). Fuentes por
  `<link>` en `index.html`.
- Papel crema (`paper #f8f3ea`), tinta espresso (`ink #2b211b`), caramelo
  primario (`caramel`), cobre activo (`copper`), hoja para frescura (`leaf`),
  miel para avisos (`warn`), teja para peligro (`danger`).
- Utilidades propias: `card` (hairline + radio 0.75rem), `hairline`, `press`
  (scale al pulsar), `pulse-soft`. Cambiar la estética = tocar
  `src/index.css`, no las pantallas.
- Mobile-first estricto: layout max-w-md, navegación inferior de 4 secciones
  (Preparar / Cafés / Diario / Perfil), targets táctiles generosos.
