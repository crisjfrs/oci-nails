const supabaseClient = window.supabase.createClient(
  "https://umrcuzkjvnjxqljjnzzl.supabase.co",
  "sb_publishable_EVT84q7StfuUcJ8gAI7xzg_kroCRRHF",
);

const CONFIG = {
  studioName: "Oci.Nails",
  studioCity: "Bandung",
  whatsappNumber: "6281222773865",
  mapsEmbedUrl:
    "https://www.google.com/maps?q=-6.9833488,107.6332721&z=17&output=embed",
  mapsDirectUrl: "https://maps.app.goo.gl/68CXX7Da4C96Rgkw7",
  bookingWindowDays: 45,
  slotIntervalMinutes: 30,
  businessHours: {
    startMinutes: 9 * 60,
    endMinutes: 20 * 60,
  },
  calendarSync: {
    enabled: true,
    functionName: "google-calendar-sync",
  },
  cacheVersion: "20260415",
};

const SERVICES = [
  {
    id: "manicure",
    name: "Manicure",
    price: 30000,
    displayDuration: 30,
    actualDuration: 60,
    description:
      "Biar kuku tangan kamu lebih rapi, bersih, dan enak dilihat. Cocok buat yang pengen tampil simple tapi tetap terawat.",
    image: "img/treatment/menicure.jpg",
    color: "var(--service-blush)",
  },
  {
    id: "manicure-gel",
    name: "Manicure + Gel Color",
    price: [60000, 300000],
    displayDuration: 60,
    actualDuration: 120,
    description:
      "Hasil cantik dan tahan lama. Cocok kalau kamu mau kuku yang lebih standout tanpa perlu sering touch up.",
    image: "img/treatment/menicure-gel.jpg",
    color: "var(--service-mint)",
  },
  {
    id: "pedicure",
    name: "Pedicure",
    price: 30000,
    displayDuration: 30,
    actualDuration: 60,
    description:
      "Bikin kaki kamu lebih bersih, halus, dan nyaman. Enak banget buat self-care atau sebelum pakai sandal.",
    image: "img/treatment/pedicure.jpg",
    color: "var(--service-sand)",
  },
  {
    id: "pedicure-gel",
    name: "Pedicure + Gel Color",
    price: [60000, 300000],
    displayDuration: 60,
    actualDuration: 120,
    description:
      "Pedicure lengkap dengan gel color yang glossy dan awet. Kaki jadi kelihatan lebih rapi, cantik, dan sehat.",
    image: "img/treatment/pedicure-gel.jpg",
    color: "var(--service-olive)",
  },
  {
    id: "press-on-custom",
    name: "Press On Nails Custom",
    price: [50000, 300000],
    displayDuration: 60,
    actualDuration: 120,
    description:
      "Desain sesuai keinginan, tinggal pasang dan langsung cakep. Cocok buat yang mau fleksibel dan cepat.",
    image: "img/treatment/press-on-custom.jpg",
    color: "var(--service-peach)",
  },
  {
    id: "remove-gel-extension",
    name: "Remove Gel/Extension",
    price: [30000, 40000],
    displayDuration: 30,
    actualDuration: 60,
    description:
      "Lepas gel atau extension dengan aman tanpa bikin kuku rusak, lalu siap buat treatment selanjutnya.",
    image: "img/treatment/remove-gel-extension.jpg",
    color: "var(--service-latte)",
  },
];

const SOURCE_OPTIONS = [
  { value: "website", label: "Website" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "offline", label: "Offline" },
  { value: "admin", label: "Admin Manual" },
];

let deferredInstallPrompt = null;

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  window.dispatchEvent(new CustomEvent("oci:install-ready"));
});

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .catch((error) => console.error("Gagal register service worker:", error));
  });
}

registerServiceWorker();

function formatRupiah(price) {
  if (Array.isArray(price)) {
    return `Rp${price[0].toLocaleString("id-ID")} - Rp${price[1].toLocaleString("id-ID")}`;
  }
  return `Rp${price.toLocaleString("id-ID")}`;
}

