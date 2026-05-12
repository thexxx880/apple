// =============================================
// FLOATING-MENU.JS - Componente de menú flotante (FAB)
// =============================================

function initFloatingMenu() {
    const fab = document.getElementById("fab");
    const floatingMenu = document.getElementById("floating-menu");

    if (!fab || !floatingMenu) {
        console.warn("Elementos del Floating Menu no encontrados");
        return;
    }

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

    // Click en el botón FAB
    fab.addEventListener("click", (e) => {
        e.stopPropagation();
        openFloatingMenu();
    });

    // Cerrar al hacer click fuera
    document.addEventListener("click", (e) => {
        if (floatingMenu.classList.contains("show") && !floatingMenu.contains(e.target)) {
            closeFloatingMenu();
        }
    });

    // Cerrar al hacer scroll
    window.addEventListener("scroll", () => {
        if (floatingMenu.classList.contains("show")) {
            closeFloatingMenu();
        }
    }, { passive: true });

    console.log("✅ Floating Menu inicializado");
}

// Exponer globalmente
window.initFloatingMenu = initFloatingMenu;
