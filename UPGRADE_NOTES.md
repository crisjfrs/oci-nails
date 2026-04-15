# Oci.Nails Booking Upgrade Notes

## Ringkasan

Upgrade ini mengubah flow booking menjadi:

- semua booking masuk ke Supabase
- admin memakai dashboard untuk tambah, reschedule, dan cancel
- Google Calendar menjadi hasil sinkronisasi, bukan tempat input manual

## File utama

- `index.html` = website customer
- `admin.html` = dashboard admin
- `shared.js` = helper booking + Supabase + trigger sync
- `app.js` = custom calendar untuk customer
- `admin.js` = dashboard admin
- `app.css` = style website + admin
- `manifest.webmanifest` + `service-worker.js` = PWA

## Backend setup

Lihat:
[supabase/SETUP.md](/C:/Users/CRISTIAN/OneDrive/Desktop/oci-nails/supabase/SETUP.md)
