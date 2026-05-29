// =============================================
// NAVBAR + BUSCADOR UNIFICADO - LZPLAY (v3.0)
// =============================================

// ==================== CONFIG ====================
const JSON_URL =
  "https://raw.githubusercontent.com/thexxx880/apple/main/data%20base/search/search.json";

let database = [];
let databaseLoaded = false;
let searchInitialized = false;

// ==================== NAVBAR ====================
function renderNavbar(containerId = "main-header") {
  const container = document.getElementById(containerId);

  if (!container) {
    console.error(`Contenedor #${containerId} no encontrado`);
    return;
  }

  container.innerHTML = `
        <a href="https://lzplayhd.online/apple/data%20base/" class="logo">
            LZPLAY
        </a>

        <div class="nav-center">
            <a href="https://lzplayhd.online/apple/data%20base/" class="nav-link">
                Inicio
            </a>

            <a href="#" class="nav-link">
                Tendencias
            </a>

            <a href="https://lzplayhd.online/apple/data%20base/data/movie.html" class="nav-link">
                Películas
            </a>

            <a href="https://lzplayhd.online/apple/data%20base/data/serie.html" class="nav-link">
                Series
            </a>

            <div class="search-box">
                <i class="fas fa-search search-icon"></i>

                <input
                    type="text"
                    id="desktopSearchInput"
                    placeholder="Buscar películas o series"
                />
            </div>
        </div>

        <div class="icons">
            <!-- BUSCADOR MÓVIL -->
            <a href="#"
               class="icon-btn mobile-search"
               id="mobileSearchBtn">

                <i class="fas fa-search"></i>
            </a>

            <!-- PERFIL -->
            <a href="https://lzplayhd.online/apple/data%20base/menu.html"
               class="user-avatar">

                <img
                  src="https://wallpapers.com/images/hd/netflix-profile-pictures-1000-x-1000-qo9h82134t9nv0j0.jpg"
                  alt="Usuario">
            </a>
        </div>
    `;

  initNavbarEffects(container);
  initSearch();
}

// ==================== EFECTOS NAVBAR ====================
function initNavbarEffects(headerElement) {
  window.addEventListener(
    "scroll",
    () => {
      headerElement.style.background =
        window.scrollY > 20
          ? "rgba(2,8,23,.92)"
          : "linear-gradient(to bottom, rgba(0,0,0,.75), transparent)";
    },
    { passive: true }
  );
}

// ==================== DATABASE ====================
async function loadDatabase() {
  if (databaseLoaded) return;

  try {
    const res = await fetch(JSON_URL);

    let text = await res.text();

    text = text
      .trim()
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]");

    let data = JSON.parse(text);

    if (!Array.isArray(data)) {
      data = [data];
    }

    database = data;
    databaseLoaded = true;

    console.log(
      `✅ Base de datos cargada: ${database.length} contenidos`
    );
  } catch (err) {
    console.error("❌ Error cargando search.json", err);
  }
}

