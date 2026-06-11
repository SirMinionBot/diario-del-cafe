# Proposal — iteracion-2-diario-del-cafe

## Why

El MVP (desplegado y en uso) convierte cada extracción en conocimiento, pero aún depende de tener cobertura junto a la cafetera, de teclear a mano los datos del paquete y de la memoria del usuario para saber cuánto café queda o qué ajuste funcionaba en otro molinillo. La iteración 2 convierte el cuaderno en **coach**: funciona sin red de verdad, entiende los paquetes por foto, predice cuándo se acaba el grano, traduce ajustes entre molinillos, trae recetas de referencia y permite comparar extracciones lado a lado — sin perder nunca los datos del usuario (backup).

## What Changes

Sobre la base existente (React 19 + Supabase + PWA, dominio puro en `src/lib/`):

- **Cola de escrituras offline**: registrar extracciones sin conexión; se encolan en IndexedDB y se sincronizan automáticamente al recuperar red (elimina el non-goal del MVP).
- **Escáner de etiquetas (OCR)**: foto al paquete → tesseract.js extrae marca/origen/fecha de tueste y autorrellena el alta de café/paquete (patrón ya probado en plan-del-hambre con tickets).
- **Importar/exportar**: backup completo (cafés, recetas, paquetes, brews) a JSON y export tabular CSV de brews; importación del JSON propio.
- **Inventario predictivo**: cada brew con paquete asociado descuenta su dosis; la app muestra gramos/dosis restantes y predice la fecha de fin según el ritmo de consumo. **El formulario de brew preselecciona el paquete activo en ventana óptima.**
- **Perfil de molinillo**: CRUD de molinillos (modelo, rango de ajuste); recetas y brews pueden referenciar molinillo, y la app traduce aproximadamente un ajuste entre dos molinillos por proporción de rango.
- **Recetas de referencia**: catálogo estático de recetas famosas (V60 Hoffmann, espresso clásico, AeroPress de campeonato…) de solo lectura; «usarla» la precarga en Preparar y «guardarla» la forkea como receta propia de un café.
- **Comparador A/B**: seleccionar dos extracciones y verlas lado a lado (parámetros + radar de cata superpuesto con los 4 ejes).

## Capabilities

### New Capabilities

- `offline-sync`: cola de escrituras en IndexedDB con sincronización al recuperar conexión e indicador de pendientes.
- `label-scanner`: OCR en cliente sobre fotos de etiquetas para autorrellenar café y paquete.
- `data-export`: exportación JSON/CSV e importación del backup propio.
- `grinder-profiles`: molinillos del usuario, referencia desde recetas/brews y traducción aproximada de ajustes.
- `reference-recipes`: catálogo estático de recetas de referencia con precarga y fork a receta propia.
- `brew-compare`: comparación A/B de dos extracciones con radar sensorial superpuesto.

### Modified Capabilities

- `coffee-inventory`: nuevos requisitos de inventario vivo — descuento de dosis por brew, gramos/dosis restantes y predicción de fecha de fin; preselección del paquete activo al registrar.

## Impact

- **BD (migración 002)**: tabla `grinders` (RLS por usuario); columnas `grinder_id` en `recipes` y `brews`. Sin cambios en tablas existentes para el resto (el inventario se deriva de `brews.bag_id` + `dose_g`, que ya existen).
- **Dependencias nuevas**: `tesseract.js` (OCR en cliente); IndexedDB vía API nativa (sin librería).
- **Código**: nuevos módulos puros `src/lib/` (inventory, grinders, referenceRecipes, exporter, ocrParse) con tests; cola offline en `src/lib/offlineQueue.ts`; pantallas nuevas (comparador, molinillos, import/export) y retoques en BrewNueva/CafeDetalle/Preparar.
- **Sin impacto** en auth, RLS existente ni despliegue (mismo workflow de Pages).
