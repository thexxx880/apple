// =============================================
// FLOATING MENU
// =============================================

function initFloatingMenu() {

    // Buscar contenedor
    let container = document.getElementById("floating-container");

    // Si no existe, crearlo
    if (!container) {
        container = document.createElement("div");
        container.id = "floating-container";
        document.body.appendChild(container);
    }

    // Insertar HTML
    container.innerHTML = `
        <div class="fab" id="fab">
            <i class="fas fa-plus"></i>
        </div>

        <div class="floating-menu" id="floating-menu">

            <div class="float-icon">
                <i class="fas fa-home"></i>
            </div>

            <div class="float-icon">
                <i class="fas fa-fire"></i>
            </div>

            <div class="float-icon">
                <i class="fas fa-film"></i>
            </div>

            <div class="float-icon">
                <i class="fas fa-tv"></i>
            </div>

        </div>
    `;

    // Elementos
    const fab = document.getElementById("fab");
    const menu = document.getElementById("floating-menu");

    // Verificación
    if (!fab || !menu) {
        console.error("❌ Error cargando Floating Menu");
        return;
    }

    // Abrir menú
    function openMenu() {
        menu.style.display = "flex";

        setTimeout(() => {
            menu.classList.add("show");
        }, 10);

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

    // Click FAB
    fab.addEventListener("click", (e) => {
        e.stopPropagation();
        openMenu();
    });

    // Click afuera
    document.addEventListener("click", (e) => {

        if (
            menu.classList.contains("show") &&
            !menu.contains(e.target)
        ) {
            closeMenu();
        }
    });

    // Scroll
    window.addEventListener("scroll", () => {

        if (menu.classList.contains("show")) {
            closeMenu();
        }
    });

    console.log("✅ Floating Menu cargado correctamente");
}

// Exponer globalmente
window.initFloatingMenu = initFloatingMenu;

// Ejecutar automáticamente
initFloatingMenu();
