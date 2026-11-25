// Set this to the Cloudflare Worker URL after `wrangler deploy`
// (see cloudflare-worker/README.md). Left blank, the form will show an
// error instead of silently failing.
const FORM_ENDPOINT = "https://604torridon-interest-form.drjkarl.workers.dev";

const money = (n) => (typeof n === "number" ? `$${n.toLocaleString("en-US")}` : n);

async function loadJSON(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

function renderListing(listing) {
  document.querySelectorAll("#price, #terms-price").forEach((el) => {
    el.textContent = money(listing.price);
  });

  const f = listing.facts;
  const items = [
    ["Beds", f.beds],
    ["Full baths", f.bathsFull],
    ["Half baths", f.bathsHalf],
    ["Square footage", f.sqft],
    ["Lot size", f.lotSize],
    ["Year built", f.yearBuilt],
    ["Garage", f.garage],
    ["Stories", f.stories],
    ["HOA dues", typeof f.hoaAnnual === "number" ? `${money(f.hoaAnnual)}/yr` : f.hoaAnnual],
    ["Parcel ID", f.parcelId],
    ["Annual property tax", f.annualPropertyTax],
    ["School district", f.schoolDistrict],
  ];

  const grid = document.getElementById("facts-grid");
  grid.innerHTML = "";
  for (const [label, value] of items) {
    if (value === undefined || value === null || value === "") continue;
    const wrap = document.createElement("div");
    wrap.className = "fact";
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = value;
    wrap.append(dt, dd);
    grid.appendChild(wrap);
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

function renderGallery(photoData) {
  const grid = document.getElementById("gallery-grid");
  grid.innerHTML = "";

  if (!photoData.photos || photoData.photos.length === 0) {
    grid.innerHTML = '<p class="muted">No photos yet.</p>';
    return;
  }

  for (const photo of photoData.photos) {
    const img = document.createElement("img");
    img.src = `${photo.base}=w400-h300-c`;
    img.loading = "lazy";
    img.alt = "604 Torridon Lane";
    img.addEventListener("click", () => openLightbox(`${photo.base}=w1600`));
    grid.appendChild(img);
  }
}

function openLightbox(src) {
  const lightbox = document.getElementById("lightbox");
  document.getElementById("lightbox-img").src = src;
  lightbox.classList.remove("hidden");
  lightbox.setAttribute("aria-hidden", "false");
}

function closeLightbox() {
  const lightbox = document.getElementById("lightbox");
  lightbox.classList.add("hidden");
  lightbox.setAttribute("aria-hidden", "true");
  document.getElementById("lightbox-img").src = "";
}

document.getElementById("lightbox-close").addEventListener("click", closeLightbox);
document.getElementById("lightbox").addEventListener("click", (e) => {
  if (e.target.id === "lightbox") closeLightbox();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeLightbox();
});

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
