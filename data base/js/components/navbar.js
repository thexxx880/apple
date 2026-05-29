// =============================================
// NAVBAR.JS - Navbar dinámico optimizado
// =============================================

function renderNavbar(containerId = "main-header") {
    const container = document.getElementById(containerId);

    if (!container) {
        console.error(`❌ Contenedor #${containerId} no encontrado`);
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

            <a href="../data/movie.html" class="nav-link">
                Películas
            </a>

            <a href="../data/serie.html" class="nav-link">
                Series
            </a>

            <!-- SEARCH -->
            <div class="search-box">
                <i class="fas fa-search"></i>

                <input
                    type="text"
                    id="navbar-search"
                    placeholder="Buscar películas o series"
                    autocomplete="off"
                >
            </div>
        </div>

        <div class="icons">

            <!-- Mobile Search -->
            <button class="icon-btn mobile-search" id="mobileSearchBtn">
                <i class="fas fa-search"></i>
            </button>

            <!-- Perfil -->
            <a href="https://lzplayhd.online/apple/data%20base/menu.html"
               class="user-avatar">

                <img
                    src="https://wallpapers.com/images/hd/netflix-profile-pictures-1000-x-1000-qo9h82134t9nv0j0.jpg"
                    alt="Usuario"
                >
            </a>
        </div>
    `;

    initNavbarEffects(container);

    // 🔥 Inicializar buscador DESPUÉS de renderizar navbar
    if (window.attachNavbarSearch) {
        window.attachNavbarSearch();
    }
}

// =============================================
// EFECTOS NAVBAR
// =============================================
function initNavbarEffects(headerElement) {

    const handleScroll = () => {
        headerElement.style.background =
            window.scrollY > 20
                ? "rgba(2,8,23,.92)"
                : "linear-gradient(to bottom, rgba(0,0,0,.75), transparent)";
    };

    window.removeEventListener("scroll", handleScroll);
    window.addEventListener("scroll", handleScroll, {
        passive: true
    });
}

// =============================================
// INIT
// =============================================
function initNavbar(containerId = "main-header") {
    renderNavbar(containerId);

    console.log("✅ Navbar inicializado");
}

window.initNavbar = initNavbar;
window.renderNavbar = renderNavbar;
