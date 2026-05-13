// =============================================
// LOADER.JS - Loader con tiempo mínimo de 2 segundos
// =============================================

let loaderStartTime = 0;
const MIN_LOADER_TIME = 2000; // ← 2 segundos mínimo

function initLoader() {
    const loader = document.getElementById('loader');
   
    if (!loader) {
        console.warn("⚠️ Loader no encontrado en el HTML");
        return;
    }

    loaderStartTime = Date.now();   // Guardamos el momento exacto en que inicia
    console.log("✅ Loader inicializado - Tiempo mínimo: 2 segundos");
}

// Función para ocultar el loader (respeta siempre los 2 segundos)
function hideLoader() {
    const loader = document.getElementById('loader');
    if (!loader) return;

    const elapsed = Date.now() - loaderStartTime;
    const remaining = Math.max(0, MIN_LOADER_TIME - elapsed);

    console.log(`⏱️ Loader visible durante ${elapsed}ms → esperando ${remaining}ms más`);

    // Inicia el fade-out
    loader.style.transition = 'opacity 0.6s ease';
    loader.style.opacity = '0';

    // Oculta definitivamente después del tiempo restante + animación
    setTimeout(() => {
        loader.style.display = 'none';
        console.log("✅ Loader ocultado correctamente (mínimo 2 segundos cumplidos)");
    }, remaining + 600);
}

// Exponer funciones globalmente
window.initLoader = initLoader;
window.hideLoader = hideLoader;

// Auto-inicializar
document.addEventListener("DOMContentLoaded", initLoader);
