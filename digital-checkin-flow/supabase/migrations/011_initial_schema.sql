-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Reservations table (simulates a PMS-maintained source of truth)
create table reservations (
  id uuid primary key default uuid_generate_v4(),
  guest_name text not null,
  guest_email text,
  arrival_date date not null,
  departure_date date not null,
  room_type text not null,
  status text not null default 'confirmed' check (status in ('confirmed','checked_in','in_house','checked_out')),
  pms_id text unique, -- external ID from the actual PMS
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Check-in sessions (unique links)
create table checkin_sessions (
  token uuid primary key default uuid_generate_v4(),
  reservation_id uuid references reservations(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

-- Identity verification records
create table identity_verifications (
  id uuid primary key default uuid_generate_v4(),
  reservation_id uuid references reservations(id) on delete cascade,
  document_url text,
  status text not null default 'pending' check (status in ('pending','verified','rejected')),
  kyc_provider_ref text,
  verified_at timestamptz,
  created_at timestamptz default now()
);

-- Guest preferences
create table preferences (
  reservation_id uuid primary key references reservations(id) on delete cascade,
  floor_preference text,
  bed_type text,
  amenities text[],
  special_requests text,
  updated_at timestamptz default now()
);

-- QR tokens (digital keys)
create table qr_tokens (
  token uuid primary key default uuid_generate_v4(),
  reservation_id uuid references reservations(id) on delete cascade,
  issued_at timestamptz default now(),
  expires_at timestamptz not null,
  used boolean default false,
  revoked boolean default false
);

-- Create a guest user role (simulated; for RLS we'll use anon access with a guest_id cookie)
-- For simplicity, we'll rely on reservation_id being validated via the checkin session token.
-- RLS policies will allow access based on a 'reservation_id' claim in the JWT, but we'll keep it simple:
-- The API routes will handle authorization using the service role. We'll add a helper table.

-- Enable RLS on all tables
alter table reservations enable row level security;
alter table checkin_sessions enable row level security;
alter table identity_verifications enable row level security;
alter table preferences enable row level security;
alter table qr_tokens enable row level security;

-- Create a secure function to get reservation by session token (used in API routes)
create or replace function get_reservation_from_session(token_uuid uuid)
returns table (reservation_id uuid, guest_name text, arrival_date date, departure_date date, room_type text, status text)
language sql
security definer
as $$
  select r.id, r.guest_name, r.arrival_date, r.departure_date, r.room_type, r.status
  from checkin_sessions cs
  join reservations r on r.id = cs.reservation_id
  where cs.token = token_uuid and cs.expires_at > now();
$$;

-- Indexes
create index idx_checkin_sessions_token on checkin_sessions(token);
create index idx_qr_tokens_token on qr_tokens(token);
