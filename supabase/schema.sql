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

-- Create Payment History table
create table payment_history (
  id bigint primary key generated always as identity,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  employee_id bigint references employees(id) on delete set null,
  recipient_address text not null,
  amount numeric not null,
  tx_hash text not null,
  chain text not null,
  status text not null default 'Paid'
);

-- Enable RLS
alter table payment_history enable row level security;

-- Create Policy: Allow Public Access (Hackathon Mode)
-- Create Policy: Allow Public Access (Hackathon Mode)
create policy "Allow Public Access on history"
on payment_history
for all
using (true)
with check (true);

-- Create Admin Allowlist Table
create table admins (
  id bigint primary key generated always as identity,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  wallet_address text not null unique,
  name text
);

-- Enable RLS
alter table admins enable row level security;

-- Create Policy
create policy "Public Read Admins"
on admins
for select
using (true);
