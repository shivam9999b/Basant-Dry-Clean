// 1. Firebase Modules ko Import kiya (CDN ke zariye)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Aapka Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDJuljdehf1ItBjFbrsEeHSQ2gGGQTYHYw",
  authDomain: "basant-dry-clean.firebaseapp.com",
  projectId: "basant-dry-clean",
  storageBucket: "basant-dry-clean.firebasestorage.app",
  messagingSenderId: "79904087714",
  appId: "1:79904087714:web:cc044f80eeba4bfe84c1fb"
};

// Firebase aur Firestore Initialize karein
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Keys aur Variables (Pehle jaise hi hain)
const bookingKey = "freshpress-bookings";
const contentKey = "freshpress-content";
const settingsKey = "freshpress-settings";
const statuses = ["New", "Confirmed", "In Progress", "Completed", "Cancelled"];

const defaultContent = {
  businessName: "FreshPress Cloth Care",
  brandShort: "FP",
  navPhone: "+91 98765 43210",
  phoneHref: "+919876543210",
  hours: "Open daily, 8 AM - 9 PM",
  heroEyebrow: "Daily ironing and steam press service",
  heroTitle: "Clothes pressed crisp, packed neat, delivered on time.",
  heroText: "FreshPress handles shirts, sarees, suits, uniforms, and daily wear with careful heat settings, tidy folds, and doorstep pickup.",
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
    { title: "Daily Press", text: "Shirts, trousers, kurtas, uniforms, and children's clothes pressed for a clean daily look." },
    { title: "Steam Finish", text: "Gentle steam treatment for delicate fabrics, dresses, blazers, sarees, and festive outfits." },
    { title: "Bulk Orders", text: "Weekly family bundles, hostel uniforms, office wear, and shop stock handled with order tags." },
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
    { title: "Everyday", price: "Rs 12", unit: "/piece", text: "Shirts, trousers, T-shirts, kurtas, uniforms, and kidswear.", featured: false },
    { title: "Steam Care", price: "Rs 35", unit: "/piece", text: "Delicate garments, sarees, blazers, dresses, and premium fabrics.", featured: true },
    { title: "Family Bundle", price: "Rs 499", unit: "/50 pcs", text: "Weekly bundle with pickup, tagging, pressing, folding, and packing.", featured: false },
  ],
  bookingEyebrow: "Book today",
  bookingTitle: "Tell us what needs pressing.",
  bookingText: "Send a request and we will confirm pickup timing by phone or WhatsApp. For urgent orders, call directly.",
  heroImage: "assets/pressing-studio.png",
  heroImageAlt: "Pressed shirts and steam iron arranged in a clean cloth care studio",
};

const defaultSettings = { pickup: true, urgent: false, note: "" };

let content = structuredClone(defaultContent);
let globalBookings = []; // LocalStorage array ki jagah ab cloud data yahan store hoga
let dialog;

// DOM Elements
const bookingRows = document.querySelector("#bookingRows");
const emptyState = document.querySelector("#emptyState");
const searchInput = document.querySelector("#searchInput");
const statusFilter = document.querySelector("#statusFilter");
const contentStatus = document.querySelector("#contentStatus");

const fields = {
  total: document.querySelector("#totalBookings"),
  fresh: document.querySelector("#newBookings"),
  progress: document.querySelector("#progressBookings"),
  completed: document.querySelector("#completedBookings"),
  businessName: document.querySelector("#businessName"),
  brandShort: document.querySelector("#brandShort"),
  navPhone: document.querySelector("#navPhone"),
  phoneHref: document.querySelector("#phoneHref"),
  hours: document.querySelector("#hours"),
  heroEyebrow: document.querySelector("#heroEyebrow"),
  heroTitle: document.querySelector("#heroTitle"),
  heroText: document.querySelector("#heroText"),
  primaryCta: document.querySelector("#primaryCta"),
  secondaryCta: document.querySelector("#secondaryCta"),
  bookingEyebrow: document.querySelector("#bookingEyebrow"),
  bookingTitle: document.querySelector("#bookingTitle"),
  bookingText: document.querySelector("#bookingText"),
  heroImage: document.querySelector("#heroImage"),
  heroImageAlt: document.querySelector("#heroImageAlt"),
  heroImagePreview: document.querySelector("#heroImagePreview"),
  heroImageUpload: document.querySelector("#heroImageUpload"),
  servicesEyebrow: document.querySelector("#servicesEyebrow"),
  servicesTitle: document.querySelector("#servicesTitle"),
  processEyebrow: document.querySelector("#processEyebrow"),
  processTitle: document.querySelector("#processTitle"),
  pricingEyebrow: document.querySelector("#pricingEyebrow"),
  pricingTitle: document.querySelector("#pricingTitle"),
  pickup: document.querySelector("#pickupToggle"),
  urgent: document.querySelector("#urgentToggle"),
  note: document.querySelector("#closingNote"),
};

