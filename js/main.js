// Set this to the Cloudflare Worker URL after `wrangler deploy`
// (see cloudflare-worker/README.md). Left blank, the form will show an
// error instead of silently failing.
const FORM_ENDPOINT = "https://604torridon-interest-form.drjkarl.workers.dev";

const money = (n) => (typeof n === "number" ? `$${n.toLocaleString("en-US")}` : n);

const ICONS = {
  beds: '<svg viewBox="0 0 24 24"><path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6"/><path d="M3 18v2M21 18v2"/><path d="M3 12V7a1 1 0 0 1 1-1h7v6"/><circle cx="7.5" cy="9" r="1.3"/></svg>',
  baths: '<svg viewBox="0 0 24 24"><path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3Z"/><path d="M4 12V7a2 2 0 0 1 2-2c1 0 1.6.5 2 1"/><path d="M6 19v2M16 19v2"/></svg>',
  sqft: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="1.5"/><path d="M4 9h3M4 15h3M20 9h-3M20 15h-3M9 4v3M15 4v3M9 20v-3M15 20v-3"/></svg>',
  lot: '<svg viewBox="0 0 24 24"><path d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.3"/></svg>',
  year: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="16" rx="1.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  garage: '<svg viewBox="0 0 24 24"><path d="M3 21V9.5L12 4l9 5.5V21"/><path d="M5.5 21V12h13v9"/><path d="M8 16h8"/></svg>',
  stories: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="7" rx="1"/><rect x="4" y="13" width="16" height="7" rx="1"/></svg>',
  hoa: '<svg viewBox="0 0 24 24"><path d="M4 21V10l8-6 8 6v11"/><path d="M9 21v-6h6v6"/></svg>',
  parcel: '<svg viewBox="0 0 24 24"><path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8l-5-5Z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>',
  tax: '<svg viewBox="0 0 24 24"><path d="M6 3h9l3 3v15H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M9 9h6M9 13h6M9 17h3"/></svg>',
  school: '<svg viewBox="0 0 24 24"><path d="M12 3 2 8l10 5 10-5-10-5Z"/><path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"/><path d="M22 8v6"/></svg>',
};

