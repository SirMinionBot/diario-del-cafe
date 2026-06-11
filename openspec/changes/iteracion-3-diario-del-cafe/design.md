# Design — iteracion-3-diario-del-cafe

## Context

Tercera iteración sobre una base estable: 18 specs principales, dominio puro
testeado en `src/lib/`, design system token-céntrico en `src/index.css` y
tarjetas canvas en `shareCard.ts`. Las cuatro features son de pulido: ninguna
toca la base de datos ni añade dependencias.

## Goals / Non-Goals

**Goals:**

- Reducir a un toque el caso más frecuente («lo mismo de ayer»).
- Hacer visible el coste real por taza sin almacenar nada.
- Compartir una extracción con su cata tan fácil como ya se comparte una receta.
- Tema oscuro completo tocando solo tokens (validar la promesa del design system).

**Non-Goals:**

- Temas personalizables o más de dos esquemas (solo claro/oscuro/auto).
- Editar una extracción pasada desde «repetir» (precarga, no edición).
- Coste con histórico de precios (se usa el `price_per_kg` actual del café).
- Compartir como enlace público (sigue siendo imagen, design D6 de iteración 2).

## Decisions

### D1 — Tema oscuro por tokens con `data-theme` en `<html>`

Los colores ya viven como custom properties (`@theme`). El modo oscuro es un
bloque `[data-theme='dark'] { --color-paper: …; --color-ink: …; … }` en
`src/index.css` que invierte el papel (espresso profundo `#1d1713`) y la tinta
(crema `#ece2d3`), oscurece `card`/`crema` y suaviza sombras. Un hook
`useTheme` aplica el atributo en `<html>`, persiste la elección
(`localStorage: theme = auto|light|dark`), escucha `prefers-color-scheme`
cuando está en auto y sincroniza `<meta name="theme-color">`. Toggle de tres
estados en Perfil.

- *Alternativa descartada*: clase `dark:` de Tailwind por utilidad — obligaría a tocar todas las pantallas; el design system promete lo contrario (D8 del MVP).

### D2 — Repetir último: precarga explícita, nunca auto-registro

«Repetir» SOLO precarga Preparar (café, paquete si sigue activo, dosis, ratio
derivado de dosis/agua del brew, molinillo+ajuste y molienda); el usuario
sigue pasando por cronómetro y registro. Fuente: último brew por `brewed_at`.
El shortcut PWA apunta a `/?repetir=1`; Preparar lo consume una sola vez
(estado, no efecto repetido) y muestra un aviso de qué se ha precargado. Si el
café del último brew ya no existe o está archivado, se avisa y no se precarga.

### D3 — Coste por taza derivado en `stats.ts`

`brewCostEur(pricePerKg, doseG)` pura, redondeo a céntimos; `costByCoffee`
agrega nº de tazas, coste medio y total por café. El diario pinta el coste por
entrada cuando el café tiene precio; Perfil añade la tabla comparativa con los
cafés sin precio excluidos y contados (mismo patrón que el gasto mensual).
Nada se almacena (regla derivar-no-almacenar del proyecto).

### D4 — Tarjeta de cata: extensión de `shareCard.ts` con radar canvas

`shareBrewCard(input)` reutiliza el lienzo 1080×1350 y la cabecera de la
tarjeta de receta; el centro lo ocupa el radar de 4 ejes pintado con canvas 2D
(anillos + polígono relleno, misma geometría que el radar SVG del comparador)
y debajo los parámetros (método, dosis, ratio, tiempo, nota ⭐). Sin cata, la
tarjeta sale solo con parámetros. Botón 📤 en cada entrada del diario. Mismo
flujo Web Share API → fallback descarga; sin identificadores de cuenta.

## Risks / Trade-offs

- [Contraste insuficiente en oscuro (hairlines y `text-ink/45`)] → los bordes hairline y las opacidades se definen también como tokens en el bloque oscuro; revisión visual de las 9 pantallas en QA.
- [`theme-color` desincronizado al cambiar de tema] → el hook actualiza la meta en cada cambio; es mejora progresiva.
- [Repetir con datos huérfanos (café borrado, paquete terminado)] → precarga parcial con aviso de lo omitido (D2).
- [Radar canvas distinto del radar SVG del comparador] → la geometría se extrae a una función compartida de puntos para que ambos pinten idéntico.
- [Doble aplicación del shortcut `?repetir=1` en remontajes] → flag de una sola aplicación en estado del componente.

## Migration Plan

Sin migraciones de BD ni dependencias. Despliegue por el workflow de Pages
existente. Rollback = revert del commit.

## Open Questions

- Paleta oscura exacta (valores de `crema`/`caramel` sobre fondo espresso) → se afina visualmente al implementar, dentro del bloque de tokens.
- ¿El coste por taza usa la dosis o dosis+merma? → MVP: solo dosis (la merma de purgas no se registra).