function formatCompactDate(dateValue, options = {}) {
  const date = typeof dateValue === "string" ? new Date(`${dateValue}T00:00`) : dateValue;
  return new Intl.DateTimeFormat("id-ID", {
    weekday: options.includeWeekday ? "long" : undefined,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatTimeLabel(value) {
  return normalizeTimeValue(value);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toWANumber(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
}

function normalizeTimeValue(value) {
  if (!value) return "";
  const [hours = "00", minutes = "00"] = String(value).split(":");
  return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
}

function timeToMinutes(value) {
  const [hours = "0", minutes = "0"] = normalizeTimeValue(value).split(":");
  return Number(hours) * 60 + Number(minutes);
}

function minutesToTime(totalMinutes) {
  const safe = Math.max(0, totalMinutes);
  const hours = String(Math.floor(safe / 60)).padStart(2, "0");
  const minutes = String(safe % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function addMinutes(time, minutesToAdd) {
  return minutesToTime(timeToMinutes(time) + minutesToAdd);
}

function startOfDay(date = new Date()) {
  const clone = new Date(date);
  clone.setHours(0, 0, 0, 0);
  return clone;
}

function toDateInputValue(date = new Date()) {
  const clone = new Date(date);
  clone.setHours(0, 0, 0, 0);
  const offset = clone.getTimezoneOffset() * 60000;
  return new Date(clone.getTime() - offset).toISOString().slice(0, 10);
}

function addDays(date, amount) {
  const clone = new Date(date);
  clone.setDate(clone.getDate() + amount);
  return clone;
}

function compareDateValues(a, b) {
  return new Date(`${a}T00:00`).getTime() - new Date(`${b}T00:00`).getTime();
}

function getServiceLabel(service) {
  return `${service.name} | ${formatRupiah(service.price)} | ${service.displayDuration} menit`;
}

function getServiceById(id) {
  return SERVICES.find((service) => service.id === id) || null;
}

function findServiceByValue(value) {
  if (!value) return null;

  return (
    SERVICES.find((service) => service.id === value) ||
    SERVICES.find((service) => value === getServiceLabel(service)) ||
    SERVICES.find((service) => String(value).toLowerCase().includes(service.name.toLowerCase())) ||
    null
  );
}

function getBookingDateValue(booking) {
  return booking.date || booking.booking_date || "";
}

function getBookingTimeValue(booking) {
  return normalizeTimeValue(booking.time || booking.start_time || "");
}

function getBookingDurationValue(booking) {
  const direct = Number(booking.service_duration_minutes || booking.duration_minutes);
  if (direct) return direct;

  const service = findServiceByValue(booking.service_id || booking.service || booking.service_name);
  return service?.actualDuration || 60;
}

function getBookingEndTimeValue(booking) {
  const rawEnd = normalizeTimeValue(booking.end_time || "");
  if (rawEnd) return rawEnd;
  return addMinutes(getBookingTimeValue(booking), getBookingDurationValue(booking));
}

function normalizeBooking(row) {
  const date = getBookingDateValue(row);
  const time = getBookingTimeValue(row);
  const service = findServiceByValue(row.service_id || row.service || row.service_name);
  const duration = getBookingDurationValue(row);

  return {
    ...row,
    id: row.id,
    name: row.name || row.customer_name || "",
    phone: row.phone || row.customer_phone || "",
    service_id: row.service_id || service?.id || "",
    service_name: service?.name || row.service_name || row.service || "",
    service_label: row.service || getServiceLabel(service || SERVICES[0]),
    service_price_label: row.service_price_label || (service ? formatRupiah(service.price) : ""),
    service_duration_minutes: duration,
    date,
    time,
    end_time: getBookingEndTimeValue(row),
    notes: row.notes || "",
    source: row.source || "website",
    status: row.status || "confirmed",
    calendar_sync_status: row.calendar_sync_status || "pending",
    calendar_event_id: row.calendar_event_id || "",
    calendar_sync_error: row.calendar_sync_error || "",
    created_at: row.created_at || "",
    updated_at: row.updated_at || "",
  };
}

function isBookingActive(booking) {
  return (booking.status || "confirmed") !== "cancelled";
}

function sortBookingsByTime(bookings) {
  return [...bookings].sort((left, right) => {
    const dateCompare = compareDateValues(left.date, right.date);
    if (dateCompare !== 0) return dateCompare;
    return timeToMinutes(left.time) - timeToMinutes(right.time);
  });
}

function getMonthLabel(monthDate) {
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(monthDate);
}

function getMonthGrid(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startIndex = (firstDay.getDay() + 6) % 7;
  const gridStart = addDays(firstDay, -startIndex);

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(gridStart, index);
    return {
      value: toDateInputValue(date),
      dayOfMonth: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
      isToday: toDateInputValue(date) === toDateInputValue(new Date()),
      isPast: compareDateValues(toDateInputValue(date), toDateInputValue(new Date())) < 0,
    };
  });
}

function generateTimeSlots(durationMinutes) {
  const slots = [];
  const latestStart = CONFIG.businessHours.endMinutes - durationMinutes;

  for (
    let cursor = CONFIG.businessHours.startMinutes;
    cursor <= latestStart;
    cursor += CONFIG.slotIntervalMinutes
  ) {
    slots.push(minutesToTime(cursor));
  }

  return slots;
}

function bookingConflicts(existingBooking, candidateDate, candidateStart, candidateEnd, excludeId) {
  if (!isBookingActive(existingBooking)) return false;
  if (existingBooking.id === excludeId) return false;
  if (existingBooking.date !== candidateDate) return false;

  const existingStart = timeToMinutes(existingBooking.time);
  const existingEnd = timeToMinutes(existingBooking.end_time);
  const nextStart = timeToMinutes(candidateStart);
  const nextEnd = timeToMinutes(candidateEnd);

  return nextStart < existingEnd && nextEnd > existingStart;
}

function getAvailableSlots(bookings, date, serviceId, options = {}) {
  const service = getServiceById(serviceId);
  if (!service || !date) return [];

  const activeBookings = bookings.filter((booking) => isBookingActive(booking));

  return generateTimeSlots(service.actualDuration).map((time) => {
    const endTime = addMinutes(time, service.actualDuration);
    const hasConflict = activeBookings.some((booking) =>
      bookingConflicts(booking, date, time, endTime, options.excludeId),
    );

    return {
      time,
      endTime,
      available: !hasConflict,
    };
  });
}

function getDayAvailability(bookings, date, serviceId) {
  const slots = getAvailableSlots(bookings, date, serviceId);
  const openSlots = slots.filter((slot) => slot.available).length;

  return {
    slots,
    openSlots,
    status:
      openSlots === 0
        ? "full"
        : openSlots <= 2
          ? "tight"
          : "open",
  };
}

async function fetchBookings(options = {}) {
  const query = supabaseClient
    .from("bookings")
    .select(
      "id, name, phone, service, date, time, notes, service_id, service_duration_minutes, service_price_label, end_time, status, source, calendar_event_id, calendar_sync_status, calendar_sync_error, created_at, updated_at",
    )
    .order("date", { ascending: true })
    .order("time", { ascending: true });

  if (options.fromDate) query.gte("date", options.fromDate);
  if (options.toDate) query.lte("date", options.toDate);
  if (!options.includeCancelled) query.neq("status", "cancelled");

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return sortBookingsByTime((data || []).map(normalizeBooking));
}

function buildBookingPayload(input) {
  const service = getServiceById(input.serviceId);
  if (!service) {
    throw new Error("Treatment tidak dikenali.");
  }

  return {
    name: String(input.name || "").trim(),
    phone: String(input.phone || "").trim(),
    service: getServiceLabel(service),
    date: input.date,
    time: normalizeTimeValue(input.time),
    end_time: addMinutes(input.time, service.actualDuration),
    notes: String(input.notes || "").trim(),
    service_id: service.id,
    service_duration_minutes: service.actualDuration,
    service_price_label: formatRupiah(service.price),
    status: input.status || "confirmed",
    source: input.source || "website",
    calendar_sync_status: "pending",
    calendar_sync_error: "",
  };
}

async function assertNoConflict(payload, options = {}) {
  const sameDayBookings = await fetchBookings({
    fromDate: payload.date,
    toDate: payload.date,
  });

  const conflict = sameDayBookings.some((booking) =>
    bookingConflicts(booking, payload.date, payload.time, payload.end_time, options.excludeId),
  );

  if (conflict) {
    throw new Error("Slot bentrok dengan booking lain.");
  }
}

async function syncBookingWithCalendar({ action, bookingId, snapshot }) {
  if (!CONFIG.calendarSync.enabled) {
    return { skipped: true };
  }

  try {
    const { data, error } = await supabaseClient.functions.invoke(
      CONFIG.calendarSync.functionName,
      {
        body: {
          action,
          bookingId,
          snapshot,
        },
      },
    );

    if (error) throw error;
    return data || { ok: true };
  } catch (error) {
    console.warn("Google Calendar sync belum aktif:", error);
    return {
      skipped: true,
      error,
    };
  }
}

async function createBooking(input) {
  const payload = buildBookingPayload(input);
  await assertNoConflict(payload);

  const { data, error } = await supabaseClient
    .from("bookings")
    .insert([payload])
    .select()
    .single();

  if (error) {
    throw error;
  }

  const booking = normalizeBooking(data);
  await syncBookingWithCalendar({
    action: "upsert",
    bookingId: booking.id,
    snapshot: booking,
  });

  return booking;
}

async function updateBooking(id, input) {
  const payload = buildBookingPayload(input);
  await assertNoConflict(payload, { excludeId: id });

  const { data, error } = await supabaseClient
    .from("bookings")
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  const booking = normalizeBooking(data);
  await syncBookingWithCalendar({
    action: "upsert",
    bookingId: booking.id,
    snapshot: booking,
  });

  return booking;
}

async function cancelBooking(id, reason = "") {
  const updatePayload = {
    status: "cancelled",
    calendar_sync_status: "pending",
    calendar_sync_error: "",
    updated_at: new Date().toISOString(),
  };

  if (reason) {
    updatePayload.notes = `Cancelled: ${reason}`;
  }

  const { data, error } = await supabaseClient
    .from("bookings")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  const booking = normalizeBooking(data);
  await syncBookingWithCalendar({
    action: "delete",
    bookingId: booking.id,
    snapshot: booking,
  });

  return booking;
}

async function promptInstall() {
  if (!deferredInstallPrompt) {
    return false;
  }

  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice.catch(() => null);
  deferredInstallPrompt = null;
  return true;
}

window.OciNailsShared = {
  CONFIG,
  SERVICES,
  SOURCE_OPTIONS,
  supabaseClient,
  addDays,
  addMinutes,
  cancelBooking,
  compareDateValues,
  createBooking,
  escapeHtml,
  fetchBookings,
  findServiceByValue,
  formatCompactDate,
  formatRupiah,
  formatTimeLabel,
  generateTimeSlots,
  getAvailableSlots,
  getBookingEndTimeValue,
  getDayAvailability,
  getMonthGrid,
  getMonthLabel,
  getServiceById,
  getServiceLabel,
  isBookingActive,
  minutesToTime,
  normalizeBooking,
  normalizeTimeValue,
  promptInstall,
  sortBookingsByTime,
  startOfDay,
  timeToMinutes,
  toDateInputValue,
  toWANumber,
  updateBooking,
};
