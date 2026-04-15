const {
  CONFIG,
  SERVICES,
  SOURCE_OPTIONS,
  addDays,
  cancelBooking,
  createBooking,
  escapeHtml,
  fetchBookings,
  formatCompactDate,
  formatRupiah,
  getAvailableSlots,
  getServiceById,
  getServiceLabel,
  isBookingActive,
  promptInstall,
  sortBookingsByTime,
  toDateInputValue,
  updateBooking,
} = window.OciNailsShared;

const adminState = {
  bookings: [],
  selectedDate: toDateInputValue(new Date()),
  editingId: "",
};

function getFormElements() {
  const form = document.getElementById("admin-booking-form");
  return {
    form,
    note: document.getElementById("admin-form-note"),
    submitButton: form.querySelector('button[type="submit"]'),
  };
}

function fillServiceOptions() {
  const serviceSelect = document.getElementById("admin-service");
  const sourceSelect = document.getElementById("admin-source");

  serviceSelect.innerHTML = SERVICES.map(
    (service) =>
      `<option value="${service.id}">${escapeHtml(getServiceLabel(service))}</option>`,
  ).join("");

  sourceSelect.innerHTML = SOURCE_OPTIONS.map(
    (source) => `<option value="${source.value}">${escapeHtml(source.label)}</option>`,
  ).join("");
  sourceSelect.value = "whatsapp";
}

function getSelectedServiceId() {
  return document.getElementById("admin-service").value;
}

function getSelectedDate() {
  return document.getElementById("admin-date").value;
}

function updateSlotSelect(selectedTime = "") {
  const slotSelect = document.getElementById("admin-time");
  const slots = getAvailableSlots(
    adminState.bookings,
    getSelectedDate(),
    getSelectedServiceId(),
    { excludeId: adminState.editingId || undefined },
  );

  slotSelect.innerHTML = slots
    .map(
      (slot) => `
        <option
          value="${slot.time}"
          ${slot.time === selectedTime ? "selected" : ""}
          ${slot.available || slot.time === selectedTime ? "" : "disabled"}
        >
          ${slot.time} - ${slot.endTime}${slot.available || slot.time === selectedTime ? "" : " (Bentrok)"}
        </option>
      `,
    )
    .join("");

  if (!slots.length) {
    slotSelect.innerHTML = '<option value="">Tidak ada slot tersedia</option>';
    return;
  }

  if (!slotSelect.value && slots[0]) {
    slotSelect.value = slots.find((slot) => slot.available)?.time || slots[0].time;
  }
}

function renderStats() {
  const activeBookings = adminState.bookings.filter((booking) => isBookingActive(booking));
  const today = toDateInputValue(new Date());
  const todayBookings = activeBookings.filter((booking) => booking.date === today);
  const pendingSync = adminState.bookings.filter(
    (booking) => booking.calendar_sync_status === "pending",
  ).length;

  document.getElementById("admin-stats").innerHTML = `
    <article class="stat-card">
      <p>Booking aktif</p>
      <strong>${activeBookings.length}</strong>
      <span>Semua source digabung</span>
    </article>
    <article class="stat-card">
      <p>Hari ini</p>
      <strong>${todayBookings.length}</strong>
      <span>${formatCompactDate(today)}</span>
    </article>
    <article class="stat-card">
      <p>Sync kalender</p>
      <strong>${pendingSync}</strong>
      <span>Event menunggu sinkronisasi</span>
    </article>
  `;
}

function renderDateRail() {
  const rail = document.getElementById("admin-date-rail");
  const days = Array.from({ length: 7 }, (_, index) => addDays(new Date(), index));

  rail.innerHTML = days
    .map((day) => {
      const value = toDateInputValue(day);
      const total = adminState.bookings.filter(
        (booking) => booking.date === value && isBookingActive(booking),
      ).length;

      return `
        <button
          type="button"
          class="rail-chip ${value === adminState.selectedDate ? "is-active" : ""}"
          data-admin-date="${value}"
        >
          <strong>${new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(day)}</strong>
          <span>${day.getDate()}</span>
          <small>${total} booking</small>
        </button>
      `;
    })
    .join("");
}

