// =============================================
// NAVBAR - LZPLAY (v5.3)
// Ruta correcta al buscador
// =============================================

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
            
            <!-- ICONO DE BÚSQUEDA -->
            <a href="search/search.html" class="search-icon-link" id="searchIcon">
                <i class="fas fa-search"></i>
            </a>
        </div>
        
        <div class="icons">
            <!-- ICONO MÓVIL -->
            <a href="search/search.html" class="icon-btn mobile-search" id="mobileSearchIcon">
                <i class="fas fa-search"></i>
            </a>
            
            <!-- PERFIL -->
            <a href="https://lzplayhd.online/apple/data%20base/menu.html" class="user-avatar">
                <img src="https://wallpapers.com/images/hd/netflix-profile-pictures-1000-x-1000-qo9h82134t9nv0j0.jpg" alt="Usuario">
            </a>
        </div>
    `;

    initNavbarEffects(container);
}

// ==================== EFECTOS NAVBAR ====================
function initNavbarEffects(headerElement) {
    window.addEventListener("scroll", () => {
        headerElement.style.background = window.scrollY > 20
            ? "rgba(2,8,23,.92)"
            : "linear-gradient(to bottom, rgba(0,0,0,.75), transparent)";
    }, { passive: true });
}

// ==================== INIT ====================
function initNavbar(containerId = "main-header") {
    renderNavbar(containerId);
    console.log("%c✅ Navbar actualizado (v5.3)", "color:#22c55e;font-weight:bold");
}

window.initNavbar = initNavbar;
window.renderNavbar = renderNavbar;
