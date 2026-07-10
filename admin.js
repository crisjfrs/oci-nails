const supabaseClient = window.supabase.createClient(
  "https://umrcuzkjvnjxqljjnzzl.supabase.co",
  "sb_publishable_EVT84q7StfuUcJ8gAI7xzg_kroCRRHF",
);

const SERVICES = [
  { id: "menicure", name: "Manicure", price: 30000, displayDuration: 30 },
  {
    id: "menicure-gel",
    name: "Manicure + Gel Color",
    price: [60000, 300000],
    displayDuration: 60,
  },
  { id: "pedicure", name: "Pedicure", price: 30000, displayDuration: 30 },
  {
    id: "pedicure-gel",
    name: "Pedicure + Gel Color",
    price: [60000, 300000],
    displayDuration: 60,
  },
  {
    id: "press-on-custom",
    name: "Press On Nails Custom",
    price: [50000, 300000],
    displayDuration: 60,
  },
  {
    id: "remove-gel-extension",
    name: "Remove Gel/Extension",
    price: [30000, 40000],
    displayDuration: 30,
  },
];

const dom = {
  loginOverlay: document.getElementById("login-overlay"),
  loginForm: document.getElementById("login-form"),
  loginEmail: document.getElementById("login-email"),
  loginPassword: document.getElementById("login-password"),
  loginFeedback: document.getElementById("login-feedback"),
  appShell: document.querySelector(".admin-shell"),
  logoutBtn: document.getElementById("logout-btn"),
  manualForm: document.getElementById("manual-form"),
  serviceSelect: document.getElementById("manual-service"),
  timeSelect: document.getElementById("manual-time"),
  dateInput: document.getElementById("manual-date"),
  feedback: document.getElementById("manual-feedback"),
  dayFilter: document.getElementById("day-filter"),
  refreshDay: document.getElementById("refresh-day"),
  bookingList: document.getElementById("booking-list"),
  template: document.getElementById("booking-item-template"),
  statTotal: document.getElementById("stat-total"),
  statBusy: document.getElementById("stat-busy"),
  statUpdate: document.getElementById("stat-update"),
  installPwa: document.getElementById("install-pwa"),
};

let deferredInstallPrompt = null;
let isAuthenticated = false;

function formatRupiah(price) {
  if (Array.isArray(price)) {
    return `Rp${price[0].toLocaleString("id-ID")}-${price[1].toLocaleString("id-ID")}`;
  }
  return `Rp${price.toLocaleString("id-ID")}`;
}

function getServiceLabel(service) {
  return `${service.name} (${formatRupiah(service.price)} | ${service.displayDuration} menit)`;
}

function todayISO() {
  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tzOffset).toISOString().slice(0, 10);
}

function generateTimeSlots() {
  const slots = [];
  for (let h = 9; h <= 18; h += 1) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
  }
  return slots;
}

function getNearestNextSlot() {
  const now = new Date();
  let hour = now.getHours() + 1;
  if (hour < 9) hour = 9;
  if (hour > 18) hour = 18;
  return `${String(hour).padStart(2, "0")}:00`;
}

function normalizePhone(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
}

function formatTimeLabel(time) {
  const [h = "00", m = "00"] = String(time).split(":");
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
}

