# Oci Nails - Booking System MVP (Static + Automation)

This project is a lightweight booking system for a nail studio. It replaces manual chat scheduling with a fast, low-cost flow based on static hosting and third-party services.

The architecture intentionally avoids a custom backend. Availability is managed in Google Calendar, while the website provides a simple customer interface to browse services, check schedule visibility, and send booking requests via WhatsApp.

## Why this architecture

- Fast delivery: no backend development or server maintenance.
- Cost efficient: can run on GitHub Pages for free.
- Operationally simple: owner controls availability directly in Google Calendar.
- Production-ready MVP: enough functionality to operate real bookings quickly.

## Features

- Service catalog with pricing and duration.
- Schedule visibility using embedded Google Calendar.
- Booking initiation through WhatsApp pre-filled messages.
- Responsive layout for mobile-first customer usage.
- Static deployment with GitHub Pages.

## Tech stack

- HTML
- CSS
- JavaScript
- GitHub Pages (hosting)
- Google Calendar (scheduling)
- WhatsApp API via wa.me links (communication)

## Project structure

- `index.html` - page layout and sections.
- `styles.css` - visual design, responsive rules, motion.
- `script.js` - service rendering, calendar links, WhatsApp booking flow.

## Local usage

1. Clone repository.
2. Open `index.html` in browser.
3. Update configuration in `script.js` before publishing.

## Configuration

Edit `CONFIG` in `script.js`:

- `whatsappNumber`: business number in international format without `+` or spaces.
- `calendarEmbedUrl`: public Google Calendar embed URL.
- `calendarDirectUrl`: direct calendar link fallback.
- `appointmentScheduleUrl`: Google appointment booking link (optional, recommended).

Example:

```
whatsappNumber: "15551234567"
```

## Google Calendar setup

1. Open Google Calendar settings.
2. Select studio calendar.
3. Enable public visibility (or appropriate share settings).
4. Copy the embed URL and paste it into `calendarEmbedUrl`.
5. Optionally create Appointment Schedules and paste link into `appointmentScheduleUrl`.

## WhatsApp flow

When user submits form:

1. System builds a structured booking message.
2. Opens `https://wa.me/<number>?text=<encoded_message>`.
3. Customer sends message to finalize booking with owner.

## Deploy to GitHub Pages

1. Push repository to GitHub.
2. Open repository settings.
3. Go to Pages.
4. Set source to `Deploy from a branch`.
5. Choose `main` branch and `/ (root)` folder.
6. Save and wait for deployment URL.

## Trade-offs

- Pros:
	- Very low complexity.
	- Low operating cost.
	- Rapid MVP deployment.
- Cons:
	- No automated conflict prevention server-side.
	- Booking confirmation still depends on owner response.
	- Limited analytics without additional tooling.

## Outcome

This project demonstrates a practical, lean system design that solves a real booking problem by integrating existing services. It balances speed, cost, and simplicity while remaining usable in production for small business operations.