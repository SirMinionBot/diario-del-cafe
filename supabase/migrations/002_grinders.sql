-- 002 — molinillos (iteracion-2, spec grinder-profiles)
-- Aditiva: no toca datos existentes. grind_setting (texto libre) convive con
-- la nueva referencia molinillo + ajuste numérico.

create table public.grinders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  min_setting numeric(6, 1),
  max_setting numeric(6, 1),
  step numeric(4, 1) default 1 check (step > 0),
  created_at timestamptz not null default now(),
  check (
    (min_setting is null and max_setting is null)
    or (min_setting is not null and max_setting is not null and max_setting > min_setting)
  )
);

create index grinders_user_idx on public.grinders (user_id);

alter table public.grinders enable row level security;
create policy "own grinders" on public.grinders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- referencia opcional desde recetas y extracciones (spec: borrar molinillo → set null)
alter table public.recipes
  add column grinder_id uuid references public.grinders (id) on delete set null,
  add column grind_value numeric(6, 1);

alter table public.brews
  add column grinder_id uuid references public.grinders (id) on delete set null,
  add column grind_value numeric(6, 1);
