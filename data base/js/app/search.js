// =============================================
// SEARCH.JS - Buscador avanzado con sugerencias en tiempo real + Modal
// =============================================
const JSON_URL = "https://raw.githubusercontent.com/thexxx880/apple/main/data%20base/search/search.json";

let database = [];

// ================== CARGAR BASE DE DATOS ==================
async function loadDatabase() {
  try {
    const res = await fetch(JSON_URL);
    let data = await res.json();
    if (!Array.isArray(data)) data = [data];
    database = data;
    console.log(`✅ Buscador cargado: ${database.length} contenidos`);
  } catch (e) {
    console.error("❌ Error cargando search.json", e);
  }
}

// ================== FUNCIÓN DE BÚSQUEDA INTELIGENTE ==================
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

// ================== INYECTAR CSS (una sola vez) ==================
function injectSearchCSS() {
  if (document.getElementById("lz-search-css")) return;
  const style = document.createElement("style");
  style.id = "lz-search-css";
  style.textContent = `
    .lz-suggestions { position:absolute; top:100%; left:0; right:0; background:rgba(25,25,25,0.98); border-radius:18px; max-height:420px; overflow-y:auto; box-shadow:0 15px 35px rgba(0,0,0,.7); z-index:9999; display:none; margin-top:8px; }
    .lz-suggestion-item { padding:14px 20px; display:flex; align-items:center; gap:15px; cursor:pointer; border-bottom:1px solid #333; }
    .lz-suggestion-item:hover { background:rgba(255,204,0,0.15); }
    .lz-suggestion-poster { width:48px; height:70px; object-fit:cover; border-radius:8px; }
    .lz-modal { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.9); backdrop-filter:blur(12px); z-index:100000; align-items:center; justify-content:center; }
    .lz-modal-content { background:rgba(20,20,20,0.97); width:95%; max-width:1100px; max-height:92vh; border-radius:24px; padding:25px; overflow-y:auto; }
    .lz-modal-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; padding-bottom:15px; border-bottom:1px solid #333; }
    .lz-close-btn { font-size:34px; cursor:pointer; color:#aaa; }
    .lz-results-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:20px; }
    .lz-result-card { background:#111; border-radius:16px; overflow:hidden; cursor:pointer; transition:all .3s; }
    .lz-result-card:hover { transform:scale(1.06); box-shadow:0 15px 30px rgba(255,204,0,.3); }
    .lz-result-card img { width:100%; height:260px; object-fit:cover; }
    .lz-result-info { padding:14px; }
    .lz-result-info h4 { font-size:15px; line-height:1.3; margin-bottom:6px; }
    .lz-result-info small { color:#ffcc00; }
    .no-results { text-align:center; padding:80px 20px; color:#aaa; font-size:18px; }
  `;
  document.head.appendChild(style);
}

// ================== INYECTAR MODAL ==================
function injectModal() {
  if (document.getElementById("lz-searchModal")) return;
  const modalHTML = `
    <div id="lz-searchModal" class="lz-modal">
      <div class="lz-modal-content">
        <div class="lz-modal-header">
          <h2>Resultados para: <span id="lz-modalQuery"></span></h2>
          <span class="lz-close-btn" id="lz-closeModal">×</span>
        </div>
        <div id="lz-resultsGrid" class="lz-results-grid"></div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  // Eventos del modal
  document.getElementById("lz-closeModal").onclick = () => {
    document.getElementById("lz-searchModal").style.display = "none";
  };
  document.getElementById("lz-searchModal").onclick = (e) => {
    if (e.target.id === "lz-searchModal") document.getElementById("lz-searchModal").style.display = "none";
  };
}

// ================== MOSTRAR SUGERENCIAS DEBAJO DEL INPUT ==================
function showSuggestions(input, results) {
  let suggestionsBox = input.parentElement.querySelector(".lz-suggestions");
  if (!suggestionsBox) {
    suggestionsBox = document.createElement("div");
    suggestionsBox.className = "lz-suggestions";
    input.parentElement.style.position = "relative";
    input.parentElement.appendChild(suggestionsBox);
  }

  if (results.length === 0) {
    suggestionsBox.style.display = "none";
    return;
  }

  let html = "";
  results.slice(0, 8).forEach(item => {
    html += `
      <div class="lz-suggestion-item" onclick="window.openContent('${item.url}')">
        <img src="${item.poster}" class="lz-suggestion-poster">
        <div>
          <h4>${item.titulo}</h4>
          <small>${item.año}</small>
        </div>
      </div>`;
  });
  suggestionsBox.innerHTML = html;
  suggestionsBox.style.display = "block";
}

// ================== MOSTRAR MODAL ==================
function showSearchModal(query, results) {
  document.getElementById("lz-modalQuery").textContent = `"${query}"`;
  const grid = document.getElementById("lz-resultsGrid");

  if (results.length === 0) {
    grid.innerHTML = `<div class="no-results">😕 No encontramos resultados para <strong>${query}</strong></div>`;
  } else {
    let html = "";
    results.forEach(item => {
      html += `
        <div class="lz-result-card" onclick="window.openContent('${item.url}')">
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
}

// ================== ABRIR CONTENIDO ==================
window.openContent = function(url) {
  window.location.href = url;
};

// ================== INICIALIZAR BUSCADOR ==================
function initSearch() {
  injectSearchCSS();
  injectModal();

  // Buscar todos los inputs de búsqueda (desktop + móvil)
  const searchInputs = document.querySelectorAll('.search-box input');

  searchInputs.forEach(input => {
    let timeout;

    input.addEventListener("input", () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const query = input.value.trim();
        const results = search(query);
        showSuggestions(input, results);
      }, 180);
    });

    // Al presionar Enter → abrir modal
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const query = input.value.trim();
        if (query.length < 2) return;
        const results = search(query);
        showSearchModal(query, results);
        // ocultar sugerencias
        const suggestionsBox = input.parentElement.querySelector(".lz-suggestions");
        if (suggestionsBox) suggestionsBox.style.display = "none";
      }
    });

    // Cerrar sugerencias al hacer clic fuera
    document.addEventListener("click", (e) => {
      if (!input.parentElement.contains(e.target)) {
        const suggestionsBox = input.parentElement.querySelector(".lz-suggestions");
        if (suggestionsBox) suggestionsBox.style.display = "none";
      }
    });
  });

  console.log("%c✅ Buscador avanzado LzPlay cargado correctamente", "color:#ffcc00; font-weight:bold");
}

// ================== AUTO-INICIALIZACIÓN ==================
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSearch);
} else {
  initSearch();
}

// Exponer para poder llamarlo manualmente desde navbar.js
window.initSearch = initSearch;
