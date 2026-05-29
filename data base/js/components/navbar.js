// =============================================
// NAVBAR + BUSCADOR UNIFICADO - LZPLAY (v4.0)
// Responsividad mejorada + Normalización + Año + Scroll
// =============================================

const JSON_URL = "https://raw.githubusercontent.com/thexxx880/apple/main/data%20base/search/search.json";
let database = [];
let databaseLoaded = false;
let searchInitialized = false;

/* ==================== NORMALIZACIÓN ==================== */
function normalizeText(str) {
    if (!str) return "";
    return str
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

/* ==================== NAVBAR ==================== */
function renderNavbar(containerId = "main-header") {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <a href="https://lzplayhd.online/apple/data%20base/" class="logo">LZPLAY</a>
        <div class="nav-center">
            <a href="https://lzplayhd.online/apple/data%20base/" class="nav-link">Inicio</a>
            <a href="#" class="nav-link">Tendencias</a>
            <a href="https://lzplayhd.online/apple/data%20base/data/movie.html" class="nav-link">Películas</a>
            <a href="https://lzplayhd.online/apple/data%20base/data/serie.html" class="nav-link">Series</a>
            <div class="search-box">
                <i class="fas fa-search search-icon"></i>
                <input type="text" id="desktopSearchInput" placeholder="Buscar películas o series" />
            </div>
        </div>
        <div class="icons">
            <a href="#" class="icon-btn mobile-search" id="mobileSearchBtn"><i class="fas fa-search"></i></a>
            <a href="https://lzplayhd.online/apple/data%20base/menu.html" class="user-avatar">
                <img src="https://wallpapers.com/images/hd/netflix-profile-pictures-1000-x-1000-qo9h82134t9nv0j0.jpg" alt="Usuario">
            </a>
        </div>
    `;
    initNavbarEffects(container);
    initSearch();
}

/* ==================== EFECTOS NAVBAR ==================== */
function initNavbarEffects(headerElement) {
    window.addEventListener("scroll", () => {
        headerElement.style.background = window.scrollY > 20 
            ? "rgba(2,8,23,.92)" 
            : "linear-gradient(to bottom, rgba(0,0,0,.75), transparent)";
    }, { passive: true });
}

/* ==================== DATABASE ==================== */
async function loadDatabase() {
    if (databaseLoaded) return;
    try {
        const res = await fetch(JSON_URL);
        let text = await res.text();
        text = text.trim().replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");
        let data = JSON.parse(text);
        if (!Array.isArray(data)) data = [data];
        database = data;
        databaseLoaded = true;
        console.log(`✅ Base de datos cargada: ${database.length} contenidos`);
    } catch (err) {
        console.error("❌ Error cargando search.json", err);
    }
}

/* ==================== SEARCH ==================== */
function search(query) {
    if (!query || query.trim().length < 2) return [];
    const q = normalizeText(query);

    return database
        .map((item) => {
            let score = 0;
            const titulo = normalizeText(item.titulo);
            const alternos = normalizeText(item["titulo alternos"]);
            const sinopsis = normalizeText(item.sinopsis);
            const id = String(item.id_tmdb || "");

            if (titulo.includes(q)) score += 100;
            if (titulo.startsWith(q)) score += 50;
            if (alternos.includes(q)) score += 80;
            if (id === q) score += 70;
            if (sinopsis.includes(q)) score += 30;

            return { ...item, score };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => {
            const yearA = parseInt(a.año) || 0;
            const yearB = parseInt(b.año) || 0;
            if (yearB !== yearA) return yearB - yearA;
            return b.score - a.score;
        });
}

/* ==================== CSS RESPONSIVE (MEJORADO) ==================== */
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
    background: rgba(0,0,0,.82);
    backdrop-filter: blur(12px);
    justify-content: center;
    align-items: flex-start;
    overflow-y: auto;
    padding: 70px 18px 20px;
}

.lz-modal-content {
    width: 100%;
    max-width: 1200px;
    background: #020817;
    border-radius: 24px;
    border: 1px solid rgba(255,255,255,.08);
    box-shadow: 0 25px 70px rgba(0,0,0,.45);
    max-height: 90vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
}

.lz-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 22px;
    border-bottom: 1px solid rgba(255,255,255,.06);
}

.lz-modal-header h2 {
    color: white;
    margin: 0;
    font-size: 1.15rem;
}

.lz-close-btn {
    cursor: pointer;
    font-size: 2rem;
    color: #cbd5e1;
    transition: .2s;
}
.lz-close-btn:hover { color: white; }

.lz-search-area { padding: 18px 22px; }

#modalSearchInput {
    width: 100%;
    height: 54px;
    border: none;
    outline: none;
    border-radius: 16px;
    background: #111827;
    color: white;
    padding: 0 18px;
    font-size: .95rem;
}

.lz-results-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
    gap: 18px;
    padding: 0 22px 24px;
}

.lz-result-card {
    background: #111827;
    border-radius: 18px;
    overflow: hidden;
    cursor: pointer;
    transition: .25s ease;
}
.lz-result-card:hover { transform: translateY(-4px); }

.lz-result-card img {
    width: 100%;
    aspect-ratio: 2/3;
    object-fit: cover;
    display: block;
}

.lz-result-info {
    padding: 10px;
}
.lz-result-info h4 {
    color: white;
    margin: 0;
    font-size: .88rem;
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
.lz-result-info small { color: #60a5fa; font-size: .78rem; }

.no-results {
    grid-column: 1/-1;
    text-align: center;
    padding: 70px 20px;
    color: #94a3b8;
}

/* ==================== RESPONSIVE ==================== */
@media (max-width: 900px) {
    .lz-results-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 14px;
    }
}

@media (max-width: 600px) {
    .lz-modal {
        padding: 0;
        align-items: flex-end;
    }
    .lz-modal-content {
        height: 92vh;
        max-height: 92vh;
        border-radius: 24px 24px 0 0;
    }
    .lz-results-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        padding: 0 14px 18px;
    }
    .lz-result-card {
        border-radius: 14px;
    }
    .lz-result-info h4 {
        font-size: .8rem;
    }
}
`;
    document.head.appendChild(style);
}

/* ==================== MODAL ==================== */
function injectModal() {
    if (document.getElementById("lz-searchModal")) return;
    document.body.insertAdjacentHTML("beforeend", `
        <div id="lz-searchModal" class="lz-modal">
            <div class="lz-modal-content">
                <div class="lz-modal-header">
                    <h2 id="resultsTitle">Buscar contenido</h2>
                    <span class="lz-close-btn" id="lz-closeModal">×</span>
                </div>
                <div class="lz-search-area">
                    <input id="modalSearchInput" type="text" placeholder="Buscar películas o series...">
                </div>
                <div id="lz-resultsGrid" class="lz-results-grid"></div>
            </div>
        </div>
    `);

    const modal = document.getElementById("lz-searchModal");
    document.getElementById("lz-closeModal").onclick = () => modal.style.display = "none";
    modal.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; };
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") modal.style.display = "none";
    });
}

/* ==================== RENDER RESULTS ==================== */
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
                 alt="${item.titulo}" loading="lazy">
            <div class="lz-result-info">
                <h4>${item.titulo}</h4>
                <small>${item.año || ""}</small>
            </div>
        </div>
    `).join("");
}

/* ==================== OPEN MODAL ==================== */
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

window.openContent = function(url) {
    window.location.href = url;
};

/* ==================== INIT SEARCH ==================== */
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

    desktopIcon?.addEventListener("click", () => openSearchModal(desktopInput.value.trim()));
    desktopInput?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            openSearchModal(desktopInput.value.trim());
        }
    });
    mobileBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        openSearchModal();
    });
    modalInput?.addEventListener("input", () => {
        renderModalResults(modalInput.value.trim());
    });

    console.log("%c✅ Navbar + buscador listo (v4.0 - Responsive Mejorado)", "color:#22c55e;font-weight:bold");
}

/* ==================== INIT ==================== */
function initNavbar(containerId = "main-header") {
    renderNavbar(containerId);
}

window.initNavbar = initNavbar;
window.renderNavbar = renderNavbar;