function formatDateLabel(dateStr) {
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("id-ID", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function renderServiceOptions() {
  dom.serviceSelect.innerHTML = SERVICES.map(
    (service) => `<option value="${service.id}">${getServiceLabel(service)}</option>`,
  ).join("");
}

function renderTimeOptions(selectEl, selected = "") {
  const slots = generateTimeSlots();
  selectEl.innerHTML = slots
    .map((slot) => `<option value="${slot}" ${selected === slot ? "selected" : ""}>${slot}</option>`)
    .join("");
}

function setFeedback(message, isError = false) {
  dom.feedback.textContent = message;
  dom.feedback.classList.toggle("error", isError);
}

function setLoginFeedback(message, isError = false) {
  dom.loginFeedback.textContent = message;
  dom.loginFeedback.classList.toggle("error", isError);
}

function toggleAuthUI(loggedIn) {
  isAuthenticated = loggedIn;
  dom.loginOverlay.hidden = loggedIn;
  dom.appShell.hidden = !loggedIn;
  dom.logoutBtn.hidden = !loggedIn;
}

async function checkUserSession() {
  const { data, error } = await supabaseClient.auth.getSession();

  if (error) {
    toggleAuthUI(false);
    setLoginFeedback("Tidak bisa memeriksa sesi. Coba refresh halaman.", true);
    return false;
  }

  const loggedIn = Boolean(data.session);
  toggleAuthUI(loggedIn);
  if (!loggedIn) {
    setLoginFeedback("");
  }
  return loggedIn;
}

function setDefaultValues() {
  const today = todayISO();
  dom.dateInput.value = today;
  dom.dayFilter.value = today;
  renderTimeOptions(dom.timeSelect, getNearestNextSlot());
}

function parseServiceValue(serviceId) {
  const service = SERVICES.find((item) => item.id === serviceId);
  if (!service) return serviceId;
  return getServiceLabel(service);
}

function updateStats(bookings) {
  dom.statTotal.textContent = String(bookings.length);

  if (!bookings.length) {
    dom.statBusy.textContent = "-";
    dom.statUpdate.textContent = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return;
  }

  const bucket = {};
  bookings.forEach((booking) => {
    const hour = formatTimeLabel(booking.time).slice(0, 2);
    bucket[hour] = (bucket[hour] || 0) + 1;
  });

  const busiest = Object.entries(bucket).sort((a, b) => b[1] - a[1])[0]?.[0];
  dom.statBusy.textContent = busiest ? `${busiest}:00` : "-";
  dom.statUpdate.textContent = new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function fetchBookingsByDate(date) {
  const { data, error } = await supabaseClient
    .from("bookings")
    .select("id, name, phone, service, date, time, notes")
    .eq("date", date)
    .order("time", { ascending: true });

  if (error) {
    throw new Error(error.message || "Gagal mengambil booking.");
  }

  return data || [];
}

function renderEmptyState(date) {
  dom.bookingList.innerHTML = `<div class="empty">Belum ada booking di ${formatDateLabel(date)}.</div>`;
}

function makeMetaLabel(booking) {
  const phone = booking.phone ? booking.phone : "No HP tidak diisi";
  return `${phone}`;
}

function fillRescheduleForm(form, booking) {
  const dateInput = form.querySelector('input[name="newDate"]');
  const timeSelect = form.querySelector('select[name="newTime"]');
  dateInput.value = booking.date || todayISO();
  renderTimeOptions(timeSelect, formatTimeLabel(booking.time));
}

function withBookingIdentifier(query, booking) {
  if (booking.id !== undefined && booking.id !== null) {
    return query.eq("id", booking.id);
  }

  return query
    .eq("name", booking.name || "")
    .eq("date", booking.date || "")
    .eq("time", booking.time || "")
    .eq("service", booking.service || "");
}

async function loadBookings() {
  if (!isAuthenticated) return;

  const date = dom.dayFilter.value || todayISO();
  dom.bookingList.innerHTML = '<div class="empty">Memuat booking...</div>';

  try {
    const bookings = await fetchBookingsByDate(date);
    if (!bookings.length) {
      renderEmptyState(date);
      updateStats([]);
      return;
    }

    dom.bookingList.innerHTML = "";
    bookings.forEach((booking) => {
      const fragment = dom.template.content.cloneNode(true);
      const item = fragment.querySelector(".booking-item");
      const nameEl = fragment.querySelector(".booking-name");
      const metaEl = fragment.querySelector(".booking-meta");
      const timeEl = fragment.querySelector(".booking-time");
      const serviceEl = fragment.querySelector(".booking-service");
      const notesEl = fragment.querySelector(".booking-notes");
      const rescheduleBtn = fragment.querySelector(".action-reschedule");
      const cancelBtn = fragment.querySelector(".action-cancel");
      const rescheduleForm = fragment.querySelector(".reschedule-form");
      const cancelReschedule = fragment.querySelector(".cancel-reschedule");

      nameEl.textContent = booking.name || "Tanpa Nama";
      metaEl.textContent = makeMetaLabel(booking);
      timeEl.textContent = `${formatTimeLabel(booking.time)} WIB`;
      serviceEl.textContent = booking.service || "-";
      notesEl.textContent = booking.notes || "-";
      item.dataset.bookingId = String(booking.id);

      fillRescheduleForm(rescheduleForm, booking);

      rescheduleBtn.addEventListener("click", () => {
        const opened = !rescheduleForm.hidden;
        rescheduleForm.hidden = opened;
        rescheduleBtn.textContent = opened ? "Reschedule" : "Tutup";
      });

      cancelReschedule.addEventListener("click", () => {
        rescheduleForm.hidden = true;
        rescheduleBtn.textContent = "Reschedule";
      });

      rescheduleForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const fd = new FormData(rescheduleForm);
        const newDate = String(fd.get("newDate") || "").trim();
        const newTime = String(fd.get("newTime") || "").trim();

        if (!newDate || !newTime) {
          alert("Tanggal dan jam baru wajib diisi.");
          return;
        }

        const updateQuery = supabaseClient
          .from("bookings")
          .update({ date: newDate, time: newTime });

        const { error } = await withBookingIdentifier(updateQuery, booking);

        if (error) {
          alert("Gagal reschedule booking.");
          return;
        }

        if (dom.dayFilter.value !== newDate) {
          dom.dayFilter.value = newDate;
        }
        await loadBookings();
      });

      cancelBtn.addEventListener("click", async () => {
        const ok = window.confirm(
          `Batalkan booking ${booking.name || "customer"} jam ${formatTimeLabel(booking.time)}?`,
        );
        if (!ok) return;

        const deleteQuery = supabaseClient.from("bookings").delete();
        const { error } = await withBookingIdentifier(deleteQuery, booking);
        if (error) {
          alert("Gagal cancel booking.");
          return;
        }

        await loadBookings();
      });

      dom.bookingList.appendChild(fragment);
    });

    updateStats(bookings);
  } catch (error) {
    dom.bookingList.innerHTML = '<div class="empty">Gagal memuat data booking.</div>';
    updateStats([]);
    console.error(error);
  }
}

async function handleManualSubmit(event) {
  event.preventDefault();

  if (!isAuthenticated) {
    setFeedback("Silakan login dulu.", true);
    return;
  }

  const fd = new FormData(dom.manualForm);

  const name = String(fd.get("name") || "").trim();
  const phone = normalizePhone(fd.get("phone"));
  const source = String(fd.get("source") || "WhatsApp").trim();
  const serviceId = String(fd.get("service") || "").trim();
  const date = String(fd.get("date") || "").trim();
  const time = String(fd.get("time") || "").trim();
  const notesInput = String(fd.get("notes") || "").trim();

  if (!name || !serviceId || !date || !time) {
    setFeedback("Lengkapi data wajib: nama, treatment, tanggal, jam.", true);
    return;
  }

  const notes = notesInput || `Booking manual (${source})`;
  const service = parseServiceValue(serviceId);

  setFeedback("Menyimpan booking...");

  const { error } = await supabaseClient.from("bookings").insert([
    {
      name,
      phone: phone || "",
      service,
      date,
      time,
      notes,
    },
  ]);

  if (error) {
    setFeedback("Gagal menyimpan booking. Coba lagi.", true);
    return;
  }

  setFeedback("Booking berhasil ditambahkan.");

  const keptDate = dom.dateInput.value;
  const keptTime = dom.timeSelect.value;
  const keptService = dom.serviceSelect.value;
  const sourceSelect = document.getElementById("source-select");
  const sourceValue = sourceSelect.value;

  dom.manualForm.reset();
  dom.dateInput.value = keptDate;
  renderTimeOptions(dom.timeSelect, keptTime || getNearestNextSlot());
  dom.serviceSelect.value = keptService || SERVICES[0].id;
  sourceSelect.value = sourceValue || "WhatsApp";

  dom.dayFilter.value = date;
  await loadBookings();
}

function setupQuickButtons() {
  document.querySelectorAll("[data-quick-date]").forEach((button) => {
    button.addEventListener("click", () => {
      const type = button.getAttribute("data-quick-date");
      const base = new Date();
      if (type === "tomorrow") {
        base.setDate(base.getDate() + 1);
      }
      const tzOffset = base.getTimezoneOffset() * 60000;
      const value = new Date(base.getTime() - tzOffset).toISOString().slice(0, 10);
      dom.dateInput.value = value;
      dom.dayFilter.value = value;
      if (isAuthenticated) {
        loadBookings();
      }
    });
  });

  document.querySelectorAll("[data-quick-time]").forEach((button) => {
    button.addEventListener("click", () => {
      renderTimeOptions(dom.timeSelect, getNearestNextSlot());
    });
  });
}

function setupPwa() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        await navigator.serviceWorker.register("./admin-sw.js");
      } catch (error) {
        console.error("Service worker gagal register:", error);
      }
    });
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    dom.installPwa.hidden = false;
  });

  dom.installPwa.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    dom.installPwa.hidden = true;
  });
}