// ==================== SEARCH ====================
function search(query) {
  if (!query || query.trim().length < 2) return [];

  const q = query.toLowerCase().trim();

  return database
    .map((item) => {
      let score = 0;

      const titulo = (item.titulo || "").toLowerCase();
      const alternos = (
        item["titulo alternos"] || ""
      ).toLowerCase();

      const sinopsis = (
        item.sinopsis || ""
      ).toLowerCase();

      const id = String(item.id_tmdb || "");

      if (titulo.includes(q)) score += 100;
      if (titulo.startsWith(q)) score += 50;
      if (alternos.includes(q)) score += 80;
      if (id === q) score += 70;
      if (sinopsis.includes(q)) score += 30;

      return {
        ...item,
        score,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
}

// ==================== CSS ====================
function injectSearchCSS() {
  if (document.getElementById("lz-search-css")) return;

  const style = document.createElement("style");

  style.id = "lz-search-css";

  style.textContent = `
.lz-modal {
    display: none;
    position: fixed;
    inset: 0;
    z-index: 100000;
    background: rgba(0,0,0,.78);
    backdrop-filter: blur(12px);
    justify-content: center;
    align-items: flex-start;
    overflow-y: auto;
    padding: 80px 16px 20px;
}

/* CONTENEDOR */
.lz-modal-content {
    width: 100%;
    max-width: 1150px;
    background: #0b1120;
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 24px;
    overflow-y: auto;
    overflow-x: hidden;
    max-height: 92vh;
    box-shadow: 0 25px 60px rgba(0,0,0,.45);
    animation: modalShow .22s ease;
}

/* HEADER */
.lz-modal-header {
    position: sticky;
    top: 0;
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 22px 22px 16px;
    background: rgba(11,17,32,.95);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(255,255,255,.06);
}

.lz-modal-header h2 {
    color: white;
    margin: 0;
    font-size: 1.15rem;
    font-weight: 700;
}

/* BOTON CERRAR */
.lz-close-btn {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    background: rgba(255,255,255,.08);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #d1d5db;
    font-size: 1.6rem;
    cursor: pointer;
    transition: .25s ease;
}

.lz-close-btn:hover {
    background: rgba(255,255,255,.15);
    color: white;
}

/* INPUT */
.lz-search-area {
    padding: 20px 22px;
}

#modalSearchInput {
    width: 100%;
    height: 52px;
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,.08);
    background: #111827;
    color: white;
    padding: 0 18px;
    font-size: .98rem;
    outline: none;
    transition: .25s ease;
}

#modalSearchInput:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 4px rgba(37,99,235,.18);
}

/* GRID RESPONSIVE REAL */
.lz-results-grid {
    display: grid;
  grid-template-columns: repeat(
    auto-fill,
    minmax(190px, 0fr)
);
    gap: 14px;
    padding: 0 22px 24px;
}

/* CARD */
.lz-result-card {
    background: #111827;
    border-radius: 16px;
    overflow: hidden;
    cursor: pointer;
    transition: .25s ease;
}

.lz-result-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 14px 35px rgba(0,0,0,.35);
}

/* POSTER */
.lz-result-card img {
    width: 100%;
    aspect-ratio: 2 / 3;
    object-fit: cover;
}

/* INFO */
.lz-result-info {
    padding: 10px;
}

.lz-result-info h4 {
    color: white;
    font-size: .88rem;
    margin: 0;
    line-height: 1.35;

    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.lz-result-info small {
    color: #60a5fa;
    font-size: .78rem;
}

/* SIN RESULTADOS */
.no-results {
    grid-column: 1/-1;
    text-align: center;
    color: #94a3b8;
    padding: 70px 20px;
    font-size: .95rem;
}

/* RESPONSIVE */
@media (max-width: 900px) {
    .lz-modal {
        padding: 60px 12px 12px;
    }

    .lz-modal-content {
        border-radius: 20px;
    }

    .lz-results-grid {
        grid-template-columns:
            repeat(auto-fill, minmax(165px, 0fr));
        gap: 12px;
        padding: 0 16px 20px;
    }

    .lz-search-area {
        padding: 16px;
    }

    .lz-modal-header {
        padding: 18px 16px 14px;
    }
}

@media (max-width: 600px) {

    .lz-modal {
        padding: 0;
        align-items: flex-end;
    }

    .lz-modal-content {
        max-width: 100%;
        height: 92vh;
        border-radius: 24px 24px 0 0;
    }

    .lz-results-grid {
    grid-template-columns:
        repeat(auto-fill, minmax(145px, 0fr));
    gap: 10px;
}

    .lz-result-info h4 {
        font-size: .80rem;
    }

    .lz-result-info small {
        font-size: .72rem;
    }

    #modalSearchInput {
        height: 48px;
        border-radius: 14px;
        font-size: .92rem;
    }
}

@keyframes modalShow {
    from {
        opacity: 0;
        transform: translateY(16px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
  `;

  document.head.appendChild(style);
}

// ==================== MODAL ====================
function injectModal() {
  if (document.getElementById("lz-searchModal")) return;

  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <div id="lz-searchModal" class="lz-modal">

      <div class="lz-modal-content">

        <div class="lz-modal-header">
           <h2 id="resultsTitle">
    Resultados de búsqueda
</h2>

            <span
                class="lz-close-btn"
                id="lz-closeModal">
                ×
            </span>
        </div>

      <div class="lz-search-area">
<input
    id="modalSearchInput"
    type="text"
    placeholder="Buscar películas o series..."
>
</div>
        <div
            id="lz-resultsGrid"
            class="lz-results-grid">
        </div>

      </div>
    </div>
    `
  );

  const modal = document.getElementById("lz-searchModal");

  document.getElementById("lz-closeModal")
    .onclick = () => {
      modal.style.display = "none";
    };

  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  };

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      modal.style.display = "none";
    }
  });
}

// ==================== RESULTS ====================
function renderModalResults(query) {
  const grid = document.getElementById(
    "lz-resultsGrid"
  );

  const results = search(query);

  if (!query.trim()) {
    grid.innerHTML =
      `<div class="no-results">
        🔍 Escribe algo para buscar
      </div>`;
    return;
  }

  if (results.length === 0) {
    grid.innerHTML =
      `<div class="no-results">
        😕 No encontramos resultados
      </div>`;
    return;
  }

  grid.innerHTML = results
    .map(
      (item) => `
      <div class="lz-result-card"
           onclick="window.openContent('${item.url}')">

          <img 
  src="${item.poster || 'https://via.placeholder.com/300x450/111827/ffffff?text=LZPLAY'}"
  loading="lazy"
  alt="${item.titulo}"
>

          <div class="lz-result-info">
              <h4>${item.titulo}</h4>
              <small>${item.año || ""}</small>
          </div>
      </div>
    `
    )
    .join("");
}

// ==================== OPEN MODAL ====================
window.openSearchModal = function(query = "") {

    const modal =
        document.getElementById(
            "lz-searchModal"
        );

    const input =
        document.getElementById(
            "modalSearchInput"
        );

    const title =
        document.getElementById(
            "resultsTitle"
        );

    modal.style.display = "flex";

    input.value = query;

    title.textContent = query
        ? `Resultados de: "${query}"`
        : "Buscar contenido";

    renderModalResults(query);

    setTimeout(() => {
        input.focus();
    }, 80);
};

// ==================== OPEN CONTENT ====================
window.openContent = function (url) {
  window.location.href = url;
};

// ==================== INIT SEARCH ====================
async function initSearch() {
  if (searchInitialized) return;

  searchInitialized = true;

  await loadDatabase();

  injectSearchCSS();
  injectModal();

  // Desktop input
  const desktopInput =
    document.querySelector(
      ".search-box input"
    );

  const desktopIcon =
    document.querySelector(
      ".search-icon"
    );

  // Botón móvil
  const mobileBtn =
    document.getElementById(
      "mobileSearchBtn"
    );

  // Modal input
  const modalInput =
    document.getElementById(
      "modalSearchInput"
    );

  // CLICK LUPA DESKTOP
  desktopIcon?.addEventListener(
    "click",
    () => {
      window.openSearchModal(
        desktopInput.value.trim()
      );
    }
  );

  // ENTER DESKTOP
  desktopInput?.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Enter") {
        e.preventDefault();

        window.openSearchModal(
          desktopInput.value.trim()
        );
      }
    }
  );

  // BOTÓN MÓVIL
  mobileBtn?.addEventListener(
    "click",
    (e) => {
      e.preventDefault();
      window.openSearchModal();
    }
  );

  
 // BUSCAR EN MODAL
modalInput?.addEventListener(
  "input",
  () => {

    const query =
      modalInput.value.trim();

    const title =
      document.getElementById(
        "resultsTitle"
      );

    title.textContent = query
      ? `Resultados de: "${query}"`
      : "Buscar contenido";

    renderModalResults(query);
  }
);

  // ENTER MODAL
  modalInput?.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Enter") {
        renderModalResults(
          modalInput.value.trim()
        );
      }
    }
  );

  console.log(
    "%c✅ Navbar + buscador listo",
    "color:#22c55e;font-weight:bold"
  );
}

// ==================== INIT ====================
function initNavbar(
  containerId = "main-header"
) {
  renderNavbar(containerId);

  console.log(
    "✅ Navbar inicializado"
  );
}

// ==================== GLOBAL ====================
window.initNavbar = initNavbar;
window.renderNavbar = renderNavbar;