const editors = {
  stats: document.querySelector("#statsEditor"),
  promises: document.querySelector("#promisesEditor"),
  services: document.querySelector("#servicesEditor"),
  steps: document.querySelector("#stepsEditor"),
  prices: document.querySelector("#pricesEditor"),
};

// -----------------------------------------------------
// 🔥 FIREBASE REAL-TIME CLOUD FUNCTIONS (NEW CRITICAL CODE)
// -----------------------------------------------------

// Pure Data ko ek sath Firebase Cloud par update karne ke liye function
async function saveToCloud(docName, data) {
  try {
    await setDoc(doc(db, "freshpress", docName), { data: data });
  } catch (error) {
    console.error(`Firebase Save Error (${docName}):`, error);
  }
}

// Local helper functions ko cloud se replace kiya
const getBookings = () => globalBookings;
const saveBookings = (bookings) => saveToCloud(bookingKey, bookings);

// Formatting & Helper functions
const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const formatDate = (dateString) => {
  try {
    return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(dateString));
  } catch {
    return "N/A";
  }
};

const escapeCsv = (value) => `"${String(value || "").replaceAll('"', '""')}"`;

function mergeContent(saved) {
  return {
    ...structuredClone(defaultContent),
    ...saved,
    stats: saved?.stats || structuredClone(defaultContent.stats),
    promises: saved?.promises || structuredClone(defaultContent.promises),
    services: saved?.services || structuredClone(defaultContent.services),
    steps: saved?.steps || structuredClone(defaultContent.steps),
    prices: saved?.prices || structuredClone(defaultContent.prices),
  };
}

function renderStats(bookings) {
  fields.total.textContent = bookings.length;
  fields.fresh.textContent = bookings.filter((booking) => booking.status === "New").length;
  fields.progress.textContent = bookings.filter((booking) => booking.status === "In Progress").length;
  fields.completed.textContent = bookings.filter((booking) => booking.status === "Completed").length;
}

function setSimpleFields() {
  [
    "businessName", "brandShort", "navPhone", "phoneHref", "hours",
    "heroEyebrow", "heroTitle", "heroText", "primaryCta", "secondaryCta",
    "bookingEyebrow", "bookingTitle", "bookingText", "heroImage", "heroImageAlt",
    "servicesEyebrow", "servicesTitle", "processEyebrow", "processTitle", "pricingEyebrow", "pricingTitle",
  ].forEach((key) => {
    if (fields[key]) fields[key].value = content[key] || "";
  });
  updateHeroPreview();
}

function readSimpleFields() {
  Object.keys(fields).forEach((key) => {
    if (fields[key] && content[key] !== undefined && "value" in fields[key]) {
      content[key] = fields[key].value.trim();
    }
  });
}

