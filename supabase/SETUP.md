# Supabase + Google Calendar Setup

## 1. Upgrade schema booking
Jalankan migration:

```sql
\i supabase/migrations/20260415_booking_upgrade.sql
```

Atau copy isi file SQL ke Supabase SQL Editor.

## 2. Deploy Edge Function
Deploy function:

```bash
supabase functions deploy google-calendar-sync
```

## 3. Tambahkan environment variable
Isi env di Supabase project:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_CALENDAR_ID`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`

## 4. Share kalender ke service account
Di Google Calendar:

1. Buka kalender target
2. Masuk ke `Settings and sharing`
3. Tambahkan `GOOGLE_SERVICE_ACCOUNT_EMAIL` ke bagian `Share with specific people`
4. Beri izin `Make changes to events`

## 5. Alur sync yang dipakai
- `createBooking()` di website dan dashboard menyimpan booking ke `bookings`
- setelah insert/update/cancel, frontend invoke Edge Function `google-calendar-sync`
- function membuat, update, atau delete event di Google Calendar
- hasil sync dicatat di kolom `calendar_event_id`, `calendar_sync_status`, `calendar_sync_error`

## Catatan produksi
- Dashboard admin sebaiknya diproteksi dengan Supabase Auth + RLS sebelum dipakai live penuh
- Saat ini UI sudah siap untuk flow baru, tapi permission Supabase perlu disesuaikan dengan aturan project kamu
