
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
    .lz-modal{
        display:none;
        position:fixed;
        inset:0;
        background:rgba(2,8,23,.95);
        backdrop-filter:blur(12px);
        z-index:100000;
        justify-content:center;
        align-items:center;
        padding:20px;
    }

    .lz-modal-content{
        background:#020817;
        width:100%;
        max-width:1100px;
        max-height:92vh;
        overflow-y:auto;
        border-radius:24px;
        padding:25px;
        border:2px solid #2563eb;
    }

    .lz-modal-header{
        display:flex;
        justify-content:space-between;
        align-items:center;
        margin-bottom:20px;
    }

    .lz-close-btn{
        font-size:40px;
        cursor:pointer;
        color:#94a3b8;
    }

    .lz-results-grid{
        display:grid;
        grid-template-columns:
            repeat(auto-fill,minmax(190px,1fr));
        gap:22px;
    }

    .lz-result-card{
        background:#111827;
        border-radius:18px;
        overflow:hidden;
        cursor:pointer;
        transition:.3s;
    }

    .lz-result-card:hover{
        transform:scale(1.05);
    }

    .lz-result-card img{
        width:100%;
        height:290px;
        object-fit:cover;
    }

    .lz-result-info{
        padding:14px;
    }

    .lz-result-info h4{
        color:white;
        margin:0;
    }

    .lz-result-info small{
        color:#60a5fa;
    }

    .no-results{
        text-align:center;
        padding:60px;
        color:#64748b;
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
            <h2 style="color:white">
                Buscar en LzPlay
            </h2>

            <span
                class="lz-close-btn"
                id="lz-closeModal">
                ×
            </span>
        </div>

        <input
          id="modalSearchInput"
          type="text"
          placeholder="Buscar películas o series..."
          style="
            width:100%;
            padding:15px 20px;
            border-radius:50px;
            border:1px solid #2563eb;
            background:#111827;
            color:white;
            margin-bottom:25px;
          "
        >

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

          <img src="${item.poster}">

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
window.openSearchModal = function (
  query = ""
) {
  const modal =
    document.getElementById(
      "lz-searchModal"
    );

  const input =
    document.getElementById(
      "modalSearchInput"
    );

  modal.style.display = "flex";

  input.value = query;

  renderModalResults(query);

  setTimeout(() => {
    input.focus();
  }, 50);
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
      renderModalResults(
        modalInput.value.trim()
      );
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
