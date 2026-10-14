-- Casinia Pizza Pub: comenzi online și rezervări.
-- Accesul se face doar de pe server, cu cheia service_role. RLS e activ și fără politici publice,
-- deci cheia publică (anon) nu poate citi sau scrie nimic.

create type public.request_status as enum ('new', 'confirmed', 'done', 'cancelled');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status public.request_status not null default 'new',
  locale text not null check (locale in ('ro', 'ru', 'en')),
  name text not null check (char_length(name) between 2 and 80),
  phone text not null check (char_length(phone) between 8 and 16),
  method text not null check (method in ('pickup', 'delivery')),
  address text,
  scheduled_time text,
  payment text not null check (payment in ('cash', 'card')),
  notes text,
  items jsonb not null check (jsonb_typeof(items) = 'array'),
  total integer not null check (total > 0),
  constraint delivery_needs_address check (method = 'pickup' or address is not null)
);

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status public.request_status not null default 'new',
  locale text not null check (locale in ('ro', 'ru', 'en')),
  name text not null check (char_length(name) between 2 and 80),
  phone text not null check (char_length(phone) between 8 and 16),
  email text,
  date date not null,
  time text not null check (time ~ '^\d{2}:\d{2}$'),
  guests smallint not null check (guests between 1 and 50),
  notes text
);

create index orders_created_at_idx on public.orders (created_at desc);
create index orders_status_idx on public.orders (status);
create index reservations_date_idx on public.reservations (date, time);
create index reservations_status_idx on public.reservations (status);

alter table public.orders enable row level security;
alter table public.reservations enable row level security;