function renderRepeatEditors() {
  if (!editors.stats) return;
  editors.stats.innerHTML = content.stats.map((item, index) => `
    <div class="repeat-card" data-list="stats" data-index="${index}">
      <label>Value<input data-field="value" type="text" value="${escapeHtml(item.value)}" /></label>
      <label>Label<input data-field="label" type="text" value="${escapeHtml(item.label)}" /></label>
      <button class="button danger" data-remove type="button">Remove</button>
    </div>
  `).join("");

  editors.promises.innerHTML = content.promises.map((item, index) => `
    <div class="repeat-card" data-list="promises" data-index="${index}">
      <label>Promise<input data-field="text" type="text" value="${escapeHtml(item)}" /></label>
      <span></span>
      <button class="button danger" data-remove type="button">Remove</button>
    </div>
  `).join("");

  editors.services.innerHTML = content.services.map((item, index) => `
    <div class="repeat-card" data-list="services" data-index="${index}">
      <label>Service name<input data-field="title" type="text" value="${escapeHtml(item.title)}" /></label>
      <label>Description<textarea data-field="text" rows="2">${escapeHtml(item.text)}</textarea></label>
      <button class="button danger" data-remove type="button">Remove</button>
    </div>
  `).join("");

  editors.steps.innerHTML = content.steps.map((item, index) => `
    <div class="repeat-card" data-list="steps" data-index="${index}">
      <label>Step name<input data-field="title" type="text" value="${escapeHtml(item.title)}" /></label>
      <label>Description<textarea data-field="text" rows="2">${escapeHtml(item.text)}</textarea></label>
      <button class="button danger" data-remove type="button">Remove</button>
    </div>
  `).join("");

  editors.prices.innerHTML = content.prices.map((item, index) => `
    <div class="repeat-card wide" data-list="prices" data-index="${index}">
      <label>Name<input data-field="title" type="text" value="${escapeHtml(item.title)}" /></label>
      <label>Price<input data-field="price" type="text" value="${escapeHtml(item.price)}" /></label>
      <label>Unit<input data-field="unit" type="text" value="${escapeHtml(item.unit)}" /></label>
      <label>Description<textarea data-field="text" rows="2">${escapeHtml(item.text)}</textarea></label>
      <label class="checkbox-label"><input data-field="featured" type="checkbox" ${item.featured ? "checked" : ""} /> Featured</label>
      <button class="button danger" data-remove type="button">Remove</button>
    </div>
  `).join("");
}

function syncRepeatEditors() {
  document.querySelectorAll("[data-list]").forEach((card) => {
    const list = card.dataset.list;
    const index = Number(card.dataset.index);
    if (list === "promises") {
      content.promises[index] = card.querySelector("[data-field='text']").value.trim();
      return;
    }
    card.querySelectorAll("[data-field]").forEach((input) => {
      const field = input.dataset.field;
      content[list][index][field] = input.type === "checkbox" ? input.checked : input.value.trim();
    });
  });
}

function saveContent(message = "Website content saved. Refresh the website tab to see updates.") {
  readSimpleFields();
  syncRepeatEditors();
  saveToCloud(contentKey, content); // Save to cloud
  if (contentStatus) contentStatus.textContent = message;
}

function updateHeroPreview() {
  if (fields.heroImagePreview && fields.heroImage) {
    fields.heroImagePreview.src = fields.heroImage.value.trim() || defaultContent.heroImage;
    fields.heroImagePreview.alt = fields.heroImageAlt.value.trim() || defaultContent.heroImageAlt;
  }
}

function resetHeroImage() {
  fields.heroImage.value = defaultContent.heroImage;
  fields.heroImageAlt.value = defaultContent.heroImageAlt;
  updateHeroPreview();
  saveContent("Default photo restored.");
}

function uploadHeroImage(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    fields.heroImage.value = reader.result;
    if (!fields.heroImageAlt.value.trim()) {
      fields.heroImageAlt.value = file.name.replace(/\.[^.]+$/, "").replaceAll("-", " ");
    }
    updateHeroPreview();
    saveContent("Uploaded photo saved. Refresh the website tab to see it.");
  });
  reader.readAsDataURL(file);
}

function addItem(list) {
  syncRepeatEditors();
  const itemMap = {
    stats: { value: "New", label: "highlight" },
    promises: "New promise",
    services: { title: "New Service", text: "Describe this service." },
    steps: { title: "New Step", text: "Describe this step." },
    prices: { title: "New Plan", price: "Rs 0", unit: "/piece", text: "Describe this price.", featured: false },
  };
  content[list].push(itemMap[list]);
  renderRepeatEditors();
}

function removeItem(card) {
  const list = card.dataset.list;
  const index = Number(card.dataset.index);
  syncRepeatEditors();
  content[list].splice(index, 1);
  renderRepeatEditors();
}

function getFilteredBookings() {
  const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
  const status = statusFilter ? statusFilter.value : "All";

  return getBookings().filter((booking) => {
    const matchesStatus = status === "All" || booking.status === status;
    const haystack = `${booking.id} ${booking.name} ${booking.phone} ${booking.service}`.toLowerCase();
    return matchesStatus && (!query || haystack.includes(query));
  });
}

