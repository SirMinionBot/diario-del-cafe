# Tasks — iteracion-2-diario-del-cafe

## 1. Base de datos y dominio puro

- [x] 1.1 Migración 002: tabla `grinders` con RLS + columnas `grinder_id` (set null) en `recipes` y `brews`; aplicar vía Management API y verificar
- [x] 1.2 `inventory.ts`: gramos restantes derivados, dosis restantes y predicción de fin con ventana de 14 días + tests (spec `coffee-inventory` delta)
- [x] 1.3 `grinders.ts`: traducción lineal de ajustes entre rangos con redondeo al paso, casos sin rango + tests (spec `grinder-profiles`)
- [x] 1.4 `referenceRecipes.ts`: catálogo estático (6–8 recetas: Hoffmann V60, espresso clásico 1:2, AeroPress campeonato, prensa inmersión, moka, cold brew) + tests (spec `reference-recipes`)
- [x] 1.5 `ocrParse.ts`: parser puro de texto OCR (fechas es-ES, candidatos a marca/origen, matching difuso contra tostadores conocidos) + tests (spec `label-scanner`)
- [x] 1.6 `exporter.ts`: serialización JSON v1 + CSV de brews; validador/remapeador de import con regeneración de ids + tests (spec `data-export`)

## 2. Cola offline

- [x] 2.1 `offlineQueue.ts`: wrapper IndexedDB nativo (encolar, listar, eliminar) con detección de disponibilidad + tests con fake-indexeddb o interfaz inyectable
- [x] 2.2 Integrar en BrewNueva: fallo de red → encolar con UUID de cliente y confirmar «pendiente de sincronizar» (spec `offline-sync`)
- [x] 2.3 Sincronizador: reintento al evento `online` y al arrancar; conflicto de PK = sincronizado; indicador de pendientes en el Diario
- [x] 2.4 Diario: mezclar pendientes locales con marca visual

## 3. Inventario predictivo y molinillos (UI)

- [x] 3.1 CafeDetalle/Cafés: gramos y dosis restantes por paquete + predicción «al ritmo actual»
- [x] 3.2 BrewNueva: selector de paquete con preselección del activo en ventana óptima
- [x] 3.3 Pantalla de molinillos en Perfil (CRUD) y selector molinillo+ajuste en receta y brew
- [x] 3.4 Traductor de ajustes: UI «de molinillo A a B» accesible desde la pantalla de molinillos

## 4. OCR, referencias y comparador (UI)

- [x] 4.1 «Escanear etiqueta» en alta de café/paquete: import dinámico de tesseract.js, spinner de progreso, prerelleno editable
- [x] 4.2 Recetas de referencia: lista desde Preparar, «Usar» (precarga) y «Guardar para…» (fork a café elegido)
- [x] 4.3 Modo comparar en Diario (selección de 2) + vista A/B con diferencias resaltadas
- [x] 4.4 Radar SVG de 4 ejes superpuesto en la comparación (con caso de cata ausente)

## 5. Backup (UI) y cierre

- [x] 5.1 Perfil: exportar JSON, exportar CSV e importar JSON con resumen del resultado
- [x] 5.2 `pnpm lint && pnpm test && pnpm build` en verde; actualizar CLAUDE.md y README con las novedades
- [ ] 5.3 Commit + push (deploy automático a Pages) y QA en móvil: cola offline en modo avión, OCR con un paquete real, comparador
- [x] 5.4 Import con reemplazo opcional: confirmación explícita, borrado en cascada (cafés→paquetes/recetas/brews, molinillos, fotos del bucket) solo tras validar el fichero (spec `data-export`)
