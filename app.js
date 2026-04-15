const {
  CONFIG,
  SERVICES,
  addDays,
  createBooking,
  escapeHtml,
  fetchBookings,
  formatCompactDate,
  formatRupiah,
  getAvailableSlots,
  getDayAvailability,
  getMonthGrid,
  getMonthLabel,
  getServiceById,
  getServiceLabel,
  normalizeTimeValue,
  promptInstall,
  toDateInputValue,
  toWANumber,
} = window.OciNailsShared;

const bookingState = {
  bookings: [],
  selectedServiceId: SERVICES[0].id,
  selectedDate: "",
  selectedTime: "",
  monthDate: new Date(),
};

function renderServices() {
  const grid = document.getElementById("service-grid");
  const select = document.getElementById("service-select");

  grid.innerHTML = SERVICES.map(
    (service) => `
      <article class="service-card reveal">
        <div class="service-visual">
          <img src="${service.image}" alt="${escapeHtml(service.name)}" />
        </div>
        <div class="service-content">
          <div class="service-top">
            <h3>${escapeHtml(service.name)}</h3>
            <span class="badge">${formatRupiah(service.price)}</span>
          </div>
          <p>${escapeHtml(service.description)}</p>
          <small>${service.displayDuration} menit display, blok jadwal ${service.actualDuration} menit</small>
        </div>
      </article>
    `,
  ).join("");

  select.innerHTML = SERVICES.map(
    (service) =>
      `<option value="${service.id}">${escapeHtml(getServiceLabel(service))}</option>`,
  ).join("");
}

function renderServiceSummary() {
  const service = getServiceById(bookingState.selectedServiceId);
  const target = document.getElementById("service-summary");

  target.innerHTML = `
    <div class="service-summary-card" style="--service-accent:${service.color}">
      <p class="eyebrow">Durasi service</p>
      <h3>${escapeHtml(service.name)}</h3>
      <div class="service-summary-meta">
        <span>${formatRupiah(service.price)}</span>
        <span>${service.actualDuration} menit diblok di kalender</span>
      </div>
      <p>${escapeHtml(service.description)}</p>
    </div>
  `;
}

function renderCalendarLegend() {
  document.getElementById("calendar-legend").innerHTML = `
    <span><i class="legend-dot legend-open"></i>Banyak slot kosong</span>
    <span><i class="legend-dot legend-tight"></i>Tersisa sedikit</span>
    <span><i class="legend-dot legend-full"></i>Penuh</span>
  `;
}

function syncSelectedDateInput() {
  const dateInput = document.querySelector('input[name="date"]');
  const timeInput = document.querySelector('input[name="time"]');
  dateInput.value = bookingState.selectedDate;
  timeInput.value = bookingState.selectedTime;
}

function ensureSelectableDate() {
  if (!bookingState.selectedServiceId) return;

  const inWindow = getMonthGrid(bookingState.monthDate).filter(
    (day) => day.isCurrentMonth && !day.isPast,
  );

  const selectedAvailability =
    bookingState.selectedDate &&
    getDayAvailability(
      bookingState.bookings,
      bookingState.selectedDate,
      bookingState.selectedServiceId,
    );

  if (selectedAvailability && selectedAvailability.openSlots > 0) {
    return;
  }

  const fallback = inWindow.find((day) => {
    const availability = getDayAvailability(
      bookingState.bookings,
      day.value,
      bookingState.selectedServiceId,
    );
    return availability.openSlots > 0;
  });

  bookingState.selectedDate = fallback?.value || "";
}

function renderCalendar() {
  const monthLabel = document.getElementById("calendar-month-label");
  const grid = document.getElementById("calendar-grid");

  monthLabel.textContent = getMonthLabel(bookingState.monthDate);

  const dayNames = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
  document.getElementById("calendar-days").innerHTML = dayNames
    .map((day) => `<span>${day}</span>`)
    .join("");

  grid.innerHTML = getMonthGrid(bookingState.monthDate)
    .map((day) => {
      const availability = getDayAvailability(
        bookingState.bookings,
        day.value,
        bookingState.selectedServiceId,
      );
      const classes = [
        "calendar-day",
        day.isCurrentMonth ? "" : "is-muted",
        day.isToday ? "is-today" : "",
        day.value === bookingState.selectedDate ? "is-selected" : "",
        day.isPast ? "is-past" : "",
        `status-${availability.status}`,
      ]
        .filter(Boolean)
        .join(" ");

      return `
        <button
          type="button"
          class="${classes}"
          data-date="${day.value}"
          ${day.isPast || !day.isCurrentMonth ? "disabled" : ""}
        >
          <strong>${day.dayOfMonth}</strong>
          <small>${availability.openSlots} slot</small>
        </button>
      `;
    })
    .join("");
}

function renderSlotList() {
  const slotList = document.getElementById("slot-list");
  const selectedDateLabel = document.getElementById("selected-date-label");
  const selectedRangeLabel = document.getElementById("selected-range-label");
  const service = getServiceById(bookingState.selectedServiceId);

  if (!bookingState.selectedDate) {
    slotList.innerHTML =
      '<p class="empty-state">Belum ada hari yang tersedia di bulan ini. Coba geser ke bulan berikutnya.</p>';
    selectedDateLabel.textContent = "Pilih treatment dulu";
    selectedRangeLabel.textContent = "Slot otomatis menyesuaikan durasi service";
    syncSelectedDateInput();
    return;
  }

  const slots = getAvailableSlots(
    bookingState.bookings,
    bookingState.selectedDate,
    bookingState.selectedServiceId,
  );

  selectedDateLabel.textContent = formatCompactDate(bookingState.selectedDate, {
    includeWeekday: true,
  });

  if (bookingState.selectedTime) {
    selectedRangeLabel.textContent = `${bookingState.selectedTime} - ${normalizeTimeValue(
      slots.find((slot) => slot.time === bookingState.selectedTime)?.endTime,
    )}`;
  } else {
    selectedRangeLabel.textContent = `${service.actualDuration} menit per booking`;
  }

  slotList.innerHTML = slots
    .map((slot) => `
      <button
        type="button"
        class="slot-chip ${slot.available ? "" : "is-disabled"} ${slot.time === bookingState.selectedTime ? "is-active" : ""}"
        data-time="${slot.time}"
        ${slot.available ? "" : "disabled"}
      >
        <strong>${slot.time}</strong>
        <span>${slot.endTime}</span>
      </button>
    `)
    .join("");

  syncSelectedDateInput();
}