function bindAuthEvents() {
  dom.loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = dom.loginEmail.value.trim();
    const password = dom.loginPassword.value;

    if (!email || !password) {
      setLoginFeedback("Email dan password wajib diisi.", true);
      return;
    }

    setLoginFeedback("Memproses login...");

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
      setLoginFeedback(`Login gagal: ${error.message}`, true);
      return;
    }

    setLoginFeedback("Login berhasil.");
    toggleAuthUI(true);
    await loadBookings();
  });

  dom.logoutBtn.addEventListener("click", async () => {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      alert("Logout gagal. Coba lagi.");
      return;
    }

    dom.loginForm.reset();
    toggleAuthUI(false);
    setLoginFeedback("Sesi berakhir. Silakan login lagi.");
  });

  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === "INITIAL_SESSION") return;
    const loggedIn = Boolean(session);
    toggleAuthUI(loggedIn);
    if (!loggedIn) {
      dom.bookingList.innerHTML = "";
      setFeedback("");
    }
  });
}

function bindEvents() {
  dom.manualForm.addEventListener("submit", handleManualSubmit);
  dom.dayFilter.addEventListener("change", loadBookings);
  dom.refreshDay.addEventListener("click", loadBookings);
}

async function init() {
  renderServiceOptions();
  setDefaultValues();
  setupQuickButtons();
  bindAuthEvents();
  bindEvents();
  setupPwa();

  const loggedIn = await checkUserSession();
  if (loggedIn) {
    await loadBookings();
  }
}

init();