function renderBookings() {
  if (!bookingRows) return;
  const allBookings = getBookings();
  const bookings = getFilteredBookings();
  renderStats(allBookings);

  bookingRows.innerHTML = bookings.map((booking) => `
    <tr>
      <td><strong>${escapeHtml(booking.id)}</strong></td>
      <td>
        <strong>${escapeHtml(booking.name)}</strong><br />
        <span>${escapeHtml(booking.phone)}</span>
      </td>
      <td>${escapeHtml(booking.service)}</td>
      <td>${escapeHtml(booking.details || "No details added")}</td>
      <td>
        <select class="status-select" data-id="${escapeHtml(booking.id)}" aria-label="Status for ${escapeHtml(booking.id)}">
          ${statuses.map((status) => `<option ${status === booking.status ? "selected" : ""}>${status}</option>`).join("")}
        </select>
      </td>
      <td>${formatDate(booking.createdAt)}</td>
      <td>
        <div class="row-actions">
          <button class="button" data-edit="${escapeHtml(booking.id)}" type="button">Edit</button>
          <button class="button danger" data-delete="${escapeHtml(booking.id)}" type="button">Delete</button>
        </div>
      </td>
    </tr>
  `).join("");

  if (emptyState) emptyState.classList.toggle("visible", bookings.length === 0);
}

function updateBookingStatus(id, status) {
  const bookings = getBookings().map((booking) =>
    booking.id === id ? { ...booking, status, updatedAt: new Date().toISOString() } : booking
  );
  saveBookings(bookings);
}

function deleteBooking(id) {
  const confirmed = window.confirm(`Delete booking ${id}?`);
  if (!confirmed) return;
  saveBookings(getBookings().filter((booking) => booking.id !== id));
}

function openBookingDialog(id = "") {
  if (!dialog) {
    const template = document.querySelector("#bookingDialogTemplate");
    document.body.append(template.content.cloneNode(true));
    dialog = document.querySelector(".dialog");
    document.querySelector("#saveBookingDialog").addEventListener("click", saveDialogBooking);
  }

  const booking = getBookings().find((item) => item.id === id) || {
    id: "", name: "", phone: "", service: "", details: "", status: "New",
  };

  document.querySelector("#dialogTitle").textContent = id ? "Edit booking" : "Add booking";
  document.querySelector("#dialogBookingId").value = booking.id;
  document.querySelector("#dialogName").value = booking.name;
  document.querySelector("#dialogPhone").value = booking.phone;
  document.querySelector("#dialogService").value = booking.service;
  document.querySelector("#dialogDetails").value = booking.details;
  document.querySelector("#dialogStatus").value = booking.status;
  dialog.showModal();
}

function saveDialogBooking() {
  const id = document.querySelector("#dialogBookingId").value || `FP-${Date.now().toString().slice(-6)}`;
  const existing = getBookings();
  const oldBooking = existing.find((booking) => booking.id === id);
  const nextBooking = {
    id,
    name: document.querySelector("#dialogName").value.trim(),
    phone: document.querySelector("#dialogPhone").value.trim(),
    service: document.querySelector("#dialogService").value.trim(),
    details: document.querySelector("#dialogDetails").value.trim(),
    status: document.querySelector("#dialogStatus").value,
    createdAt: oldBooking?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!nextBooking.name || !nextBooking.phone || !nextBooking.service) return;

  const bookings = oldBooking
    ? existing.map((booking) => (booking.id === id ? nextBooking : booking))
    : [nextBooking, ...existing];

  saveBookings(bookings);
  dialog.close();
}

function seedData() {
  if (getBookings().length > 0) return;
  saveBookings([
    { id: "FP-108241", name: "Anita Sharma", phone: "9876543210", service: "Family Bundle", details: "48 pieces, pickup from Sector 12 after 6 PM", status: "Confirmed", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "FP-108242", name: "Rahul Mehta", phone: "9988776655", service: "Steam Care", details: "2 blazers and 1 saree, urgent if possible", status: "In Progress", createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date().toISOString() },
    { id: "FP-108243", name: "City Uniforms", phone: "9123456780", service: "Bulk Order", details: "120 school shirts, delivery Friday", status: "New", createdAt: new Date(Date.now() - 172800000).toISOString(), updatedAt: new Date().toISOString() },
  ]);
}

function exportCsv() {
  const bookings = getFilteredBookings();
  const rows = [
    ["Order", "Name", "Phone", "Service", "Details", "Status", "Date"],
    ...bookings.map((booking) => [booking.id, booking.name, booking.phone, booking.service, booking.details, booking.status, formatDate(booking.createdAt)]),
  ];
  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
  downloadText("freshpress-bookings.csv", csv, "text/csv;charset=utf-8");
}

