// =============================================
// FLOATING-MENU.JS - Versión limpia
// =============================================

function initFloatingMenu() {
    // Crear contenedor
    let container = document.getElementById("floating-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "floating-container";
        document.body.appendChild(container);
    }

    // Insertar HTML del menú
    container.innerHTML = `
        <div class="fab" id="fab">
            <i class="fas fa-plus"></i>
        </div>
        <div class="floating-menu" id="floating-menu">
            <div class="float-icon"><i class="fas fa-home"></i></div>
            <div class="float-icon"><i class="fas fa-fire"></i></div>
            <div class="float-icon"><i class="fas fa-film"></i></div>
            <div class="float-icon"><i class="fas fa-tv"></i></div>
        </div>
    `;

    const fab = document.getElementById("fab");
    const menu = document.getElementById("floating-menu");

    if (!fab || !menu) {
        console.error("No se encontraron los elementos del menú flotante");
        return;
    }

    // Funciones
    function openMenu() {
        menu.style.display = "flex";
        setTimeout(() => menu.classList.add("show"), 10);
        fab.classList.add("hidden");
    }

    function closeMenu() {
        menu.classList.remove("show");
        setTimeout(() => {
            menu.style.display = "none";
            fab.classList.remove("hidden");
        }, 300);
    }

    // Eventos
    fab.onclick = (e) => {
        e.stopPropagation();
        openMenu();
    };

    document.onclick = (e) => {
        if (menu.classList.contains("show") && !menu.contains(e.target)) {
            closeMenu();
        }
    };

    window.onscroll = () => {
        if (menu.classList.contains("show")) closeMenu();
    };

    console.log("✅ Floating Menu funcionando correctamente");
}

// Exponer
window.initFloatingMenu = initFloatingMenu;
