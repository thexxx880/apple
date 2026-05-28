// =============================================
// NAVBAR.JS - Componente de navegación (Header)
// =============================================

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
            <a href="https://lzplayhd.online/apple/data%20base/" class="nav-link">Inicio</a>
            <a href="#" class="nav-link">Tendencias</a>
            <a href="../data/movie.html" class="nav-link">Películas</a>
            <a href="../data/serie.html" class="nav-link">Series</a>

            <div class="search-box">
                <i class="fas fa-search"></i>
                <input
                    type="text"
                    placeholder="Buscar películas o series"
                >
            </div>
        </div>
    
        <div class="icons">

            <!-- BUSCADOR -->
            <a href="../search.html" class="icon-btn mobile-search">
                <i class="fas fa-search"></i>
            </a>

            <!-- PERFIL / MENÚ -->
            <a href="https://lzplayhd.online/apple/data%20base/" class="user-avatar">
                <img src="https://wallpapers.com/images/hd/netflix-profile-pictures-1000-x-1000-qo9h82134t9nv0j0.jpg" alt="Usuario">
            </a>

        </div>
    `;

    initNavbarEffects(container);
}

// =============================================
// EFECTOS DEL NAVBAR
// =============================================
function initNavbarEffects(headerElement) {

    // Efecto de scroll
    window.addEventListener("scroll", () => {
        headerElement.style.background =
            window.scrollY > 20
                ? "rgba(2,8,23,.92)"
                : "linear-gradient(to bottom, rgba(0,0,0,.75), transparent)";
    }, { passive: true });

}

// =============================================
// INICIALIZAR NAVBAR
// =============================================
function initNavbar(containerId = "main-header") {
    renderNavbar(containerId);

    console.log(
        "✅ Navbar inicializado correctamente"
    );
}

// =============================================
// EXPONER GLOBALMENTE
// =============================================
window.initNavbar = initNavbar;
window.renderNavbar = renderNavbar;
