-- MyWeddingTrips Database Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Users profile (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  display_name text,
  created_at timestamptz default now() not null
);

-- Weddings
create table public.weddings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  couple_name text not null,
  date date not null,
  location text not null,
  venue text,
  flight_status text default 'not_started' check (flight_status in ('not_started','watching','booked','done')),
  hotel_status text default 'not_started' check (hotel_status in ('not_started','watching','booked','done')),
  gift_status text default 'not_started' check (gift_status in ('not_started','watching','booked','done')),
  hotel_details text,
  gift_details text,
  notes text,
  color text not null,
  created_at timestamptz default now() not null
);

-- Flight info per wedding
create table public.flights (
  id uuid default uuid_generate_v4() primary key,
  wedding_id uuid references public.weddings(id) on delete cascade not null unique,
  origin text not null, -- airport code
  destination text not null, -- airport code
  departure_date date not null,
  return_date date not null,
  price_paid numeric,
  price_threshold numeric,
  created_at timestamptz default now() not null
);

-- Price history for flight tracking
create table public.price_history (
  id uuid default uuid_generate_v4() primary key,
  flight_id uuid references public.flights(id) on delete cascade not null,
  price numeric not null,
  recorded_at timestamptz default now() not null
);

-- Guest seats (one free guest per wedding)
create table public.guest_seats (
  id uuid default uuid_generate_v4() primary key,
  wedding_id uuid references public.weddings(id) on delete cascade not null,
  invited_email text not null,
  accepted boolean default false,
  guest_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null,
  unique(wedding_id) -- one guest seat per wedding
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.weddings enable row level security;
alter table public.flights enable row level security;
alter table public.price_history enable row level security;
alter table public.guest_seats enable row level security;

-- Profiles: users can read/update their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Weddings: users see their own + weddings they're a guest on
create policy "Users can view own weddings" on public.weddings
  for select using (
    user_id = auth.uid()
    or id in (select wedding_id from public.guest_seats where guest_user_id = auth.uid())
  );
create policy "Users can insert own weddings" on public.weddings
  for insert with check (user_id = auth.uid());
create policy "Users can update own weddings" on public.weddings
  for update using (user_id = auth.uid());
create policy "Users can delete own weddings" on public.weddings
  for delete using (user_id = auth.uid());

-- Flights: follow wedding access
create policy "Users can view flights for their weddings" on public.flights
  for select using (
    wedding_id in (select id from public.weddings where user_id = auth.uid())
    or wedding_id in (select wedding_id from public.guest_seats where guest_user_id = auth.uid())
  );
create policy "Users can manage flights for own weddings" on public.flights
  for insert with check (wedding_id in (select id from public.weddings where user_id = auth.uid()));
create policy "Users can update flights for own weddings" on public.flights
  for update using (wedding_id in (select id from public.weddings where user_id = auth.uid()));
create policy "Users can delete flights for own weddings" on public.flights
  for delete using (wedding_id in (select id from public.weddings where user_id = auth.uid()));

-- Price history: follow flight access
create policy "Users can view price history" on public.price_history
  for select using (
    flight_id in (
      select f.id from public.flights f
      join public.weddings w on f.wedding_id = w.id
      where w.user_id = auth.uid()
    )
  );
create policy "Service can insert price history" on public.price_history
  for insert with check (true); -- API route handles auth

-- Guest seats: wedding owner manages, guest can view
create policy "Owner can manage guest seats" on public.guest_seats
  for all using (
    wedding_id in (select id from public.weddings where user_id = auth.uid())
  );
create policy "Guest can view their seat" on public.guest_seats
  for select using (guest_user_id = auth.uid() or invited_email = auth.email());

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
