# Tasks — iteracion-3-diario-del-cafe

## 1. Dominio puro y tema

- [x] 1.1 `stats.ts`: `brewCostEur` (céntimos) y `costByCoffee` (tazas, medio, total, excluidos) + tests (delta `consumption-stats`)
- [x] 1.2 Tokens del tema oscuro en `src/index.css` (`[data-theme='dark']`: papel espresso, tinta crema, card/crema/hairline/sombras) cuidando contraste (spec `dark-mode`)
- [x] 1.3 `useTheme` + provider mínimo: persistencia `localStorage`, modo auto con `prefers-color-scheme` en vivo, sincronización de `<meta name="theme-color">`
- [x] 1.4 Selector de tres estados (auto/claro/oscuro) en Perfil

## 2. Repetir último

- [x] 2.1 Carga del último brew en Preparar: botón «↻ Repetir último» con resumen de lo precargado; manejo de café archivado/inexistente y paquete terminado con aviso (spec `quick-repeat`)
- [x] 2.2 Precarga completa: café, paquete activo, dosis, ratio derivado, molienda y molinillo/ajuste (estos dos últimos viajan al registro)
- [x] 2.3 Shortcut PWA «Repetir último» (`/?repetir=1`) consumido una sola vez

## 3. Coste y tarjeta de cata

- [x] 3.1 Diario: coste estimado por entrada cuando hay precio (delta `brew-log`)
- [x] 3.2 Perfil: comparativa de coste por café (tazas, medio, total) con excluidos contados
- [x] 3.3 Geometría del radar extraída a función compartida (puntos por eje/valor) usada por el SVG del comparador y el canvas de la tarjeta
- [x] 3.4 `shareBrewCard` en `shareCard.ts`: tarjeta con parámetros + radar canvas (sin cata → solo parámetros); botón 📤 por entrada del diario (delta `recipe-sharing`)

## 4. Cierre

- [x] 4.1 `pnpm lint && pnpm test && pnpm build` en verde; CLAUDE.md y README actualizados
- [ ] 4.2 Commit + push (deploy) y QA: las 9 pantallas en oscuro, repetir desde shortcut, compartir tarjeta con y sin cata
