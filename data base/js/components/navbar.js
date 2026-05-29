// =============================================
// NAVBAR.JS - Navbar + Buscador dinámico TMDB
// =============================================

const TMDB_API_KEY = "38e497c6c1a043d1341416e80915669f";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE = "https://image.tmdb.org/t/p/w500";

// =============================================
// RENDER NAVBAR
// =============================================
function renderNavbar(containerId = "main-header") {
    const container = document.getElementById(containerId);

    if (!container) {
        console.error(`Contenedor #${containerId} no encontrado`);
        return;
    }

    container.innerHTML = `
        <a href="/apple/data%20base/" class="logo">
            LZPLAY
        </a>
    
        <div class="nav-center">
            <a href="/apple/data%20base/" class="nav-link">Inicio</a>
            <a href="#" class="nav-link">Tendencias</a>
            <a href="/apple/data%20base/data/movie.html" class="nav-link">Películas</a>
            <a href="/apple/data%20base/data/serie.html" class="nav-link">Series</a>

            <div class="search-box">
                <i class="fas fa-search"></i>

                <input
                    type="text"
                    id="navbar-search"
                    placeholder="Buscar películas o series..."
                    autocomplete="off"
                >

                <div id="search-results" class="search-results"></div>
            </div>
        </div>
    
        <div class="icons">

            <!-- BUSCADOR MOBILE -->
            <a href="/apple/data%20base/search.html" class="icon-btn mobile-search">
                <i class="fas fa-search"></i>
            </a>

            <!-- PERFIL / MENÚ -->
            <a href="/apple/data%20base/menu.html" class="user-avatar">
                <img 
                    src="https://wallpapers.com/images/hd/netflix-profile-pictures-1000-x-1000-qo9h82134t9nv0j0.jpg" 
                    alt="Usuario"
                >
            </a>

        </div>
    `;

    initNavbarEffects(container);
    initSearch();
}

// =============================================
// EFECTOS NAVBAR
// =============================================
function initNavbarEffects(headerElement) {

    window.addEventListener("scroll", () => {
        headerElement.style.background =
            window.scrollY > 20
                ? "rgba(2,8,23,.92)"
                : "linear-gradient(to bottom, rgba(0,0,0,.75), transparent)";
    }, { passive: true });
}

// =============================================
// BUSCADOR TMDB
// =============================================
function initSearch() {
    const input = document.getElementById("navbar-search");
    const resultsBox = document.getElementById("search-results");

    if (!input || !resultsBox) return;

    let debounce;

    input.addEventListener("input", () => {
        clearTimeout(debounce);

        const query = input.value.trim();

        if (query.length < 2) {
            resultsBox.innerHTML = "";
            resultsBox.style.display = "none";
            return;
        }

        debounce = setTimeout(() => {
            searchTMDB(query, resultsBox);
        }, 350);
    });

    // cerrar resultados al hacer click fuera
    document.addEventListener("click", (e) => {
        if (!e.target.closest(".search-box")) {
            resultsBox.style.display = "none";
        }
    });
}

// =============================================
// BUSCAR EN TMDB
// =============================================
async function searchTMDB(query, resultsBox) {
    try {

        const url = `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&language=es-ES&query=${encodeURIComponent(query)}`;

        const res = await fetch(url);
        const data = await res.json();

        const results = data.results
            .filter(item =>
                item.media_type === "movie" ||
                item.media_type === "tv"
            )
            .slice(0, 8);

        if (!results.length) {
            resultsBox.innerHTML = `
                <div class="search-empty">
                    No se encontraron resultados
                </div>
            `;
            resultsBox.style.display = "block";
            return;
        }

        resultsBox.innerHTML = results.map(item => {

            const title =
                item.title ||
                item.name ||
                "Sin título";

            const poster = item.poster_path
                ? `${TMDB_IMAGE}${item.poster_path}`
                : "https://via.placeholder.com/60x90?text=No+Image";

            const type =
                item.media_type === "movie"
                    ? "Película"
                    : "Serie";

            return `
                <div 
                    class="search-item"
                    onclick="openContent('${item.id}', '${item.media_type}')"
                >
                    <img src="${poster}" alt="${title}">

                    <div class="search-info">
                        <h4>${title}</h4>
                        <span>${type}</span>
                    </div>
                </div>
            `;
        }).join("");

        resultsBox.style.display = "block";

    } catch (error) {
        console.error("Error búsqueda:", error);
    }
}

// =============================================
// ABRIR CONTENIDO
// =============================================
function openContent(id, type) {

    const url =
        type === "movie"
            ? `/apple/data%20base/content.html?id=${id}&type=movie`
            : `/apple/data%20base/content.html?id=${id}&type=tv`;

    window.location.href = url;
}

// =============================================
// INIT NAVBAR
// =============================================
function initNavbar(containerId = "main-header") {
    renderNavbar(containerId);

    console.log("✅ Navbar inicializado correctamente");
}

// =============================================
// GLOBAL
// =============================================
window.initNavbar = initNavbar;
window.renderNavbar = renderNavbar;
window.openContent = openContent;
