# Proposal — iteracion-3-diario-del-cafe

## Why

Con dos iteraciones en producción, el coste del día a día ya no está en las funciones sino en la fricción y el contexto: cada mañana se reintroduce a mano «lo mismo de ayer», el primer café se prepara con una pantalla blanca deslumbrante, los mejores shots no se pueden presumir con su cata, y con cafés de 17 a 130 €/kg nadie sabe cuánto cuesta realmente cada taza. Esta iteración es de pulido de alto impacto: cero dependencias nuevas, todo deriva de datos y de infraestructura que ya existen.

## What Changes

- **Repetir última extracción con 1 toque**: botón en Preparar (y shortcut PWA «Repetir último») que precarga café, paquete, dosis, molienda/molinillo y ratio del último brew registrado.
- **Coste por taza**: derivado al vuelo de `price_per_kg × dose_g` — coste de cada extracción visible en el diario, acumulado por café y comparación entre cafés en las estadísticas.
- **Tarjeta de cata compartible**: exportar una extracción como tarjeta-imagen (parámetros + radar sensorial de 4 ejes pintado en canvas), por Web Share API con fallback a descarga, reutilizando la infraestructura de la tarjeta de receta.
- **Modo oscuro**: variante nocturna del design system «Carta de tostador» (papel→espresso profundo, tinta→crema) implementada SOLO con tokens en `src/index.css`; sigue la preferencia del sistema con toggle manual en Perfil (auto/claro/oscuro persistido).

## Capabilities

### New Capabilities

- `quick-repeat`: precarga con un toque de los parámetros de la última extracción en Preparar, incluido el acceso directo PWA.
- `dark-mode`: tema oscuro del sistema de diseño con preferencia del sistema, toggle manual y persistencia local.

### Modified Capabilities

- `consumption-stats`: nuevos requisitos de coste por taza — coste de cada extracción y agregados por café, siempre derivados, con exclusión señalada de cafés sin precio.
- `recipe-sharing`: nueva tarjeta de extracción (parámetros + radar de cata) junto a la existente de receta; mismas garantías (sin URLs públicas, Web Share con fallback).
- `brew-log`: el diario muestra el coste estimado de cada extracción cuando el café tiene precio.

## Impact

- **Código**: lógica pura nueva mínima (`brewCost` en `stats.ts` o módulo propio; selector de tema); `shareCard.ts` se extiende con el render del radar; `Preparar`/`BrewNueva` ganan la precarga; `manifest` gana un shortcut. Sin migraciones de BD.
- **Dependencias**: ninguna nueva.
- **Diseño**: `src/index.css` define los tokens del tema oscuro (la promesa del design system D8: cambiar la estética sin tocar pantallas); `index.html` ajusta `theme-color` dinámico.
- **Specs**: 2 nuevas + 3 deltas sobre las 18 existentes.
