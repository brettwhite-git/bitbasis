-- Create fear_greed_index table
create table if not exists public.fear_greed_index (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  value integer not null,
  classification text not null,
  last_updated timestamp with time zone not null
);

-- Enable RLS
alter table public.fear_greed_index enable row level security;

-- Create policy to allow all users to read
create policy "Allow all users to read fear_greed_index"
  on public.fear_greed_index
  for select
  using (true);

-- Create policy to allow authenticated users to insert/update
create policy "Allow authenticated users to insert/update fear_greed_index"
  on public.fear_greed_index
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated'); 