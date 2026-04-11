# 💅 Oci.Nails — Booking System

A lightweight booking system built to replace manual WhatsApp scheduling for a nail studio.

👉 Live: https://crisjfrs.github.io/oci-nails/

---

## 🎯 Problem
Manual booking caused:
- Double booking  
- No structured schedule tracking  
- Inefficient communication  

---

## 💡 Solution
A simple system where users:
- Select service, date, and time  
- Submit booking via WhatsApp  

The system:
- Stores booking data (Supabase)  
- Prevents overlapping bookings  
- Automatically calculates service duration  

---

## ⚙️ Key Features
- Service catalog with pricing & duration  
- Time-slot based booking  
- Conflict detection (no overlap)  
- WhatsApp integration  
- Google Maps location  

---

## 🧱 Tech Stack
- HTML, CSS, JavaScript  
- Supabase (PostgreSQL + API)  
- GitHub Pages  

---

## ⚔️ Key Decisions
- **Time range booking (start → end)** → prevents overlapping schedules  
- **Buffer duration** → safer scheduling without hurting UX  
- **BaaS (Supabase)** → faster development, no custom backend  

---

## ⚠️ Limitations
- No real-time slot locking (race condition possible)  
- No admin dashboard  
- No authentication system  

---

## 🚀 Next Steps
- Disable unavailable time slots in UI  
- Admin dashboard for booking management  
- Realtime updates (Supabase Realtime)  

---

## 🧠 Why This Project Matters
This is not just a UI project — it is a **working scheduling system** that:
- Stores and manages real data  
- Applies business logic  
- Solves a real operational problem  