function renderDailyList() {
  const list = document.getElementById("admin-booking-list");
  const title = document.getElementById("admin-day-title");
  const subtitle = document.getElementById("admin-day-subtitle");

  const dailyBookings = sortBookingsByTime(
    adminState.bookings.filter((booking) => booking.date === adminState.selectedDate),
  );

  title.textContent = formatCompactDate(adminState.selectedDate, {
    includeWeekday: true,
  });
  subtitle.textContent = `${dailyBookings.filter((booking) => isBookingActive(booking)).length} booking aktif`;

  if (!dailyBookings.length) {
    list.innerHTML =
      '<p class="empty-state">Belum ada booking di tanggal ini. Kamu bisa tambah booking manual di form sebelah.</p>';
    return;
  }

  list.innerHTML = dailyBookings
    .map((booking) => {
      const service = getServiceById(booking.service_id);
      const serviceColor = service?.color || "var(--service-latte)";

      return `
        <article class="admin-booking-card ${booking.status === "cancelled" ? "is-cancelled" : ""}">
          <div class="admin-booking-top">
            <div>
              <p class="booking-time">${booking.time} - ${booking.end_time}</p>
              <h3>${escapeHtml(booking.name)}</h3>
              <p class="booking-meta">${escapeHtml(booking.service_name)} | ${escapeHtml(
                booking.source,
              )}</p>
            </div>
            <span class="sync-pill" style="--service-accent:${serviceColor}">
              ${escapeHtml(booking.calendar_sync_status)}
            </span>
          </div>
          <p class="booking-notes">${escapeHtml(booking.notes || "Tanpa catatan")}</p>
          <div class="admin-booking-actions">
            <button type="button" class="btn btn-ghost" data-edit-booking="${booking.id}">
              Reschedule
            </button>
            <button
              type="button"
              class="btn btn-danger"
              data-cancel-booking="${booking.id}"
              ${booking.status === "cancelled" ? "disabled" : ""}
            >
              Cancel
            </button>
          </div>
        </article>
      `;
    })
    .join("");
}

function resetForm() {
  const { form, note, submitButton } = getFormElements();
  form.reset();
  adminState.editingId = "";
  document.getElementById("admin-date").value = adminState.selectedDate;
  document.getElementById("admin-service").value = SERVICES[0].id;
  document.getElementById("admin-source").value = "whatsapp";
  submitButton.textContent = "Tambah Booking";
  document.getElementById("editor-title").textContent = "Tambah booking manual";
  note.textContent = "Booking dari WhatsApp atau offline bisa diinput di sini.";
  updateSlotSelect();
}

function fillFormForEdit(booking) {
  const { submitButton, note } = getFormElements();

  adminState.editingId = booking.id;
  adminState.selectedDate = booking.date;
  document.getElementById("admin-name").value = booking.name;
  document.getElementById("admin-phone").value = booking.phone || "";
  document.getElementById("admin-service").value = booking.service_id;
  document.getElementById("admin-source").value = booking.source;
  document.getElementById("admin-date").value = booking.date;
  updateSlotSelect(booking.time);
  document.getElementById("admin-notes").value = booking.notes || "";

  document.getElementById("editor-title").textContent = `Reschedule ${booking.name}`;
  submitButton.textContent = "Simpan Perubahan";
  note.textContent = "Tanggal, jam, dan service bisa diubah dari form ini.";
  renderDateRail();
  renderDailyList();
}

async function refreshBookings() {
  const today = toDateInputValue(new Date());
  const lastDay = toDateInputValue(addDays(new Date(), CONFIG.bookingWindowDays));
  adminState.bookings = await fetchBookings({
    fromDate: today,
    toDate: lastDay,
    includeCancelled: true,
  });
}

