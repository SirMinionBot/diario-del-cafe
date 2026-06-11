# Design — mvp-diario-del-cafe

## Context

Proyecto nuevo sin código previo. Hereda el stack y las convenciones probadas en
`plan-del-hambre` (React 19 + Vite + TS + Tailwind 4 CSS-first + Supabase + PWA,
pnpm, lógica pura en `src/lib/`), pero es una app independiente, con su propio
proyecto Supabase y su propio sistema de diseño. Usuario objetivo: aficionado al
café de especialidad que prepara en casa con báscula y molinillo, siempre desde
el móvil (a menudo con una mano, con la otra en el cacillo).

## Goals / Non-Goals

**Goals:**

- App usable con una mano junto a la cafetera: calculadora, cronómetro y registro a ≤2 toques desde la home.
- Toda la lógica de dominio (ratios, dial-in, frescura, cafeína, estadísticas) pura y testeable en `src/lib/`, sin tocar red.
- Datos personales por usuario con RLS; fotos en Supabase Storage.
- PWA instalable con lecturas offline (catálogo, recetas, últimos registros).

**Non-Goals:**

- Funciones sociales (seguir usuarios, feeds, comentarios). Compartir = exportar una tarjeta, no una red social.
- Integración con básculas/molinillos Bluetooth.
- Recomendaciones con IA: el dial-in es un motor de reglas determinista.
- Multi-hogar/multi-perfil: una cuenta = un diario (a diferencia de plan-del-hambre, no hay `household`).
- Escrituras offline con cola de sincronización (MVP: escribir requiere conexión).

## Decisions

### D1 — Métodos de preparación como catálogo estático en código

Los métodos (espresso, V60, prensa francesa, AeroPress, moka, cold brew) y sus
valores por defecto (ratio, temperatura, tiempo objetivo, fases) viven en
`src/lib/methods.ts` como constantes tipadas, no en base de datos.

- *Por qué*: son conocimiento universal y estable; versionarlos con el código permite testearlos y evita migraciones para ajustar un default.
- *Alternativa descartada*: tabla `brew_methods` en Supabase — añade red y migraciones sin beneficio; el usuario no edita los defaults, los **sobrescribe** con sus recetas.

### D2 — Modelo de datos: `coffees` → `coffee_bags` → `brews`, recetas aparte

```
coffees        marca/café del usuario (tueste, origen, precio por kg…)
  └─ coffee_bags    paquete físico: fecha de tueste, peso, abierto/terminado
  └─ recipes        receta del usuario por (coffee, method): ratio, dosis,
                    molienda, temperatura — sobrescribe los defaults de D1
brews          extracción registrada: FK a coffee/bag/recipe + parámetros
               reales + valoración + cata (jsonb) + foto + flag de dial-in
```

- Las anotaciones de cata (ejes + descriptores) van en `brews.tasting jsonb`: siempre se leen/escriben junto al brew y su forma evolucionará; un jsonb validado por tipos TS evita una tabla satélite.
- Precio por kg se guarda en `coffees` y la estadística de gasto se **deriva** de paquetes comprados (`coffee_bags`), nunca se almacena agregada — mismo patrón que macros/costes en plan-del-hambre.
- RLS: todas las tablas con `user_id` y política `auth.uid() = user_id`. Sin catálogo global en MVP.

### D3 — Lógica pura en `src/lib/`, contexto por inyección

`ratio.ts` (calculadora inversa), `dialin.ts` (motor de reglas), `freshness.ts`
(ventana óptima), `caffeine.ts` (estimación mg), `stats.ts` (agregados de gasto
y ranking). Ninguna función toca red: reciben datos y devuelven resultados
(patrón recommender de plan-del-hambre). Vitest cubre cada módulo.

### D4 — Cronómetro basado en timestamps, no en intervalos

El timer guarda `startedAt` (epoch) y deriva el transcurrido en cada render;
los avisos de fase se calculan contra timestamps. Sobrevive a bloqueos de
pantalla y cambios de pestaña, donde `setInterval` deriva. Vibración/sonido
via `navigator.vibrate` + Web Audio con degradación silenciosa.

