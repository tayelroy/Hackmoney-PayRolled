-- Create the table
create table employees (
  id bigint primary key generated always as identity,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  wallet_address text not null,
  salary numeric not null default 0,
  status text not null default 'Active'
);

-- Enable Row Level Security (RLS)
alter table employees enable row level security;

-- Create Policy: Allow Public Read/Write (Hackathon Mode)
-- WARN: In production, you'd restrict this to authenticated users only!
create policy "Allow Public Access"
on employees
for all
using (true)
with check (true);
