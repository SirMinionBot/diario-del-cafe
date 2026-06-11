# Proposal — mvp-diario-del-cafe

## Why

Los aficionados al café de especialidad ajustan a mano ratios, tiempos y molienda, y pierden lo aprendido entre cafés: qué ratio funcionó con qué marca, cuándo se abrió el paquete o cómo supo aquel V60. **diario-del-cafe** es una PWA mobile-first que actúa como cuaderno de barista en el bolsillo: ratios por defecto fiables, recetas propias por café y un registro de resultados que convierte cada extracción en conocimiento reutilizable.

## What Changes

Aplicación nueva desde cero (no hay código previo), heredando el stack y las convenciones de `plan-del-hambre`:

- **Stack**: React 19 + Vite + TypeScript + Tailwind 4 (config CSS-first) + Supabase (auth, Postgres con RLS, Storage para fotos) + PWA offline-first con `vite-plugin-pwa`. Gestión con `pnpm`. Lógica pura y testeable en `src/lib/` (vitest), sin librerías de estado ni de componentes.
- **Métodos de preparación** con ratios por defecto: espresso (1:2, 25–30 s), V60, prensa francesa, AeroPress, moka y cold brew.
- **Calculadora inversa de ratio**: introduces gramos de café O de agua y obtienes el resto según el ratio activo.
- **Catálogo de cafés/marcas** del usuario, cada uno con sus ratios ajustados que sobrescriben los valores por defecto del método.
- **Inventario de paquetes** con fecha de tueste, días transcurridos y ventana óptima de consumo.
- **Cronómetro de extracción**: modo simple para espresso (objetivo 25–30 s) y modo por fases para filtro (bloom + vertidos).
- **Registro de extracciones (brew log)** con parámetros, resultado, anotaciones y foto opcional.
- **Asistente dial-in**: a partir del shot registrado (tiempo, peso, sabor) sugiere afinar la molienda más fina o más gruesa.
- **Cata sensorial** con rueda de sabores (acidez, cuerpo, dulzor, amargor + descriptores).
- **Ranking personal de marcas**: puntuación media, precio por kg vs nota.
- **Recetas compartibles**: exportar una receta como tarjeta/link.
- **Estadísticas de consumo**: cafeína diaria estimada y gasto mensual por marca.

## Capabilities

### New Capabilities

- `auth`: cuentas de usuario con Supabase Auth; todos los datos son personales y protegidos por RLS.
- `brew-methods`: catálogo de métodos de preparación con ratio, temperatura y tiempo por defecto de cada uno.
- `ratio-calculator`: calculadora inversa café⇄agua basada en el ratio del método o de la receta activa.
- `coffee-catalog`: CRUD de cafés/marcas del usuario con ratios y parámetros propios por método.
- `coffee-inventory`: paquetes con fecha de tueste, estado de frescura y aviso de ventana óptima.
- `brew-timer`: cronómetro simple y por fases (bloom/vertidos) con avisos.
- `brew-log`: registro de extracciones con parámetros, valoración, notas y foto.
- `dial-in-assistant`: sugerencias de ajuste de molienda derivadas del último shot registrado.
- `tasting-notes`: cata sensorial con ejes (acidez, cuerpo, dulzor, amargor) y rueda de descriptores.
- `brand-ranking`: comparador de marcas por puntuación media y relación precio/calidad.
- `recipe-sharing`: exportación de recetas como tarjeta compartible.
- `consumption-stats`: cafeína estimada por día y gasto agregado por mes y marca.

### Modified Capabilities

_(ninguna — proyecto nuevo, no existen specs previas)_

## Impact

- **Código**: proyecto nuevo en `/home/remoteLab/proyectos/diario-del-cafe`; scaffolding Vite + React + TS completo.
- **Infraestructura**: nuevo proyecto Supabase (tablas con RLS por `user_id`, Storage para fotos); despliegue de migraciones vía Management API (mismo flujo que plan-del-hambre).
- **Dependencias**: las mismas familias que plan-del-hambre (`@supabase/supabase-js`, Tailwind 4, `vite-plugin-pwa`/workbox, vitest); no se prevén dependencias exóticas.
- **Diseño**: mobile-first estricto; sistema de diseño propio definido en `src/index.css` (la estética se decide en design.md).
