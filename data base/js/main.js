// =============================================
// MAIN.JS - Punto de entrada de la aplicación
// =============================================

document.addEventListener("DOMContentLoaded", () => {
    console.log("🎬 LzPlay - Aplicación iniciada");

    // Inicializar Navbar (componente modular)
    if (window.initNavbar) {
        window.initNavbar("main-header");
    } else {
        console.warn("Navbar component no disponible");
    }

    // Inicializar componentes globales
    initFloatingMenu();
    initSearchListeners();
});

/**
 * Inicializa el menú flotante (FAB)
 */
function initFloatingMenu() {
    const fab = document.getElementById("fab");
    const floatingMenu = document.getElementById("floating-menu");

    if (!fab || !floatingMenu) return;

    function openFloatingMenu() {
        floatingMenu.style.display = "flex";
        setTimeout(() => floatingMenu.classList.add("show"), 10);
        fab.classList.add("hidden");
    }

    function closeFloatingMenu() {
        floatingMenu.classList.remove("show");
        setTimeout(() => {
            floatingMenu.style.display = "none";
            fab.classList.remove("hidden");
        }, 350);
    }

    fab.addEventListener("click", (e) => {
        e.stopPropagation();
        openFloatingMenu();
    });

    document.addEventListener("click", (e) => {
        if (floatingMenu.classList.contains("show") && !floatingMenu.contains(e.target)) {
            closeFloatingMenu();
        }
    });

    window.addEventListener("scroll", () => {
        if (floatingMenu.classList.contains("show")) closeFloatingMenu();
    }, { passive: true });
}

/**
 * Listeners básicos para búsqueda (placeholder)
 */
function initSearchListeners() {
    const searchInputs = document.querySelectorAll(".search-box input");
    
    searchInputs.forEach(input => {
        input.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                const query = input.value.trim();
                if (query.length > 2) {
                    alert(`Buscando: "${query}"\n\n(Próximamente: integración con búsqueda real)`);
                    // TODO: Implementar búsqueda real con router o modal
                }
            }
        });
    });
}