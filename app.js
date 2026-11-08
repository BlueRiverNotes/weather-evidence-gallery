// Public gallery catalog loader.
// The catalog is manifest.json. Only reviewed, public-safe display copies belong there.
// Radar and satellite cards are GIF-only; private Master-File URLs must never be used here.

const gallery = document.querySelector("#gallery");
const search = document.querySelector("#search");
const filters = document.querySelector("#filters");
let items = [];
let activeCategory = "All";

function safePublicUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value, window.location.href);
    if (!["https:", "http:"].includes(url.protocol)) return null;
    return url.href;
  } catch {
    return null;
  }
}

function isRadarOrSatellite(item) {
  const category = String(item.category || "").toLowerCase();
  return category.includes("radar") || category.includes("satellite");
}

function validateItem(item) {
  if (!item || typeof item !== "object") return false;
  if (!item.title || !item.description || !item.category) return false;

  // The public site must display radar/satellite animations as GIFs only.
  if (isRadarOrSatellite(item)) {
    if (item.video) return false;
    const imageUrl = safePublicUrl(item.image);
    if (!imageUrl || !/\.gif(?:$|[?#])/i.test(imageUrl)) return false;
  } else if (item.image && !safePublicUrl(item.image)) {
    return false;
  }

  if (item.video && !safePublicUrl(item.video)) return false;
  if (item.poster && !safePublicUrl(item.poster)) return false;
  if (item.link && !safePublicUrl(item.link)) return false;
  return true;
}

function render() {
  const term = search.value.trim().toLowerCase();
  const visible = items.filter((item) => {
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    const matchesSearch = `${item.title} ${item.description} ${item.category}`.toLowerCase().includes(term);
    return matchesCategory && matchesSearch;
  });

  gallery.replaceChildren();
  if (!visible.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = items.length
      ? "No materials match this search."
      : "No materials have been approved for public display yet.";
    gallery.append(empty);
    return;
  }

  for (const item of visible) {
    const card = document.createElement("article");
    card.className = "card";

    if (item.image || item.video) {
      const frame = document.createElement("div");
      frame.className = "media-frame";

      if (item.video) {
        const video = document.createElement("video");
        video.src = safePublicUrl(item.video);
        video.controls = true;
        video.preload = "metadata";
        video.playsInline = true;
        video.setAttribute("aria-label", item.videoAlt || `Video: ${item.title}`);
        if (item.poster) video.poster = safePublicUrl(item.poster);
        frame.append(video);
      } else {
        const img = document.createElement("img");
        img.src = safePublicUrl(item.image);
        img.alt = item.imageAlt || `Image: ${item.title}`;
        img.loading = "lazy";
        frame.append(img);
      }
      card.append(frame);
    }

    const body = document.createElement("div");
    body.className = "card-body";
    const heading = document.createElement("h3");
    heading.textContent = item.title;
    const description = document.createElement("p");
    description.textContent = item.description;
    const category = document.createElement("p");
    category.textContent = item.category;
    body.append(heading, description, category);

    if (item.link) {
      const link = document.createElement("a");
      link.href = safePublicUrl(item.link);
      link.textContent = item.linkLabel || "View approved source";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      body.append(link);
    }
    card.append(body);
    gallery.append(card);
  }
}

function renderFilters() {
  filters.replaceChildren();
  const categories = ["All", ...new Set(items.map((item) => item.category))];
  for (const category of categories) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = category;
    button.setAttribute("aria-pressed", String(category === activeCategory));
    button.addEventListener("click", () => {
      activeCategory = category;
      for (const other of filters.querySelectorAll("button")) {
        other.setAttribute("aria-pressed", String(other === button));
      }
      render();
    });
    filters.append(button);
  }
}

async function loadCatalog() {
  try {
    const response = await fetch("./manifest.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Catalog request failed: HTTP ${response.status}`);
    const catalog = await response.json();
    const candidates = Array.isArray(catalog.items) ? catalog.items : [];
    items = candidates.filter(validateItem);
    renderFilters();
    render();
  } catch (error) {
    console.error("Weather Evidence Gallery catalog could not be loaded.", error);
    gallery.replaceChildren();
    const message = document.createElement("p");
    message.className = "empty-state";
    message.textContent = "The public catalog could not be loaded. Please try again later.";
    gallery.append(message);
  }
}

search.addEventListener("input", render);
loadCatalog();
