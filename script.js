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
  instagramUrl: "https://instagram.com/oci.nailsss",
  tiktokUrl: "https://www.tiktok.com/@oci.nails",
};

const SERVICES = [
  {
    id: "menicure",
    name: "Manicure",
    price: 30000,
    displayDuration: 30,
    actualDuration: 60,
    description: "Perawatan dasar kuku tanpa gel color.",
    image: "img/treatment/menicure.jpg",
  },
  {
    id: "menicure-gel",
    name: "Manicure + Gel Color",
    price: [60000, 300000],
    displayDuration: 60,
    actualDuration: 120,
    description: "Perawatan dasar kuku dengan hasil akhir gel color.",
    image: "img/treatment/menicure-gel.jpg",
  },
  {
    id: "pedicure",
    name: "Pedicure",
    price: 30000,
    displayDuration: 30,
    actualDuration: 60,
    description: "Perawatan kaki tanpa gel color.",
    image: "img/treatment/pedicure.jpg",
  },
  {
    id: "pedicure-gel",
    name: "Pedicure + Gel Color",
    price: [60000, 300000],
    displayDuration: 60,
    actualDuration: 120,
    description: "Perawatan kaki sekaligus aplikasi gel color.",
    image: "img/treatment/pedicure-gel.jpg",
  },
  {
    id: "press-on-custom",
    name: "Press On Nails Custom",
    price: [50000, 300000],
    displayDuration: 60,
    actualDuration: 120,
    description: "Pembuatan press on nails custom sesuai request.",
    image: "img/treatment/press-on-custom.jpg",
  },
  {
    id: "remove-gel-extension",
    name: "Remove Gel/Extension",
    price: [30000, 40000],
    displayDuration: 30,
    actualDuration: 60,
    description: "Layanan pelepasan gel atau extension dengan aman.",
    image: "img/treatment/remove-gel-extension.jpg",
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

function formatRupiah(price) {
  if (Array.isArray(price)) {
    return (
      "Rp" +
      Number(price[0]).toLocaleString("id-ID") +
      "–" +
      Number(price[1]).toLocaleString("id-ID")
    );
  }
  return "Rp" + Number(price).toLocaleString("id-ID");
}

function renderServices() {
  const grid = document.getElementById("service-grid");
  const select = document.getElementById("service-select");

  grid.innerHTML = SERVICES.map(
    (service) => `
      <article class="service-card">
        <div class="service-visual" aria-hidden="true">
          <img src="${service.image}" alt="${service.name}" style="width:100%;height:100%;object-fit:cover;aspect-ratio:4/3;" />
        </div>
        <div class="service-content">
          <div class="service-top">
            <h3>${service.name}</h3>
            <span class="badge">${formatRupiah(service.price)}</span>
          </div>
          <p>${service.description}</p>
          <small>${service.displayDuration} menit</small>
        </div>
      </article>
    `,
  ).join("");

  select.innerHTML =
    '<option value="" selected disabled>Pilih layanan</option>' +
    SERVICES.map(
      (service) =>
        `<option value="${service.name} (${formatRupiah(service.price)})">${service.name} : ${formatRupiah(service.price)} (${service.displayDuration} menit)</option>`,
    ).join("");
}

function generateTimeSlots() {
  const slots = [];

  for (let hour = 9; hour <= 18; hour++) {
    const time = `${String(hour).padStart(2, "0")}:00`;
    slots.push(time);
  }

  return slots;
}

function renderTimeOptions(slots) {
  const select = document.getElementById("time-select");

  select.innerHTML =
    '<option value="">Pilih jam</option>' +
    slots.map((t) => `<option value="${t}">${t}</option>`).join("");
}

function setupMap() {
  const embed = document.getElementById("map-embed");
  const direct = document.getElementById("map-direct-link");
  const headerLink = document.getElementById("open-map-link");

  embed.src = CONFIG.mapsEmbedUrl;
  direct.href = CONFIG.mapsDirectUrl;
  headerLink.href = "#location";
}

function setupSocialLinks() {
  const instagramLink = document.getElementById("instagram-link");
  const tiktokLink = document.getElementById("tiktok-link");

  if (instagramLink) {
    instagramLink.href = CONFIG.instagramUrl;
  }

  if (tiktokLink) {
    tiktokLink.href = CONFIG.tiktokUrl;
  }
}

function setupBookingForm() {
  const form = document.getElementById("booking-form");
  const note = document.getElementById("form-note");
  const targetNumber = normalizeWhatsAppNumber(CONFIG.whatsappNumber);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const name = data.get("name");
    const customerPhone = data.get("customerPhone") || "Tidak diisi";
    const service = data.get("service");
    const date = data.get("date");
    const time = data.get("time");
    const notes = data.get("notes") || "Tidak ada";

    const selectedService = SERVICES.find((s) => service.includes(s.name));

    const duration = selectedService.actualDuration;

    const start = new Date(`${date}T${time}`);
    const end = new Date(start.getTime() + duration * 60000);

    const { data: bookings } = await supabaseClient
      .from("bookings")
      .select("*")
      .eq("date", date);

    const isConflict = (bookings || []).some((b) => {
      const bStart = new Date(`${b.date}T${b.time}`);

      const bService = SERVICES.find((s) => b.service.includes(s.name));

      if (!bService) return false;

      const bEnd = new Date(bStart.getTime() + bService.actualDuration * 60000);

      return start < bEnd && end > bStart;
    });

    if (isConflict) {
      alert("Slot bentrok, pilih waktu lain");
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

    const payload = {
      name,
      phone: customerPhone,
      service,
      date,
      time,
      notes,
    };

    const { error } = await supabaseClient.from("bookings").insert([payload]);

    if (error) {
      alert("Gagal simpan booking");
      return;
    }

    const link = `https://wa.me/${targetNumber}?text=${encodeURIComponent(message)}`;

    note.textContent = "Membuka WhatsApp dengan detail booking kamu...";
    window.open(link, "_blank", "noopener");
  });
}

renderServices();
setupMap();
setupSocialLinks();
setupBookingForm();

const slots = generateTimeSlots();
renderTimeOptions(slots);
