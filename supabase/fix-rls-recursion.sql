-- FIX: RLS infinite recursion (error 42P17)
-- Run this ENTIRE block in Supabase SQL Editor → New Query → Run

-- Step 1: Drop ALL existing policies on ALL tables
do $$
declare
  r record;
begin
  for r in (
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
  ) loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- Step 2: Drop old helper functions if they exist
drop function if exists public.own_wedding_ids();
drop function if exists public.guest_wedding_ids();

-- Step 3: Create SECURITY DEFINER helper functions (bypass RLS, breaks circular refs)
create or replace function public.own_wedding_ids()
returns setof uuid as $$
  select id from public.weddings where user_id = auth.uid()
$$ language sql security definer stable;

create or replace function public.guest_wedding_ids()
returns setof uuid as $$
  select wedding_id from public.guest_seats where guest_user_id = auth.uid()
$$ language sql security definer stable;

-- Step 4: Recreate ALL policies using helper functions

-- Profiles
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Weddings
create policy "Users can view own weddings" on public.weddings
  for select using (user_id = auth.uid());
create policy "Guests can view shared weddings" on public.weddings
  for select using (id in (select public.guest_wedding_ids()));
create policy "Users can insert own weddings" on public.weddings
  for insert with check (user_id = auth.uid());
create policy "Users can update own weddings" on public.weddings
  for update using (user_id = auth.uid());
create policy "Users can delete own weddings" on public.weddings
  for delete using (user_id = auth.uid());

-- Flights
create policy "Users can view flights for their weddings" on public.flights
  for select using (wedding_id in (select public.own_wedding_ids()));
create policy "Guests can view shared flights" on public.flights
  for select using (wedding_id in (select public.guest_wedding_ids()));
create policy "Users can manage flights for own weddings" on public.flights
  for insert with check (wedding_id in (select public.own_wedding_ids()));
create policy "Users can update flights for own weddings" on public.flights
  for update using (wedding_id in (select public.own_wedding_ids()));
create policy "Users can delete flights for own weddings" on public.flights
  for delete using (wedding_id in (select public.own_wedding_ids()));

-- Price history
create policy "Users can view price history" on public.price_history
  for select using (
    flight_id in (
      select f.id from public.flights f
      where f.wedding_id in (select public.own_wedding_ids())
    )
  );
create policy "Service can insert price history" on public.price_history
  for insert with check (true);

-- Guest seats
create policy "Owner can manage guest seats" on public.guest_seats
  for all using (wedding_id in (select public.own_wedding_ids()));
create policy "Guest can view their seat" on public.guest_seats
  for select using (invited_email = auth.email());
