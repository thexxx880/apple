// =============================================
// NAVBAR + BUSCADOR UNIFICADO - LZPLAY (v3.2)
// Actualizado: 
// - Grid responsive (cards lado a lado + wrap)
// - Orden por año (más nuevo → más viejo)
// - Normalización de tildes y caracteres especiales
// =============================================

// ==================== CONFIG ====================
const JSON_URL =
  "https://raw.githubusercontent.com/thexxx880/apple/main/data%20base/search/search.json";
let database = [];
let databaseLoaded = false;
let searchInitialized = false;

// ==================== FUNCIÓN DE NORMALIZACIÓN ====================
function normalizeText(str) {
  if (!str) return "";
  return str
    .toString()
    .toLowerCase()
    .normalize("NFD")                           // Descompone las tildes (é → e + ´)
    .replace(/[\u0300-\u036f]/g, "")            // Elimina los acentos
    .replace(/[^a-z0-9\s]/g, " ")               // Reemplaza caracteres especiales por espacio
    .replace(/\s+/g, " ")                       // Colapsa espacios múltiples
    .trim();
}

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

// ==================== SEARCH (CON NORMALIZACIÓN) ====================
function search(query) {
  if (!query || query.trim().length < 2) return [];
  
  const q = normalizeText(query);   // ← Normalizamos la consulta
  
  return database
    .map((item) => {
      let score = 0;

      // Normalizamos todos los campos antes de comparar
      const tituloNorm = normalizeText(item.titulo);
      const alternosNorm = normalizeText(item["titulo alternos"]);
      const sinopsisNorm = normalizeText(item.sinopsis);
      const id = String(item.id_tmdb || "");

      if (tituloNorm.includes(q)) score += 100;
      if (tituloNorm.startsWith(q)) score += 50;
      if (alternosNorm.includes(q)) score += 80;
      if (id === q) score += 70;
      if (sinopsisNorm.includes(q)) score += 30;

      return { ...item, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      // Orden principal: año más reciente primero
      const yearA = parseInt(a.año) || 0;
      const yearB = parseInt(b.año) || 0;
      
      if (yearB !== yearA) {
        return yearB - yearA;
      }
      
      // Mismo año → por relevancia
      return b.score - a.score;
    });
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
.lz-results-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 16px;
    padding: 0 22px 24px;
}
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
.lz-result-card img {
    width: 100%;
    aspect-ratio: 2 / 3;
    object-fit: cover;
}
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
.no-results {
    grid-column: 1/-1;
    text-align: center;
    color: #94a3b8;
    padding: 70px 20px;
    font-size: .95rem;
}
@media (max-width: 900px) {
    .lz-modal { padding: 60px 12px 12px; }
    .lz-modal-content { border-radius: 20px; }
    .lz-results-grid {
        grid-template-columns: repeat(auto-fill, minmax(165px, 1fr));
        gap: 12px;
        padding: 0 16px 20px;
    }
}
@media (max-width: 600px) {
    .lz-modal { padding: 0; align-items: flex-end; }
    .lz-modal-content {
        max-width: 100%;
        height: 92vh;
        border-radius: 24px 24px 0 0;
    }
    .lz-results-grid {
        grid-template-columns: repeat(auto-fill, minmax(145px, 1fr));
        gap: 10px;
    }
}
@keyframes modalShow {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
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
           <h2 id="resultsTitle">Resultados de búsqueda</h2>
            <span class="lz-close-btn" id="lz-closeModal">×</span>
        </div>
        <div class="lz-search-area">
          <input id="modalSearchInput" type="text" placeholder="Buscar películas o series...">
        </div>
        <div id="lz-resultsGrid" class="lz-results-grid"></div>
      </div>
    </div>
    `
  );

  const modal = document.getElementById("lz-searchModal");
  document.getElementById("lz-closeModal").onclick = () => modal.style.display = "none";
  modal.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; };
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") modal.style.display = "none";
  });
}

// ==================== RESULTS ====================
function renderModalResults(query) {
  const grid = document.getElementById("lz-resultsGrid");
  const results = search(query);

  if (!query.trim()) {
    grid.innerHTML = `<div class="no-results">🔍 Escribe algo para buscar</div>`;
    return;
  }
  if (results.length === 0) {
    grid.innerHTML = `<div class="no-results">😕 No encontramos resultados</div>`;
    return;
  }

  grid.innerHTML = results.map(item => `
    <div class="lz-result-card" onclick="window.openContent('${item.url}')">
      <img src="${item.poster || 'https://via.placeholder.com/300x450/111827/ffffff?text=LZPLAY'}" 
           loading="lazy" alt="${item.titulo}">
      <div class="lz-result-info">
        <h4>${item.titulo}</h4>
        <small>${item.año || ""}</small>
      </div>
    </div>
  `).join("");
}

// ==================== OPEN MODAL ====================
window.openSearchModal = function(query = "") {
  const modal = document.getElementById("lz-searchModal");
  const input = document.getElementById("modalSearchInput");
  const title = document.getElementById("resultsTitle");

  modal.style.display = "flex";
  input.value = query;
  title.textContent = query ? `Resultados de: "${query}"` : "Buscar contenido";
  renderModalResults(query);
  setTimeout(() => input.focus(), 80);
};

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

  const desktopInput = document.querySelector(".search-box input");
  const desktopIcon = document.querySelector(".search-icon");
  const mobileBtn = document.getElementById("mobileSearchBtn");
  const modalInput = document.getElementById("modalSearchInput");

  desktopIcon?.addEventListener("click", () => {
    window.openSearchModal(desktopInput.value.trim());
  });

  desktopInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      window.openSearchModal(desktopInput.value.trim());
    }
  });

  mobileBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    window.openSearchModal();
  });

  modalInput?.addEventListener("input", () => {
    const query = modalInput.value.trim();
    const titleEl = document.getElementById("resultsTitle");
    titleEl.textContent = query ? `Resultados de: "${query}"` : "Buscar contenido";
    renderModalResults(query);
  });

  modalInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      renderModalResults(modalInput.value.trim());
    }
  });

  console.log("%c✅ Navbar + buscador listo (v3.2 con normalización)", "color:#22c55e;font-weight:bold");
}

// ==================== INIT ====================
function initNavbar(containerId = "main-header") {
  renderNavbar(containerId);
  console.log("✅ Navbar inicializado");
}

window.initNavbar = initNavbar;
window.renderNavbar = renderNavbar;
