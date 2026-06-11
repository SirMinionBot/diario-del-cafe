# Tasks — mvp-diario-del-cafe

## 1. Scaffolding y fundaciones

- [x] 1.1 Scaffolding Vite + React 19 + TS con pnpm; ESLint, vitest y scripts (`dev`/`build`/`lint`/`test`) como en plan-del-hambre
- [x] 1.2 Tailwind 4 CSS-first: sistema de diseño «Carta de tostador» en `src/index.css` (paleta papel/espresso/caramelo, tipografías display serif + sans, cifras tabulares) y fuentes en `index.html`
- [x] 1.3 PWA: `vite-plugin-pwa` con manifest, iconos y precache del app shell
- [x] 1.4 Layout móvil con navegación inferior de 4 secciones (Preparar / Cafés / Diario / Perfil) y react-router
- [x] 1.5 CLAUDE.md del proyecto con comandos, arquitectura y convenciones

## 2. Supabase y auth

- [x] 2.1 Crear proyecto Supabase; cliente en `src/lib/supabase.ts` con variables de entorno
- [x] 2.2 Migración 001: tablas `coffees`, `coffee_bags`, `recipes`, `brews` con `user_id` y políticas RLS `auth.uid() = user_id`; bucket privado `brew-photos`
- [x] 2.3 Auth con magic link: pantalla de acceso, `useAuth`, guard de rutas y logout (spec `auth`)
- [x] 2.4 Desplegar migraciones vía Supabase Management API y verificar RLS con dos usuarios de prueba

## 3. Dominio puro (src/lib) + tests

- [x] 3.1 `methods.ts`: catálogo estático de métodos con defaults (espresso 1:2 / 25–30 s, V60 con fases, prensa, AeroPress, moka, cold brew) + tests (spec `brew-methods`)
- [x] 3.2 `ratio.ts`: calculadora inversa café⇄agua + tests (spec `ratio-calculator`)
- [x] 3.3 `freshness.ts`: días desde tueste y ventana óptima por familia de método + tests (spec `coffee-inventory`)
- [x] 3.4 `dialin.ts`: motor de reglas de ajuste (una variable por sugerencia, con explicación) + tests caso a caso (spec `dial-in-assistant`)
- [x] 3.5 `tasting.ts`: tipos, vocabulario de la rueda de sabores y validador del jsonb de cata + tests (spec `tasting-notes`)
- [x] 3.6 `caffeine.ts` y `stats.ts`: estimación de cafeína mg/g por método, gasto mensual derivado y ranking precio/calidad + tests (specs `consumption-stats`, `brand-ranking`)

## 4. Preparar: calculadora y cronómetro

- [x] 4.1 Pantalla Preparar: selector de método (y de café/receta) + calculadora inversa con ratio ajustable al vuelo, todo funcional offline
- [x] 4.2 Cronómetro simple basado en timestamps con rango objetivo visual para espresso (spec `brew-timer`)
- [x] 4.3 Cronómetro por fases para filtro: bloom/vertidos con agua acumulada, aviso visual + vibración
- [x] 4.4 Flujo «Registrar extracción» desde el cronómetro con tiempo precargado

## 5. Cafés: catálogo, recetas e inventario

- [x] 5.1 CRUD de cafés (nombre, marca, origen, tueste, precio/kg, notas) con archivado (spec `coffee-catalog`)
- [x] 5.2 Recetas por café y método que sobrescriben los defaults; integración con calculadora y cronómetro
- [x] 5.3 Inventario de paquetes: alta con fecha de tueste, apertura, terminar paquete; estado de frescura con `freshness.ts` (spec `coffee-inventory`)

## 6. Diario: brew log, cata y dial-in

- [x] 6.1 Formulario de registro de extracción (mínimo: café+método+dosis; precarga desde receta) y listado cronológico con filtros por café y método (spec `brew-log`)
- [x] 6.2 Foto opcional: compresión en cliente (~1280 px JPEG) y subida a `brew-photos`
- [x] 6.3 Sección de cata en el registro: 4 ejes 1–5 + rueda de descriptores; perfil sensorial agregado en la ficha del café (spec `tasting-notes`)
- [x] 6.4 Dial-in: etiqueta de sabor en el registro, sugerencia tras guardar y acción «guardar como receta» cuando el shot está equilibrado (spec `dial-in-assistant`)

## 7. Stats, ranking y compartir

- [x] 7.1 Pantalla de estadísticas: cafeína del día + histórico 7 días y gasto mensual por marca con avisos de datos excluidos (spec `consumption-stats`)
- [x] 7.2 Ranking de cafés por nota media y por precio/calidad con estados «sin valorar»/«sin precio» (spec `brand-ranking`)
- [x] 7.3 Tarjeta de receta a canvas + Web Share API con fallback a descarga (spec `recipe-sharing`)

## 8. Offline y cierre

- [x] 8.1 Runtime caching (stale-while-revalidate) para catálogo, recetas y últimos brews; aviso claro al escribir sin conexión y estado del formulario conservado
- [x] 8.2 Pasada de QA mobile: ergonomía a una mano, cronómetro con pantalla bloqueada, instalación PWA (verificado por el usuario en dispositivo real, 2026-06-11)
- [x] 8.3 `pnpm lint && pnpm test && pnpm build` en verde; README con setup y variables de entorno
