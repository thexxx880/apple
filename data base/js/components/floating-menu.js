// =============================================
// FLOATING-MENU.JS - Componente de menú flotante (FAB)
// =============================================

function renderFloatingMenu() {
    let container = document.getElementById("floating-container");
    
    if (!container) {
        container = document.createElement("div");
        container.id = "floating-container";
        document.body.appendChild(container);
    }

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
}

function initFloatingMenu() {
    renderFloatingMenu();

    const fab = document.getElementById("fab");
    const floatingMenu = document.getElementById("floating-menu");

    if (!fab || !floatingMenu) {
        console.error("Error: No se pudieron crear los elementos del Floating Menu");
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
        if (floatingMenu.classList.contains("show")) {
            closeFloatingMenu();
        }
    }, { passive: true });

    console.log("✅ Floating Menu renderizado e inicializado");
}

window.initFloatingMenu = initFloatingMenu;
window.renderFloatingMenu = renderFloatingMenu;
