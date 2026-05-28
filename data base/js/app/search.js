// =============================================
// SEARCH.JS - VERSIÓN ULTRA ROBUSTA (Mobile fix + Diseño)
// =============================================
const JSON_URL = "https://raw.githubusercontent.com/thexxx880/apple/main/data%20base/search/search.json";
let database = [];

// Cargar base de datos
async function loadDatabase() {
  try {
    const res = await fetch(JSON_URL);
    let text = await res.text();
    text = text.trim().replace(/,\s*}$/g, '}').replace(/,\s*]$/g, ']');
    let data = JSON.parse(text);
    if (!Array.isArray(data)) data = [data];
    database = data;
    console.log(`✅ Buscador cargado: ${database.length} contenidos`);
  } catch (e) {
    console.error("❌ Error cargando search.json", e);
  }
}

// Función de búsqueda
function search(query) {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase().trim();
  return database
    .map(item => {
      let score = 0;
      const titulo = (item.titulo || "").toLowerCase();
      const alternos = (item["titulo alternos"] || "").toLowerCase();
      const sinopsis = (item.sinopsis || "").toLowerCase();
      const id = String(item.id_tmdb || "");

      if (titulo.includes(q)) score += 100;
      if (alternos.includes(q)) score += 80;
      if (id === q) score += 70;
      if (sinopsis.includes(q)) score += 40;
      if (titulo.startsWith(q)) score += 30;

      return { ...item, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);
}

// ================== CSS (mantengo el que te gustó) ==================
function injectSearchCSS() {
  if (document.getElementById("lz-search-css")) return;
  const style = document.createElement("style");
  style.id = "lz-search-css";
  style.textContent = `... (el mismo CSS del mensaje anterior con poster grande y título en 2 líneas) ...`;
  document.head.appendChild(style);
}

// Inyectar modal
function injectModal() {
  if (document.getElementById("lz-searchModal")) return;
  const modalHTML = `
    <div id="lz-searchModal" class="lz-modal">
      <div class="lz-modal-content">
        <div class="lz-modal-header">
          <h2 style="margin:0; color:white;">Buscar en LzPlay</h2>
          <span class="lz-close-btn" id="lz-closeModal">×</span>
        </div>
        <input type="text" id="modalSearchInput" placeholder="Escribe para buscar..." 
               style="width:100%; padding:14px 18px; border-radius:50px; border:1px solid #2563eb; background:#111827; color:white; margin-bottom:20px; font-size:1rem;">
        <div id="lz-resultsGrid" class="lz-results-grid"></div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  const closeBtn = document.getElementById("lz-closeModal");
  const modalInput = document.getElementById("modalSearchInput");

  closeBtn.onclick = () => document.getElementById("lz-searchModal").style.display = "none";
  document.getElementById("lz-searchModal").onclick = (e) => {
    if (e.target.id === "lz-searchModal") document.getElementById("lz-searchModal").style.display = "none";
  };

  let timeout;
  modalInput.addEventListener("input", () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      window.openSearchModal(modalInput.value.trim());
    }, 180);
  });
}

// Función principal para abrir el modal (disponible desde cualquier parte)
window.openSearchModal = function(query = "") {
  const grid = document.getElementById("lz-resultsGrid");
  const results = search(query);

  if (results.length === 0) {
    grid.innerHTML = `<div class="no-results">😕 No encontramos resultados</div>`;
  } else {
    let html = "";
    results.forEach(item => {
      html += `<div class="lz-result-card" onclick="window.openContent('${item.url}')">
        <img src="${item.poster}" alt="${item.titulo}">
        <div class="lz-result-info">
          <h4>${item.titulo}</h4>
          <small>${item.año}</small>
        </div>
      </div>`;
    });
    grid.innerHTML = html;
  }
  document.getElementById("lz-searchModal").style.display = "flex";

  setTimeout(() => {
    const input = document.getElementById("modalSearchInput");
    if (input) input.focus();
  }, 200);
};

window.openContent = function(url) {
  window.location.href = url;
};

// ================== INICIALIZAR + ATTACH MOBILE BUTTON ==================
async function initSearch() {
  await loadDatabase();
  injectSearchCSS();
  injectModal();

  // === ATTACH DIRECTAMENTE AL BOTÓN MÓVIL (esto soluciona el problema) ===
  function attachMobileButton() {
    const mobileBtns = document.querySelectorAll('.mobile-search');
    mobileBtns.forEach(btn => {
      btn.style.cursor = "pointer";
      btn.onclick = (e) => {
        e.stopImmediatePropagation();
        console.log("📱 Botón móvil clickeado → abriendo modal");
        window.openSearchModal("");
      };
    });
  }

  setTimeout(() => {
    attachMobileButton();
    console.log("%c✅ Buscador cargado + botón móvil conectado", "color:#60a5fa;font-weight:bold");
  }, 500);

  // Reintentar por si el navbar se renderiza tarde
  setTimeout(attachMobileButton, 1200);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSearch);
} else {
  initSearch();
}

window.initSearch = initSearch;
