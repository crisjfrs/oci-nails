const supabaseClient = window.supabase.createClient(
  "https://umrcuzkjvnjxqljjnzzl.supabase.co",
  "sb_publishable_EVT84q7StfuUcJ8gAI7xzg_kroCRRHF",
);

const CONFIG = {
  studioName: "Oci.Nails",
  whatsappNumber: "6281222773865",
  mapsEmbedUrl:
    "https://www.google.com/maps?q=-6.9833488,107.6332721&z=17&output=embed",
  mapsDirectUrl: "https://maps.app.goo.gl/68CXX7Da4C96Rgkw7",
};

const SERVICES = [
  {
    id: "menicure",
    name: "Manicure",
    price: 30000,
    displayDuration: 30,
    actualDuration: 60,
    description:
      "Biar kuku tangan kamu lebih rapi, bersih, dan enak dilihat. Cocok buat yang pengen tampil simple tapi tetap terawat",
    image: "img/treatment/menicure.jpg",
  },
  {
    id: "menicure-gel",
    name: "Manicure + Gel Color",
    price: [60000, 300000],
    displayDuration: 60,
    actualDuration: 120,
    description:
      "Hasil cantik dan tahan lama. Cocok kalau kamu mau kuku yang lebih standout tanpa perlu sering touch up. Buat design sesuka kamu",
    image: "img/treatment/menicure-gel.jpg",
  },
  {
    id: "pedicure",
    name: "Pedicure",
    price: 30000,
    displayDuration: 30,
    actualDuration: 60,
    description:
      "Bikin kaki kamu lebih bersih, halus, dan nyaman. Enak banget buat self-care atau sebelum pakai sandal biar makin pede",
    image: "img/treatment/pedicure.jpg",
  },
  {
    id: "pedicure-gel",
    name: "Pedicure + Gel Color",
    price: [60000, 300000],
    displayDuration: 60,
    actualDuration: 120,
    description:
      "Pedicure lengkap dengan gel color yang glossy dan awet. Kaki jadi kelihatan lebih rapi, cantik, dan sehat",
    image: "img/treatment/pedicure-gel.jpg",
  },
  {
    id: "press-on-custom",
    name: "Press On Nails Custom",
    price: [50000, 300000],
    displayDuration: 60,
    actualDuration: 120,
    description:
      "Mau kuku cantik tanpa lama di salon? Press on custom ini bisa jadi solusi. Desain sesuai keinginan, tinggal pasang dan langsung cakep",
    image: "img/treatment/press-on-custom.jpg",
  },
  {
    id: "remove-gel-extension",
    name: "Remove Gel/Extension",
    price: [30000, 40000],
    displayDuration: 30,
    actualDuration: 60,
    description:
      "Lepas gel atau extension dengan aman tanpa bikin kuku rusak. Biar kuku tetap sehat dan siap buat treatment selanjutnya",
    image: "img/treatment/remove-gel-extension.jpg",
  },
];

// --- Helpers ---

function formatRupiah(price) {
  if (Array.isArray(price)) {
    return `Rp${price[0].toLocaleString("id-ID")}–${price[1].toLocaleString("id-ID")}`;
  }
  return `Rp${price.toLocaleString("id-ID")}`;
}

function toWANumber(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  if (digits.startsWith("8")) return "62" + digits;
  return digits;
}

function generateTimeSlots() {
  const slots = [];
  for (let h = 9; h <= 18; h++) {
    slots.push(String(h).padStart(2, "0") + ":00");
  }
  return slots;
}

function normalizeTimeValue(value) {
  if (!value) return "";
  const [hours = "00", minutes = "00"] = String(value).split(":");
  return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
}

function getServiceLabel(service) {
  return `${service.name} : ${formatRupiah(service.price)} (${service.displayDuration} menit)`;
}

function findServiceByValue(value) {
  if (!value) return null;

  return (
    SERVICES.find((service) => service.id === value) ||
    SERVICES.find((service) => value === getServiceLabel(service)) ||
    [...SERVICES]
      .sort((a, b) => b.name.length - a.name.length)
      .find((service) => String(value).includes(service.name)) ||
    null
  );
}

// --- Render ---

function renderServices() {
  const grid = document.getElementById("service-grid");
  const select = document.getElementById("service-select");

  grid.innerHTML = SERVICES.map(
    (s) => `
    <article class="service-card">
      <div class="service-visual" aria-hidden="true">
        <img src="${s.image}" alt="${s.name}" style="width:100%;height:100%;object-fit:cover;aspect-ratio:4/3;" />
      </div>
      <div class="service-content">
        <div class="service-top">
          <h3>${s.name}</h3>
          <span class="badge">${formatRupiah(s.price)}</span>
        </div>
        <p>${s.description}</p>
        <small>${s.displayDuration} menit</small>
      </div>
    </article>
  `,
  ).join("");

  select.innerHTML =
    '<option value="" selected disabled>Pilih layanan</option>' +
    SERVICES.map(
      (s) =>
        `<option value="${s.id}">${getServiceLabel(s)}</option>`,
    ).join("");
}

