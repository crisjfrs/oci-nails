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
    `,
  ).join("");

  select.innerHTML =
    '<option value="" selected disabled>Pilih layanan</option>' +
    SERVICES.map(
      (service) =>
        `<option value="${service.name} ($${service.price})">${service.name} - $${service.price} (${service.duration})</option>`,
    ).join("");
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

    const { data: existing } = await supabaseClient
      .from("bookings")
      .select("*")
      .eq("date", date)
      .eq("time", time);

    if (existing.length > 0) {
      alert("Maaf, slot sudah dibooking. Silakan pilih waktu lain.");
      return;
    }

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