function setupMap() {
  document.getElementById("map-embed").src = CONFIG.mapsEmbedUrl;
  document.getElementById("map-direct-link").href = CONFIG.mapsDirectUrl;
}

function setupInstallButtons() {
  const buttons = document.querySelectorAll("[data-install-app]");
  buttons.forEach((button) => {
    button.addEventListener("click", async () => {
      const installed = await promptInstall();
      if (!installed) {
        button.textContent = "Tambahkan lewat menu browser";
      }
    });
  });

  window.addEventListener("oci:install-ready", () => {
    buttons.forEach((button) => {
      button.hidden = false;
    });
  });
}

function attachCalendarEvents() {
  document.getElementById("service-select").addEventListener("change", (event) => {
    bookingState.selectedServiceId = event.target.value;
    bookingState.selectedTime = "";
    ensureSelectableDate();
    renderServiceSummary();
    renderCalendar();
    renderSlotList();
  });

  document.getElementById("calendar-grid").addEventListener("click", (event) => {
    const button = event.target.closest("[data-date]");
    if (!button) return;
    bookingState.selectedDate = button.dataset.date;
    bookingState.selectedTime = "";
    renderCalendar();
    renderSlotList();
  });

  document.getElementById("slot-list").addEventListener("click", (event) => {
    const button = event.target.closest("[data-time]");
    if (!button) return;
    bookingState.selectedTime = button.dataset.time;
    renderSlotList();
  });

  document.getElementById("prev-month").addEventListener("click", () => {
    bookingState.monthDate = new Date(
      bookingState.monthDate.getFullYear(),
      bookingState.monthDate.getMonth() - 1,
      1,
    );
    ensureSelectableDate();
    renderCalendar();
    renderSlotList();
  });

  document.getElementById("next-month").addEventListener("click", () => {
    bookingState.monthDate = new Date(
      bookingState.monthDate.getFullYear(),
      bookingState.monthDate.getMonth() + 1,
      1,
    );
    ensureSelectableDate();
    renderCalendar();
    renderSlotList();
  });
}

async function hydrateBookings() {
  const today = toDateInputValue(new Date());
  const lastDay = toDateInputValue(addDays(new Date(), CONFIG.bookingWindowDays));
  bookingState.bookings = await fetchBookings({
    fromDate: today,
    toDate: lastDay,
  });
}

function buildWhatsAppMessage(booking) {
  return [
    `Halo ${CONFIG.studioName}, aku sudah submit booking di website.`,
    "",
    `Booking ID: ${booking.id}`,
    `Nama: ${booking.name}`,
    `No HP: ${booking.phone || "-"}`,
    `Treatment: ${booking.service_label}`,
    `Tanggal: ${formatCompactDate(booking.date, { includeWeekday: true })}`,
    `Jam: ${booking.time} - ${booking.end_time}`,
    `Catatan: ${booking.notes || "-"}`,
    "",
    "Mohon konfirmasi ya. Terima kasih.",
  ].join("\n");
}

function setupBookingForm() {
  const form = document.getElementById("booking-form");
  const note = document.getElementById("form-note");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const phone = String(formData.get("customerPhone") || "").trim();
    const notes = String(formData.get("notes") || "").trim();

    if (!bookingState.selectedDate || !bookingState.selectedTime) {
      note.textContent = "Pilih tanggal dan jam dulu ya.";
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    note.textContent = "Menyimpan booking ke sistem...";

    try {
      const booking = await createBooking({
        name,
        phone,
        notes,
        date: bookingState.selectedDate,
        time: bookingState.selectedTime,
        serviceId: bookingState.selectedServiceId,
        source: "website",
      });

      note.textContent = "Booking tersimpan. WhatsApp akan dibuka untuk konfirmasi cepat.";
      form.reset();
      bookingState.bookings.push(booking);
      bookingState.selectedTime = "";
      ensureSelectableDate();
      renderCalendar();
      renderSlotList();

      const waLink = `https://wa.me/${toWANumber(CONFIG.whatsappNumber)}?text=${encodeURIComponent(
        buildWhatsAppMessage(booking),
      )}`;
      window.open(waLink, "_blank", "noopener");
    } catch (error) {
      console.error(error);
      note.textContent =
        error.message || "Booking belum berhasil disimpan. Coba ulang beberapa saat lagi.";
    } finally {
      submitButton.disabled = false;
    }
  });
}

async function init() {
  renderServices();
  renderCalendarLegend();
  setupMap();
  setupInstallButtons();
  attachCalendarEvents();
  setupBookingForm();

  try {
    await hydrateBookings();
  } catch (error) {
    console.error("Gagal memuat booking:", error);
    document.getElementById("form-note").textContent =
      "Jadwal realtime belum bisa dimuat. Silakan refresh halaman sebentar lagi.";
  }

  bookingState.monthDate = new Date();
  bookingState.selectedDate = toDateInputValue(new Date());
  ensureSelectableDate();
  renderServiceSummary();
  renderCalendar();
  renderSlotList();
}

init();
