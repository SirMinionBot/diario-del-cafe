-- 001 — esquema inicial de diario-del-cafe
-- Modelo (design D2): coffees → coffee_bags / recipes → brews.
-- Todo es personal: RLS por user_id en todas las tablas, sin households.

-- ─── coffees: marca/café del usuario ────────────────────────────────────────
create table public.coffees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  roaster text,
  origin text,
  roast_level text check (roast_level in ('claro', 'medio', 'oscuro')),
  price_per_kg numeric(8, 2) check (price_per_kg > 0),
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

-- ─── coffee_bags: paquete físico con fecha de tueste ────────────────────────
create table public.coffee_bags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  coffee_id uuid not null references public.coffees (id) on delete cascade,
  roast_date date not null,
  weight_g integer not null check (weight_g > 0),
  opened_at date,
  finished_at date,
  created_at timestamptz not null default now()
);

-- ─── recipes: receta del usuario por (café, método); sobrescribe defaults ───
create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  coffee_id uuid not null references public.coffees (id) on delete cascade,
  method text not null, -- id del catálogo estático (src/lib/methods.ts)
  ratio numeric(5, 2) not null check (ratio > 0), -- gramos de agua/bebida por gramo de café
  dose_g numeric(5, 1) not null check (dose_g > 0),
  grind_setting text,
  water_temp_c integer check (water_temp_c between 1 and 100),
  target_time_s integer check (target_time_s > 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, coffee_id, method)
);

-- ─── brews: extracción registrada; la cata vive en tasting jsonb ────────────
create table public.brews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  coffee_id uuid not null references public.coffees (id) on delete cascade,
  bag_id uuid references public.coffee_bags (id) on delete set null,
  recipe_id uuid references public.recipes (id) on delete set null,
  method text not null,
  dose_g numeric(5, 1) not null check (dose_g > 0),
  water_g numeric(6, 1) check (water_g > 0), -- agua (filtro) o rendimiento en taza (espresso)
  grind_setting text,
  water_temp_c integer check (water_temp_c between 1 and 100),
  time_s integer check (time_s > 0),
  rating smallint check (rating between 1 and 5),
  taste_label text check (taste_label in ('acido', 'equilibrado', 'amargo')),
  tasting jsonb, -- validado solo a través de src/lib/tasting.ts
  notes text,
  photo_path text, -- ruta en el bucket brew-photos
  brewed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ─── índices para las consultas habituales ──────────────────────────────────
create index coffees_user_idx on public.coffees (user_id);
create index coffee_bags_user_idx on public.coffee_bags (user_id);
create index coffee_bags_coffee_idx on public.coffee_bags (coffee_id);
create index recipes_user_idx on public.recipes (user_id);
create index brews_user_brewed_idx on public.brews (user_id, brewed_at desc);
create index brews_coffee_idx on public.brews (coffee_id);

-- ─── RLS: cada usuario solo ve y toca lo suyo ───────────────────────────────
alter table public.coffees enable row level security;
alter table public.coffee_bags enable row level security;
alter table public.recipes enable row level security;
alter table public.brews enable row level security;

create policy "own coffees" on public.coffees
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own bags" on public.coffee_bags
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own recipes" on public.recipes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own brews" on public.brews
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── storage: bucket privado de fotos, una carpeta por usuario ──────────────
insert into storage.buckets (id, name, public)
values ('brew-photos', 'brew-photos', false);

create policy "own brew photos read" on storage.objects
  for select using (
    bucket_id = 'brew-photos' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "own brew photos write" on storage.objects
  for insert with check (
    bucket_id = 'brew-photos' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "own brew photos delete" on storage.objects
  for delete using (
    bucket_id = 'brew-photos' and (storage.foldername(name))[1] = auth.uid()::text
  );