async function handleSubmit(event) {
  event.preventDefault();
  const { note, submitButton } = getFormElements();
  const formData = new FormData(event.currentTarget);

  const payload = {
    name: String(formData.get("name") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    notes: String(formData.get("notes") || "").trim(),
    date: String(formData.get("date") || ""),
    time: String(formData.get("time") || ""),
    serviceId: String(formData.get("serviceId") || ""),
    source: String(formData.get("source") || "admin"),
  };

  submitButton.disabled = true;
  note.textContent = adminState.editingId
    ? "Menyimpan perubahan jadwal..."
    : "Menambahkan booking manual...";

  try {
    if (adminState.editingId) {
      await updateBooking(adminState.editingId, payload);
      note.textContent = "Booking berhasil di-reschedule.";
    } else {
      await createBooking(payload);
      note.textContent = "Booking manual berhasil ditambahkan.";
    }

    await refreshBookings();
    renderStats();
    renderDateRail();
    renderDailyList();
    resetForm();
  } catch (error) {
    console.error(error);
    note.textContent = error.message || "Gagal menyimpan booking.";
  } finally {
    submitButton.disabled = false;
  }
}

async function handleListClick(event) {
  const editButton = event.target.closest("[data-edit-booking]");
  if (editButton) {
    const booking = adminState.bookings.find((item) => item.id === editButton.dataset.editBooking);
    if (booking) {
      fillFormForEdit(booking);
    }
    return;
  }

  const cancelButton = event.target.closest("[data-cancel-booking]");
  if (cancelButton) {
    const bookingId = cancelButton.dataset.cancelBooking;
    cancelButton.disabled = true;

    try {
      await cancelBooking(bookingId, "Cancelled from admin dashboard");
      await refreshBookings();
      renderStats();
      renderDateRail();
      renderDailyList();
      if (adminState.editingId === bookingId) {
        resetForm();
      }
    } catch (error) {
      console.error(error);
      cancelButton.disabled = false;
    }
  }
}

function setupDateAndSlotEvents() {
  document.getElementById("admin-date").addEventListener("change", (event) => {
    adminState.selectedDate = event.target.value;
    updateSlotSelect();
    renderDateRail();
    renderDailyList();
  });

  document.getElementById("admin-service").addEventListener("change", () => {
    updateSlotSelect();
  });

  document.getElementById("admin-date-rail").addEventListener("click", (event) => {
    const button = event.target.closest("[data-admin-date]");
    if (!button) return;
    adminState.selectedDate = button.dataset.adminDate;
    document.getElementById("admin-date").value = adminState.selectedDate;
    updateSlotSelect();
    renderDateRail();
    renderDailyList();
  });

  document.getElementById("quick-today").addEventListener("click", () => {
    adminState.selectedDate = toDateInputValue(new Date());
    document.getElementById("admin-date").value = adminState.selectedDate;
    updateSlotSelect();
    renderDateRail();
    renderDailyList();
  });

  document.getElementById("quick-tomorrow").addEventListener("click", () => {
    adminState.selectedDate = toDateInputValue(addDays(new Date(), 1));
    document.getElementById("admin-date").value = adminState.selectedDate;
    updateSlotSelect();
    renderDateRail();
    renderDailyList();
  });
}

function setupInstallButton() {
  const button = document.querySelector("[data-install-app]");
  button.addEventListener("click", async () => {
    const installed = await promptInstall();
    if (!installed) {
      button.textContent = "Install via menu browser";
    }
  });

  window.addEventListener("oci:install-ready", () => {
    button.hidden = false;
  });
}

async function initAdmin() {
  fillServiceOptions();
  setupInstallButton();

  try {
    await refreshBookings();
  } catch (error) {
    console.error(error);
    document.getElementById("admin-form-note").textContent =
      "Data booking belum bisa dimuat dari Supabase.";
  }

  renderStats();
  renderDateRail();
  renderDailyList();
  resetForm();

  document.getElementById("admin-booking-form").addEventListener("submit", handleSubmit);
  document.getElementById("admin-booking-list").addEventListener("click", handleListClick);
  document.getElementById("admin-reset").addEventListener("click", resetForm);
  setupDateAndSlotEvents();

  document.getElementById("admin-date").value = adminState.selectedDate;
  updateSlotSelect();
}

initAdmin();
