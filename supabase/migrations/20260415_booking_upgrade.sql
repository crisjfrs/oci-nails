alter table public.bookings
  add column if not exists service_id text,
  add column if not exists service_duration_minutes integer,
  add column if not exists service_price_label text,
  add column if not exists end_time time,
  add column if not exists status text default 'confirmed',
  add column if not exists source text default 'website',
  add column if not exists calendar_event_id text,
  add column if not exists calendar_sync_status text default 'pending',
  add column if not exists calendar_sync_error text,
  add column if not exists updated_at timestamptz default now();

update public.bookings
set service_id = case
  when service ilike 'Manicure + Gel Color%' then 'manicure-gel'
  when service ilike 'Manicure%' then 'manicure'
  when service ilike 'Pedicure + Gel Color%' then 'pedicure-gel'
  when service ilike 'Pedicure%' then 'pedicure'
  when service ilike 'Press On Nails Custom%' then 'press-on-custom'
  when service ilike 'Remove Gel/Extension%' then 'remove-gel-extension'
  else service_id
end
where service_id is null;

update public.bookings
set service_duration_minutes = case service_id
  when 'manicure' then 60
  when 'manicure-gel' then 120
  when 'pedicure' then 60
  when 'pedicure-gel' then 120
  when 'press-on-custom' then 120
  when 'remove-gel-extension' then 60
  else coalesce(service_duration_minutes, 60)
end
where service_duration_minutes is null;

update public.bookings
set service_price_label = case service_id
  when 'manicure' then 'Rp30.000'
  when 'manicure-gel' then 'Rp60.000 - Rp300.000'
  when 'pedicure' then 'Rp30.000'
  when 'pedicure-gel' then 'Rp60.000 - Rp300.000'
  when 'press-on-custom' then 'Rp50.000 - Rp300.000'
  when 'remove-gel-extension' then 'Rp30.000 - Rp40.000'
  else coalesce(service_price_label, service)
end
where service_price_label is null;

update public.bookings
set end_time = ((time::time + make_interval(mins => coalesce(service_duration_minutes, 60)))::time)
where end_time is null
  and time is not null;

update public.bookings
set status = coalesce(status, 'confirmed'),
    source = coalesce(source, 'website'),
    calendar_sync_status = coalesce(calendar_sync_status, 'pending'),
    updated_at = coalesce(updated_at, now());

create index if not exists bookings_date_idx on public.bookings (date);
create index if not exists bookings_status_idx on public.bookings (status);
create index if not exists bookings_calendar_sync_status_idx on public.bookings (calendar_sync_status);
