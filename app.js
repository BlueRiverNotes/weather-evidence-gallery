// Only add entries after the specific display copies have been approved for public release.
const items = [];
const gallery = document.querySelector("#gallery");
const search = document.querySelector("#search");
const filters = document.querySelector("#filters");
let activeCategory = "All";

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
    empty.textContent = items.length ? "No materials match this search." : "No materials have been approved for public display yet.";
    gallery.append(empty);
    return;
  }
  for (const item of visible) {
    const card = document.createElement("article");
    card.className = "card";

    // Approved image and video display copies share the same framed media area.
    if (item.image || item.video) {
      const frame = document.createElement("div");
      frame.className = "media-frame";
      if (item.video) {
        const video = document.createElement("video");
        video.src = item.video;
        video.controls = true;
        video.preload = "metadata";
        video.playsInline = true;
        video.setAttribute("aria-label", item.videoAlt || `Video: ${item.title}`);
        if (item.poster) video.poster = item.poster;
        frame.append(video);
      } else {
        const img = document.createElement("img");
        img.src = item.image;
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
      link.href = item.link;
      link.textContent = "View approved material";
      body.append(link);
    }
    card.append(body);
    gallery.append(card);
  }
}

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
search.addEventListener("input", render);
render();
