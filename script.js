const bookingKey = "freshpress-bookings";
const contentKey = "freshpress-content";

const defaultContent = {
  businessName: "FreshPress Cloth Care",
  brandShort: "FP",
  navPhone: "+91 98765 43210",
  phoneHref: "+919876543210",
  hours: "Open daily, 8 AM - 9 PM",
  heroEyebrow: "Daily ironing and steam press service",
  heroTitle: "Clothes pressed crisp, packed neat, delivered on time.",
  heroText:
    "FreshPress handles shirts, sarees, suits, uniforms, and daily wear with careful heat settings, tidy folds, and doorstep pickup.",
  primaryCta: "Book pickup",
  secondaryCta: "View rates",
  stats: [
    { value: "24 hr", label: "turnaround" },
    { value: "4.9/5", label: "rating" },
    { value: "7 days", label: "open" },
  ],
  promises: ["Heat-safe pressing", "Tagged orders", "Neat folding", "Pickup available"],
  servicesEyebrow: "What we press",
  servicesTitle: "Care for everyday clothes and occasion wear.",
  services: [
    {
      title: "Daily Press",
      text: "Shirts, trousers, kurtas, uniforms, and children's clothes pressed for a clean daily look.",
    },
    {
      title: "Steam Finish",
      text: "Gentle steam treatment for delicate fabrics, dresses, blazers, sarees, and festive outfits.",
    },
    {
      title: "Bulk Orders",
      text: "Weekly family bundles, hostel uniforms, office wear, and shop stock handled with order tags.",
    },
  ],
  processEyebrow: "How it works",
  processTitle: "Simple pickup, clear tracking, fresh delivery.",
  steps: [
    { title: "Schedule", text: "Choose pickup time and share garment count." },
    { title: "Press", text: "We sort by fabric type and press at suitable heat." },
    { title: "Deliver", text: "Your clothes arrive folded, packed, and ready to wear." },
  ],
  pricingEyebrow: "Transparent rates",
  pricingTitle: "Pick the plan that matches your wardrobe.",
  prices: [
    {
      title: "Everyday",
      price: "Rs 12",
      unit: "/piece",
      text: "Shirts, trousers, T-shirts, kurtas, uniforms, and kidswear.",
      featured: false,
    },
    {
      title: "Steam Care",
      price: "Rs 35",
      unit: "/piece",
      text: "Delicate garments, sarees, blazers, dresses, and premium fabrics.",
      featured: true,
    },
    {
      title: "Family Bundle",
      price: "Rs 499",
      unit: "/50 pcs",
      text: "Weekly bundle with pickup, tagging, pressing, folding, and packing.",
      featured: false,
    },
  ],
  bookingEyebrow: "Book today",
  bookingTitle: "Tell us what needs pressing.",
  bookingText:
    "Send a request and we will confirm pickup timing by phone or WhatsApp. For urgent orders, call directly.",
  heroImage: "assets/pressing-studio.png",
  heroImageAlt: "Pressed shirts and steam iron arranged in a clean cloth care studio",
};

const readJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const getBookings = () => readJson(bookingKey, []);
const saveBookings = (bookings) => writeJson(bookingKey, bookings);
const getContent = () => ({ ...defaultContent, ...readJson(contentKey, defaultContent) });
const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) {
    element.textContent = value;
  }
}

function renderContent() {
  const content = getContent();

  document.title = content.businessName;
  setText(".brand-mark", content.brandShort);
  setText(".brand span:last-child", content.businessName.replace(" Cloth Care", ""));
  setText(".nav-call", "Call Now");
  document.querySelector(".nav-call")?.setAttribute("href", `tel:${content.phoneHref}`);
  setText(".hero .eyebrow", content.heroEyebrow);
  setText("h1", content.heroTitle);
  setText(".hero-text", content.heroText);
  setText(".hero-actions .primary", content.primaryCta);
  setText(".hero-actions .secondary", content.secondaryCta);
  setText("#services .eyebrow", content.servicesEyebrow);
  setText("#services h2", content.servicesTitle);
  setText(".process .eyebrow", content.processEyebrow);
  setText(".process h2", content.processTitle);
  setText("#pricing .eyebrow", content.pricingEyebrow);
  setText("#pricing h2", content.pricingTitle);
  setText(".booking-copy .eyebrow", content.bookingEyebrow);
  setText(".booking-copy h2", content.bookingTitle);
  setText(".booking-copy p:not(.eyebrow)", content.bookingText);
  setText(".phone-link", content.navPhone);
  document.querySelector(".phone-link")?.setAttribute("href", `tel:${content.phoneHref}`);
  setText(".site-footer span:first-child", content.businessName);
  setText(".site-footer span:last-child", content.hours);

  const heroImage = document.querySelector(".hero-media img");
  if (heroImage) {
    heroImage.src = content.heroImage || defaultContent.heroImage;
    heroImage.alt = content.heroImageAlt || defaultContent.heroImageAlt;
  }

  const stats = document.querySelector(".hero-stats");
  if (stats) {
    stats.innerHTML = content.stats
      .map((item) => `<span><strong>${escapeHtml(item.value)}</strong> ${escapeHtml(item.label)}</span>`)
      .join("");
  }

  const promises = document.querySelector(".trust-strip");
  if (promises) {
    promises.innerHTML = content.promises.map((item) => `<span>${escapeHtml(item)}</span>`).join("");
  }

  const services = document.querySelector(".service-grid");
  if (services) {
    services.innerHTML = content.services
      .map(
        (service, index) => `
          <article class="service-card">
            <span class="icon">${String(index + 1).padStart(2, "0")}</span>
            <h3>${escapeHtml(service.title)}</h3>
            <p>${escapeHtml(service.text)}</p>
          </article>
        `
      )
      .join("");
  }

  const steps = document.querySelector(".steps");
  if (steps) {
    steps.innerHTML = content.steps
      .map(
        (step) => `
          <li>
            <strong>${escapeHtml(step.title)}</strong>
            <span>${escapeHtml(step.text)}</span>
          </li>
        `
      )
      .join("");
  }

  const prices = document.querySelector(".pricing-grid");
  if (prices) {
    prices.innerHTML = content.prices
      .map(
        (item) => `
          <article class="price-card ${item.featured ? "featured" : ""}">
            <h3>${escapeHtml(item.title)}</h3>
            <p class="price">${escapeHtml(item.price)}<span>${escapeHtml(item.unit)}</span></p>
            <p>${escapeHtml(item.text)}</p>
          </article>
        `
      )
      .join("");
  }

  const serviceSelect = document.querySelector('select[name="service"]');
  if (serviceSelect) {
    serviceSelect.innerHTML =
      '<option value="">Select service</option>' +
      content.services.map((service) => `<option>${escapeHtml(service.title)}</option>`).join("") +
      '<option>Bulk Order</option>';
  }
}

function bindBookingForm() {
  const form = document.querySelector("#bookingForm");
  const statusMessage = document.querySelector("#formStatus");

  if (!form || !statusMessage) {
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const name = formData.get("name").toString().trim();
    const service = formData.get("service").toString().trim();
    const phone = formData.get("phone").toString().trim();
    const details = formData.get("details").toString().trim();
    const bookings = getBookings();

    bookings.unshift({
      id: `FP-${Date.now().toString().slice(-6)}`,
      name,
      phone,
      service,
      details,
      status: "New",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    saveBookings(bookings);

    statusMessage.textContent = `Thanks, ${name}. Your ${service} request is ready to confirm by phone.`;
    form.reset();
  });
}

renderContent();
bindBookingForm();