function downloadText(filename, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function saveSettings() {
  saveToCloud(settingsKey, {
    pickup: fields.pickup.checked,
    urgent: fields.urgent.checked,
    note: fields.note.value.trim(),
  });
}

function exportAllData() {
  saveContent("All data prepared for export.");
  const data = {
    content: content,
    settings: { pickup: fields.pickup.checked, urgent: fields.urgent.checked, note: fields.note.value.trim() },
    bookings: getBookings(),
    exportedAt: new Date().toISOString(),
  };
  downloadText("freshpress-admin-data.json", JSON.stringify(data, null, 2), "application/json;charset=utf-8");
}

function importAllData(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const data = JSON.parse(reader.result);
      if (data.content) saveToCloud(contentKey, mergeContent(data.content));
      if (data.settings) saveToCloud(settingsKey, { ...defaultSettings, ...data.settings });
      if (Array.isArray(data.bookings)) saveBookings(data.bookings);
      if (contentStatus) contentStatus.textContent = "Imported admin data to Cloud.";
    } catch {
      if (contentStatus) contentStatus.textContent = "Import failed. Choose a valid FreshPress JSON file.";
    }
  });
  reader.readAsText(file);
}

function resetContent() {
  if (!window.confirm("Reset website content to default text?")) return;
  saveToCloud(contentKey, defaultContent);
}

function clearBookings() {
  if (!window.confirm("Clear all bookings?")) return;
  saveBookings([]);
}

// -----------------------------------------------------
// 🎧 AUTOMATIC REAL-TIME CLOUD LISTENER (REPLACED loadAll)
// -----------------------------------------------------
function startRealTimeSync() {
  // 1. Listen Bookings
  onSnapshot(doc(db, "freshpress", bookingKey), (docSnap) => {
    globalBookings = docSnap.exists() ? (docSnap.data().data || []) : [];
    renderBookings();
  });

  // 2. Listen Content
  onSnapshot(doc(db, "freshpress", contentKey), (docSnap) => {
    content = mergeContent(docSnap.exists() ? docSnap.data().data : defaultContent);
    setSimpleFields();
    renderRepeatEditors();
  });

  // 3. Listen Settings
  onSnapshot(doc(db, "freshpress", settingsKey), (docSnap) => {
    const settings = docSnap.exists() ? (docSnap.data().data || defaultSettings) : defaultSettings;
    fields.pickup.checked = settings.pickup;
    fields.urgent.checked = settings.urgent;
    fields.note.value = settings.note;
  });
}

// Event Listeners (Bina kisi badlaav ke)
document.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add]");
  const removeButton = event.target.closest("[data-remove]");
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");

  if (addButton) addItem(addButton.dataset.add);
  if (removeButton) removeItem(removeButton.closest("[data-list]"));
  if (editButton) openBookingDialog(editButton.dataset.edit);
  if (deleteButton) deleteBooking(deleteButton.dataset.delete);
});

if (bookingRows) {
  bookingRows.addEventListener("change", (event) => {
    if (event.target.matches(".status-select")) {
      updateBookingStatus(event.target.dataset.id, event.target.value);
    }
  });
}

if (searchInput) searchInput.addEventListener("input", renderBookings);
if (statusFilter) statusFilter.addEventListener("change", renderBookings);

document.querySelector("#seedData").addEventListener("click", seedData);
document.querySelector("#addBooking").addEventListener("click", () => openBookingDialog());
document.querySelector("#exportCsv").addEventListener("click", exportCsv);
document.querySelector("#applyHeroImage").addEventListener("click", updateHeroPreview);
document.querySelector("#resetHeroImage").addEventListener("click", resetHeroImage);
fields.heroImageUpload.addEventListener("change", (event) => uploadHeroImage(event.target.files[0]));

document.querySelector("#saveAll").addEventListener("click", () => {
  saveContent();
  saveSettings();
});
document.querySelector("#exportData").addEventListener("click", exportAllData);
document.querySelector("#importData").addEventListener("change", (event) => importAllData(event.target.files[0]));
document.querySelector("#resetContent").addEventListener("click", resetContent);
document.querySelector("#clearBookings").addEventListener("click", clearBookings);

[fields.pickup, fields.urgent, fields.note].forEach((field) => {
  if (field) {
    field.addEventListener("change", saveSettings);
    field.addEventListener("input", saveSettings);
  }
});

// Start syncing data in real-time from Firebase Cloud!
startRealTimeSync();
