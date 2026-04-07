const CONFIG = {
  studioName: "Oci.Nails",
  whatsappNumber: "6281222773865",
  calendarEmbedUrl:
    "https://calendar.google.com/calendar/embed?height=600&wkst=1&ctz=Asia%2FJakarta&showPrint=0&hl=id&src=YnVjaW4wMTEwMjNAZ21haWwuY29t&color=%23039be5&mode=WEEK",
  calendarDirectUrl:
    "https://calendar.google.com/calendar/u/0?cid=YnVjaW4wMTEwMjNAZ21haWwuY29t",
  appointmentScheduleUrl: "https://calendar.app.google/YOUR_APPOINTMENT_LINK",
};

const SERVICES = [
  {
    id: "menicure-gel",
    name: "Manicure + Gel Color",
    price: 35,
    duration: "60 menit",
    description: "Perawatan dasar kuku dengan hasil akhir gel color.",
  },
  {
    id: "pedicure-gel",
    name: "Pedicure + Gel Color",
    price: 40,
    duration: "75 menit",
    description: "Perawatan kaki sekaligus aplikasi gel color.",
  },
  {
    id: "press-on-custom",
    name: "Press On Nails Custom",
    price: 60,
    duration: "90 menit",
    description: "Pembuatan press on nails custom sesuai request.",
  },
  {
    id: "remove-gel-extension",
    name: "Remove Gel/Extension",
    price: 20,
    duration: "30 menit",
    description: "Layanan pelepasan gel atau extension dengan aman.",
  },
];

function normalizeWhatsAppNumber(rawNumber) {
  const digitsOnly = String(rawNumber || "").replace(/\D/g, "");

  if (!digitsOnly) return "";
  if (digitsOnly.startsWith("62")) return digitsOnly;
  if (digitsOnly.startsWith("0")) return `62${digitsOnly.slice(1)}`;
  if (digitsOnly.startsWith("8")) return `62${digitsOnly}`;

  return digitsOnly;
}

function renderServices() {
  const grid = document.getElementById("service-grid");
  const select = document.getElementById("service-select");

  grid.innerHTML = SERVICES.map(
    (service) => `
      <article class="service-card">
        <div class="service-visual" aria-hidden="true"></div>
        <div class="service-content">
          <div class="service-top">
            <h3>${service.name}</h3>
            <span class="badge">$${service.price}</span>
          </div>
          <p>${service.description}</p>
          <small>${service.duration}</small>
        </div>
      </article>
    `
  ).join("");

  select.innerHTML =
    '<option value="" selected disabled>Pilih layanan</option>' +
    SERVICES.map(
      (service) =>
        `<option value="${service.name} ($${service.price})">${service.name} - $${service.price} (${service.duration})</option>`
    ).join("");
}

function setupCalendar() {
  const embed = document.getElementById("calendar-embed");
  const direct = document.getElementById("calendar-direct-link");
  const headerLink = document.getElementById("open-calendar-link");

  embed.src = CONFIG.calendarEmbedUrl;
  direct.href = CONFIG.appointmentScheduleUrl || CONFIG.calendarDirectUrl;
  headerLink.href = CONFIG.appointmentScheduleUrl || "#schedule";
}

function setupBookingForm() {
  const form = document.getElementById("booking-form");
  const note = document.getElementById("form-note");
  const targetNumber = normalizeWhatsAppNumber(CONFIG.whatsappNumber);

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const name = data.get("name");
    const customerPhone = data.get("customerPhone") || "Tidak diisi";
    const service = data.get("service");
    const date = data.get("date");
    const time = data.get("time");
    const notes = data.get("notes") || "Tidak ada";

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

    const link = `https://wa.me/${targetNumber}?text=${encodeURIComponent(message)}`;

    note.textContent = "Membuka WhatsApp dengan detail booking kamu...";
    window.open(link, "_blank", "noopener");
  });
}

renderServices();
setupCalendar();
setupBookingForm();
