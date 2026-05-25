create extension if not exists citext;
create extension if not exists pgcrypto;

create table if not exists public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique default ('WM-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))),
  full_name text not null,
  email citext not null unique,
  phone text,
  user_type text not null,
  main_channel text not null,
  country text not null default 'Nigeria',
  city text,
  use_case text,
  average_transaction_value text,
  consent boolean not null default false,
  source text not null default 'meduman-web',
  user_agent text,
  created_at timestamptz not null default now(),
  constraint waitlist_entries_consent_required check (consent = true),
  constraint waitlist_entries_email_shape check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint waitlist_entries_user_type_check check (
    user_type in ('Buyer', 'Seller', 'Freelancer', 'Business', 'Both buyer and seller')
  ),
  constraint waitlist_entries_main_channel_check check (
    main_channel in ('WhatsApp', 'Instagram', 'Facebook Marketplace', 'Telegram', 'Other')
  )
);

alter table public.waitlist_entries enable row level security;

revoke all on table public.waitlist_entries from anon, authenticated;
grant insert (
  full_name,
  email,
  phone,
  user_type,
  main_channel,
  country,
  city,
  use_case,
  average_transaction_value,
  consent,
  source,
  user_agent
) on table public.waitlist_entries to anon, authenticated;

drop policy if exists "Public waitlist submissions can be inserted" on public.waitlist_entries;
create policy "Public waitlist submissions can be inserted"
  on public.waitlist_entries
  for insert
  to anon, authenticated
  with check (
    consent = true
    and full_name <> ''
    and email is not null
    and user_type in ('Buyer', 'Seller', 'Freelancer', 'Business', 'Both buyer and seller')
    and main_channel in ('WhatsApp', 'Instagram', 'Facebook Marketplace', 'Telegram', 'Other')
  );

create index if not exists waitlist_entries_created_at_idx
  on public.waitlist_entries (created_at desc);

create index if not exists waitlist_entries_user_type_idx
  on public.waitlist_entries (user_type);

create index if not exists waitlist_entries_country_idx
  on public.waitlist_entries (country);
