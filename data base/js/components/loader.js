// =============================================
// LOADER.JS - Loader con div pre-existente
// =============================================

function initLoader() {
    const loader = document.getElementById('loader');
    
    if (!loader) {
        console.warn("⚠️ Loader no encontrado en el HTML");
        return;
    }

    console.log("✅ Loader inicializado correctamente");
}

// Función para ocultar el loader cuando el contenido ya cargó
function hideLoader() {
    const loader = document.getElementById('loader');
    if (!loader) return;

    loader.style.opacity = '0';
    
    setTimeout(() => {
        loader.style.display = 'none';
    }, 500);
}

// Exponer funciones globalmente para usarlas en cualquier página
window.initLoader = initLoader;
window.hideLoader = hideLoader;

// Auto-inicializar
document.addEventListener("DOMContentLoaded", initLoader);
