# Diario del Café ☕

Cuaderno de barista mobile-first (PWA): ratios por defecto fiables, recetas
propias por café, cronómetro de extracción y un diario de resultados que
convierte cada café en conocimiento reutilizable.

## Funcionalidades

- **Preparar**: calculadora inversa café⇄agua con ratio ajustable y cronómetro
  (simple para espresso con rango objetivo 25–30 s; por fases con bloom y
  vertidos para filtro). Funciona 100 % offline.
- **Cafés**: catálogo de marcas con recetas propias por método (sobrescriben
  los defaults), inventario de paquetes con fecha de tueste y ventana óptima
  de frescura.
- **Diario**: registro de extracciones con valoración, cata sensorial (4 ejes +
  rueda de sabores), foto comprimida en cliente y **asistente dial-in** que
  sugiere el siguiente ajuste de molienda.
- **Perfil**: cafeína estimada por día, gasto mensual derivado de paquetes,
  ranking personal por nota y por precio/calidad.
- **Compartir**: cualquier receta se exporta como tarjeta-imagen (Web Share
  API con fallback a descarga), sin URLs públicas.

### Iteración 2

- **Offline de verdad**: las extracciones sin red se encolan (IndexedDB) y se
  sincronizan solas al volver la conexión.
- **Escáner de etiquetas**: OCR en el dispositivo (tesseract.js) que
  prerellena marca, origen y fecha de tueste.
- **Inventario predictivo**: cada brew descuenta del paquete; gramos/dosis
  restantes y «se acaba en ~N días, al ritmo actual».
- **Molinillos**: perfiles con rango y traducción aproximada de ajustes entre
  molinillos.
- **Recetas de referencia**: catálogo de recetas famosas (Hoffmann V60,
  AeroPress de campeonato…) para usar o forkear.
- **Comparador A/B**: dos extracciones lado a lado con radar de cata
  superpuesto.
- **Backup**: exportar JSON/CSV e importar tu propio backup.

## Stack

React 19 + Vite + TypeScript + Tailwind 4 (CSS-first) + Supabase (auth magic
link, Postgres con RLS por usuario, Storage) + PWA (`vite-plugin-pwa`,
runtime caching para lecturas). Lógica de dominio pura y testeada en
`src/lib/` (vitest). Gestión con pnpm.

## Setup

```bash
pnpm install
cp .env.example .env   # rellena URL y anon key de tu proyecto Supabase
pnpm dev
```

Variables de entorno (ver `.env.example`):

| Variable | Uso |
| --- | --- |
| `VITE_SUPABASE_URL` | URL del proyecto (cliente) |
| `VITE_SUPABASE_ANON_KEY` | anon key (cliente) |
| `SUPABASE_ACCESS_TOKEN` | Management API, solo tooling/migraciones |
| `SUPABASE_DB_PASS` | contraseña de BD generada al crear el proyecto |

Migraciones en `supabase/migrations/`; se aplican vía Management API
(`POST /v1/projects/{ref}/database/query`). Iconos PWA:
`node scripts/gen-icons.mjs`.

## Comandos

```bash
pnpm dev / build / preview
pnpm lint
pnpm test   # vitest, lógica de dominio
```

## Documentación de diseño

Especificaciones OpenSpec del MVP (proposal, design, 12 specs, tasks) en
`openspec/changes/mvp-diario-del-cafe/`.