### D5 — Dial-in como motor de reglas determinista

Entrada: método, tiempo real, rendimiento real vs objetivo y etiqueta de sabor
(`ácido/agrio`, `equilibrado`, `amargo/astringente`). Salida: sugerencia
discreta («muele 2 puntos más fino», «sube la dosis 0,5 g») con explicación.
Reglas clásicas de extracción codificadas en `dialin.ts` y testeadas caso a caso.

- *Alternativa descartada*: LLM/heurística adaptativa — impredecible, requiere red y no aporta sobre las reglas estándar para un MVP.

### D6 — Compartir recetas como tarjeta-imagen

La receta se renderiza a un canvas (tarjeta con marca, método, ratio, molienda,
temperatura, tiempo) y se comparte como imagen vía Web Share API, con fallback
a descarga. Sin links públicos ni backend de shares en MVP.

- *Por qué*: cero superficie pública (no hay que pensar en RLS de lecturas anónimas) y funciona en cualquier chat.

### D7 — Fotos: Storage con compresión en cliente

Bucket `brew-photos` privado por usuario. Antes de subir, la imagen se
redimensiona (~1280 px, JPEG q0.8) en un canvas. Una foto opcional por brew.

### D8 — Sistema de diseño propio: «Carta de tostador»

Estética de carta de tostador de especialidad: papel crema, tinta espresso,
acento caramelo/cobre, tipografía display serif para titulares y sans legible
para datos (cifras tabulares para gramos/segundos). Definido íntegramente en
`src/index.css` (Tailwind 4 CSS-first); cambiar la estética = tocar ese fichero,
no las pantallas. Navegación inferior de 4 secciones: **Preparar** (calculadora
+ timer), **Cafés** (catálogo e inventario), **Diario** (log + cata),
**Perfil/Stats**.

### D9 — Offline: precache de app shell + caché de lecturas

`vite-plugin-pwa` con precache del shell y runtime caching
(stale-while-revalidate) para las consultas de catálogo/recetas/últimos brews.
La calculadora y el cronómetro funcionan 100 % offline (lógica local, D1/D3).
Escrituras requieren conexión y fallan con aviso claro.

## Risks / Trade-offs

- [El dial-in simplifica una realidad con muchas variables] → sugerencias siempre con explicación y en tono orientativo; una sola variable de ajuste por sugerencia.
- [Estimación de cafeína imprecisa (varía por café y extracción)] → modelo mg/g por método documentado en `caffeine.ts`, etiquetado como estimación en la UI.
- [jsonb de cata sin esquema en BD] → tipos TS + validador en `src/lib/tasting.ts` como única puerta de lectura/escritura.
- [Timer con pantalla bloqueada en iOS puede perder avisos sonoros] → el tiempo siempre es correcto al volver (D4); los avisos son mejora progresiva.
- [Sin escrituras offline puede frustrar en cocinas sin cobertura] → el formulario de brew conserva el estado en memoria/localStorage hasta que haya conexión; cola de sync como evolución futura.
- [12 capacidades es un MVP ambicioso] → tasks.md ordena por valor: preparar (calculadora+timer) → catálogo+log → dial-in/cata → ranking/stats/compartir; cada hito deja una app usable.

## Migration Plan

Proyecto nuevo: no hay migración de datos. Despliegue de esquema vía Supabase
Management API (mismo flujo que plan-del-hambre, ver memoria del workspace);
migraciones SQL numeradas en `supabase/migrations/`. Rollback = revertir
migración; sin usuarios previos no hay riesgo de datos.

## Open Questions

- ¿Login con email magic link únicamente (como arranque mínimo) o también OAuth Google? → MVP: magic link; OAuth se añade sin tocar el modelo.
- Valores exactos de la ventana de frescura por método (espresso suele preferir 10–40 días post-tueste; filtro 4–30) → se fijan en `freshness.ts` al implementar, con tests.
