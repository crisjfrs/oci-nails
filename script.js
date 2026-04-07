const CONFIG = {
  studioName: "Oci.Nails",
  whatsappNumber: "15551234567",
  calendarEmbedUrl:
    "https://calendar.google.com/calendar/embed?height=600&wkst=1&ctz=Asia%2FJakarta&showPrint=0&hl=id&src=YnVjaW4wMTEwMjNAZ21haWwuY29t&color=%23039be5&mode=WEEK",
  calendarDirectUrl:
    "https://calendar.google.com/calendar/u/0?cid=YnVjaW4wMTEwMjNAZ21haWwuY29t",
  appointmentScheduleUrl: "https://calendar.app.google/YOUR_APPOINTMENT_LINK",
};

const SERVICES = [
  {
    id: "menicure-gel",
    name: "Menicure + Gel color",
    price: 35,
    duration: "60 min",
    description: "Basic nail care with gel color finish.",
  },
  {
    id: "pedicure-gel",
    name: "Pedicure + Gel color",
    price: 40,
    duration: "75 min",
    description: "Foot treatment and gel color application.",
  },
  {
    id: "press-on-custom",
    name: "Press on nails custom",
    price: 60,
    duration: "90 min",
    description: "Custom design press on nails based on your request.",
  },
  {
    id: "remove-gel-extension",
    name: "Remove Gel/Extension",
    price: 20,
    duration: "30 min",
    description: "Safe removal service for gel or nail extension.",
  },
];

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
    '<option value="" selected disabled>Select a service</option>' +
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

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const name = data.get("name");
    const customerPhone = data.get("customerPhone") || "Not provided";
    const service = data.get("service");
    const date = data.get("date");
    const time = data.get("time");
    const notes = data.get("notes") || "None";

    const message = [
      `Hello ${CONFIG.studioName}, I want to book an appointment.`,
      "",
      `Name: ${name}`,
      `Phone: ${customerPhone}`,
      `Service: ${service}`,
      `Preferred date: ${date}`,
      `Preferred time: ${time}`,
      `Notes: ${notes}`,
      "",
      "Please confirm availability. Thank you!",
    ].join("\n");

    const link = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;

    note.textContent = "Opening WhatsApp with your booking request...";
    window.open(link, "_blank", "noopener");
  });
}

renderServices();
setupCalendar();
setupBookingForm();
