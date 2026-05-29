// =============================================
// FLOATING MENU - Con redirección
// =============================================

function initFloatingMenu() {
    // Buscar o crear contenedor
    let container = document.getElementById("floating-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "floating-container";
        document.body.appendChild(container);
    }

    // Insertar HTML con enlaces
    container.innerHTML = `
        <div class="fab" id="fab">
            <i class="fas fa-plus"></i>
        </div>
        <div class="floating-menu" id="floating-menu">
            <a href="https://lzplayhd.online/apple/data%20base/" class="float-icon">
                <i class="fas fa-home"></i>
            </a>
            <a href="#" class="float-icon">
                <i class="fas fa-fire"></i>
            </a>
            <a href="https://lzplayhd.online/apple/data%20base/categorias/categorias.html" class="float-icon">
                <i class="fas fa-film"></i>
            </a>
            <a href="../../data/serie.html" class="float-icon">
                <i class="fas fa-tv"></i>
            </a>
        </div>
    `;

    const fab = document.getElementById("fab");
    const menu = document.getElementById("floating-menu");

    if (!fab || !menu) {
        console.error("❌ Error cargando Floating Menu");
        return;
    }

    // Abrir menú
    function openMenu() {
        menu.style.display = "flex";
        setTimeout(() => menu.classList.add("show"), 10);
        fab.classList.add("hidden");
    }

    // Cerrar menú
    function closeMenu() {
        menu.classList.remove("show");
        setTimeout(() => {
            menu.style.display = "none";
            fab.classList.remove("hidden");
        }, 300);
    }

    // Click en FAB
    fab.addEventListener("click", (e) => {
        e.stopPropagation();
        openMenu();
    });

    // Click fuera del menú
    document.addEventListener("click", (e) => {
        if (menu.classList.contains("show") && !menu.contains(e.target)) {
            closeMenu();
        }
    });

    // Cerrar al hacer scroll
    window.addEventListener("scroll", () => {
        if (menu.classList.contains("show")) {
            closeMenu();
        }
    }, { passive: true });

    console.log("✅ Floating Menu cargado correctamente con enlaces");
}

// Exponer globalmente
window.initFloatingMenu = initFloatingMenu;

// Ejecutar automáticamente
initFloatingMenu();