function renderTimeOptions(slots, unavailable = []) {
  const select = document.getElementById("time-select");
  select.innerHTML =
    '<option value="">Pilih jam</option>' +
    slots
      .map((t) => {
        const disabled = unavailable.includes(t);
        return `<option value="${t}" ${disabled ? "disabled" : ""}>${t}${disabled ? " (Full)" : ""}</option>`;
      })
      .join("");
}

function setupMap() {
  document.getElementById("map-embed").src = CONFIG.mapsEmbedUrl;
  document.getElementById("map-direct-link").href = CONFIG.mapsDirectUrl;
}

// --- Booking logic ---

async function getUnavailableSlots(date) {
  const { data: bookings, error } = await supabaseClient
    .from("bookings")
    .select("date, time, service")
    .eq("date", date);

  if (error) {
    console.error("Gagal mengambil slot booking:", error);
    return [];
  }

  if (!bookings?.length) return [];

  const blocked = [];

  bookings.forEach((b) => {
    const service = findServiceByValue(b.service);
    if (!service) return;

    const start = new Date(`${b.date}T${normalizeTimeValue(b.time)}`);
    if (Number.isNaN(start.getTime())) return;
    const end = new Date(start.getTime() + service.actualDuration * 60000);

    for (let t = new Date(start); t < end; t.setHours(t.getHours() + 1)) {
      const slot = String(t.getHours()).padStart(2, "0") + ":00";
      if (!blocked.includes(slot)) blocked.push(slot);
    }
  });

  return blocked;
}

function hasConflict(bookings, start, end) {
  return bookings.some((b) => {
    const service = findServiceByValue(b.service);
    if (!service) return false;
    const bStart = new Date(`${b.date}T${normalizeTimeValue(b.time)}`);
    if (Number.isNaN(bStart.getTime())) return false;
    const bEnd = new Date(bStart.getTime() + service.actualDuration * 60000);
    return start < bEnd && end > bStart;
  });
}

function setupBookingForm() {
  const form = document.getElementById("booking-form");
  const note = document.getElementById("form-note");
  const dateInput = form.querySelector('input[name="date"]');
  const slots = generateTimeSlots();

  dateInput.addEventListener("change", async () => {
    if (!dateInput.value) {
      renderTimeOptions(slots);
      return;
    }

    renderTimeOptions(slots);

    try {
      const unavailable = await getUnavailableSlots(dateInput.value);
      renderTimeOptions(slots, unavailable);
    } catch (error) {
      console.error("Gagal memuat opsi jam:", error);
      renderTimeOptions(slots);
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fd = new FormData(form);
    const name = fd.get("name");
    const customerPhone = fd.get("customerPhone") || "Tidak diisi";
    const serviceValue = fd.get("service");
    const date = fd.get("date");
    const time = fd.get("time");
    const notes = fd.get("notes") || "Tidak ada";

    const selectedService = findServiceByValue(serviceValue);
    const service = selectedService ? getServiceLabel(selectedService) : serviceValue;

    if (!selectedService) {
      alert("Treatment tidak dikenali. Silakan pilih ulang treatment.");
      return;
    }

    const start = new Date(`${date}T${normalizeTimeValue(time)}`);
    const end = new Date(
      start.getTime() + selectedService.actualDuration * 60000,
    );

    const { data: bookings, error: bookingsError } = await supabaseClient
      .from("bookings")
      .select("date, time, service")
      .eq("date", date);

    if (bookingsError) {
      alert("Jadwal belum bisa dicek sekarang. Coba beberapa saat lagi.");
      return;
    }

    if (hasConflict(bookings || [], start, end)) {
      alert("Slot bentrok, pilih waktu lain");
      return;
    }

    const { error } = await supabaseClient.from("bookings").insert([
      {
        name,
        phone: customerPhone,
        service,
        date,
        time,
        notes,
      },
    ]);

    if (error) {
      alert("Gagal simpan booking");
      return;
    }

    const message = [
      `Halo ${CONFIG.studioName}, saya ingin booking appointment.`,
      "",
      `Nama: ${name}`,
      `No HP: ${customerPhone}`,
      `Layanan: ${service}`,
      `Tanggal yang diinginkan: ${date}`,
      `Jam yang diinginkan: ${time}`,
      `Catatan: ${notes}`,
      "",
      "Mohon konfirmasi ketersediaannya. Terima kasih!",
    ].join("\n");

    const waLink = `https://wa.me/${toWANumber(CONFIG.whatsappNumber)}?text=${encodeURIComponent(message)}`;
    note.textContent = "Membuka WhatsApp dengan detail booking kamu...";
    window.open(waLink, "_blank", "noopener");
  });
}

// --- Init ---

renderServices();
setupMap();
setupBookingForm();
renderTimeOptions(generateTimeSlots());