async function loadJSON(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

function iconFact(icon, label, value) {
  const wrap = document.createElement("div");
  wrap.className = "fact";
  wrap.innerHTML = `<span class="fact-icon" aria-hidden="true">${icon}</span>`;
  const text = document.createElement("div");
  const dt = document.createElement("dt");
  dt.textContent = label;
  const dd = document.createElement("dd");
  dd.textContent = value;
  text.append(dt, dd);
  wrap.appendChild(text);
  return wrap;
}

function renderListing(listing) {
  document.querySelectorAll("#price, #terms-price").forEach((el) => {
    el.textContent = money(listing.price);
  });

  const f = listing.facts;
  const items = [
    ["beds", "Beds", f.beds],
    ["baths", "Baths", [f.bathsFull, f.bathsHalf && `${f.bathsHalf} half`].filter(Boolean).join(" full, ") || undefined],
    ["sqft", "Square footage", typeof f.sqft === "number" ? `${f.sqft.toLocaleString("en-US")} sq ft` : f.sqft],
    ["lot", "Lot size", f.lotSize],
    ["year", "Year built", f.yearBuilt],
    ["garage", "Garage", f.garage],
    ["stories", "Stories", f.stories],
    ["hoa", "HOA dues", typeof f.hoaAnnual === "number" ? `${money(f.hoaAnnual)}/yr` : f.hoaAnnual],
    ["parcel", "Parcel ID", f.parcelId],
    ["tax", "Annual property tax", f.annualPropertyTax],
    ["school", "School district", f.schoolDistrict],
  ];

  const grid = document.getElementById("facts-grid");
  grid.innerHTML = "";
  for (const [key, label, value] of items) {
    if (value === undefined || value === null || value === "") continue;
    grid.appendChild(iconFact(ICONS[key], label, value));
  }

  document.getElementById("description-text").textContent = listing.description || "";

  const featuresList = document.getElementById("features-list");
  featuresList.innerHTML = "";
  for (const feature of listing.features || []) {
    const li = document.createElement("li");
    li.textContent = feature;
    featuresList.appendChild(li);
  }
}

let galleryPhotos = [];
let lightboxIndex = 0;

function renderGallery(photoData) {
  galleryPhotos = photoData.photos || [];
  const grid = document.getElementById("gallery-grid");
  const countEl = document.getElementById("photo-count");
  grid.innerHTML = "";

  if (galleryPhotos.length === 0) {
    grid.innerHTML = '<p class="muted">No photos yet.</p>';
    countEl.textContent = "";
    return;
  }

  countEl.textContent = `${galleryPhotos.length} photo${galleryPhotos.length === 1 ? "" : "s"}`;

  galleryPhotos.forEach((photo, i) => {
    const img = document.createElement("img");
    img.src = `${photo.base}=w500-h375-c`;
    img.loading = "lazy";
    img.alt = "604 Torridon Lane";
    img.addEventListener("click", () => openLightbox(i));
    grid.appendChild(img);
  });

  const hero = document.getElementById("hero-media");
  hero.style.backgroundImage = `url("${galleryPhotos[0].base}=w1920-h1080-c")`;
}

function showLightboxImage() {
  const photo = galleryPhotos[lightboxIndex];
  document.getElementById("lightbox-img").src = `${photo.base}=w1600`;
}

function openLightbox(index) {
  lightboxIndex = index;
  showLightboxImage();
  const lightbox = document.getElementById("lightbox");
  lightbox.classList.remove("hidden");
  lightbox.setAttribute("aria-hidden", "false");
}

function closeLightbox() {
  const lightbox = document.getElementById("lightbox");
  lightbox.classList.add("hidden");
  lightbox.setAttribute("aria-hidden", "true");
  document.getElementById("lightbox-img").src = "";
}

function stepLightbox(delta) {
  if (galleryPhotos.length === 0) return;
  lightboxIndex = (lightboxIndex + delta + galleryPhotos.length) % galleryPhotos.length;
  showLightboxImage();
}

document.getElementById("lightbox-close").addEventListener("click", closeLightbox);
document.getElementById("lightbox-prev").addEventListener("click", () => stepLightbox(-1));
document.getElementById("lightbox-next").addEventListener("click", () => stepLightbox(1));
document.getElementById("lightbox").addEventListener("click", (e) => {
  if (e.target.id === "lightbox") closeLightbox();
});
document.addEventListener("keydown", (e) => {
  if (document.getElementById("lightbox").classList.contains("hidden")) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowLeft") stepLightbox(-1);
  if (e.key === "ArrowRight") stepLightbox(1);
});

const navToggle = document.getElementById("nav-toggle");
const navLinks = document.getElementById("nav-links");
navToggle.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(open));
});
navLinks.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    navLinks.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  })
);

document.getElementById("interest-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const statusEl = document.getElementById("form-status");
  const submitBtn = document.getElementById("submit-btn");

  const name = form.name.value.trim();
  const phone = form.phone.value.trim();
  const preference = form.querySelector('input[name="preference"]:checked')?.value;

  if (!name || !phone || !preference) {
    statusEl.textContent = "Name, phone, and a call/text preference are required.";
    statusEl.className = "error";
    return;
  }

  if (!FORM_ENDPOINT) {
    statusEl.textContent = "Form isn't connected yet — see cloudflare-worker/README.md.";
    statusEl.className = "error";
    return;
  }

  submitBtn.disabled = true;
  statusEl.textContent = "Sending…";
  statusEl.className = "";

  try {
    const res = await fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, preference }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || "Submission failed");

    statusEl.textContent = "Thanks! We'll be in touch.";
    statusEl.className = "success";
    form.reset();
  } catch (err) {
    statusEl.textContent = "Something went wrong — please try again.";
    statusEl.className = "error";
  } finally {
    submitBtn.disabled = false;
  }
});

Promise.all([loadJSON("data/listing.json"), loadJSON("data/photos.json")])
  .then(([listing, photos]) => {
    renderListing(listing);
    renderGallery(photos);
  })
  .catch((err) => {
    console.error(err);
    document.getElementById("gallery-grid").innerHTML = '<p class="muted">Failed to load photos.</p>';
  });
