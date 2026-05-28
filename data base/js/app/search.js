// =============================================
// SEARCH.JS - Buscador (Desktop: sugerencias | Mobile: modal directo)
// =============================================
const JSON_URL = "https://raw.githubusercontent.com/thexxx880/apple/main/data%20base/search/search.json";
let database = [];

// Cargar base de datos
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

// Inyectar CSS
function injectSearchCSS() {
  if (document.getElementById("lz-search-css")) return;
  const style = document.createElement("style");
  style.id = "lz-search-css";
  style.textContent = `
    .lz-suggestions { position:absolute; top:100%; left:0; right:0; background:#0f172a; border:1px solid #2563eb; border-radius:16px; max-height:420px; overflow-y:auto; box-shadow:0 15px 35px rgba(0,0,0,.7); z-index:99999; display:none; margin-top:6px; }
    .lz-suggestion-item { padding:12px 16px; display:flex; align-items:center; gap:14px; cursor:pointer; border-bottom:1px solid #1e2937; }
    .lz-suggestion-item:hover { background:#1e40af; }
    .lz-suggestion-poster { width:46px; height:68px; object-fit:cover; border-radius:8px; }
    .lz-modal { display:none; position:fixed; inset:0; background:rgba(2,8,23,0.92); backdrop-filter:blur(12px); z-index:100000; align-items:center; justify-content:center; }
    .lz-modal-content { background:#020817; width:95%; max-width:1100px; max-height:92vh; border-radius:20px; padding:25px; overflow-y:auto; border:1px solid #2563eb; }
    .lz-modal-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; padding-bottom:15px; border-bottom:1px solid #1e2937; }
    .lz-close-btn { font-size:34px; cursor:pointer; color:#94a3b8; }
    .lz-results-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:20px; }
    .lz-result-card { background:#111827; border-radius:16px; overflow:hidden; cursor:pointer; transition:all .3s; }
    .lz-result-card:hover { transform:scale(1.06); box-shadow:0 15px 30px rgba(37,99,235,.4); }
    .lz-result-card img { width:100%; height:260px; object-fit:cover; }
    .lz-result-info { padding:14px; }
    .lz-result-info h4 { font-size:15px; line-height:1.3; margin-bottom:6px; }
    .lz-result-info small { color:#60a5fa; }
    .no-results { text-align:center; padding:80px 20px; color:#64748b; font-size:18px; }
  `;
  document.head.appendChild(style);
}

// Inyectar modal
function injectModal() {
  if (document.getElementById("lz-searchModal")) return;
  const modalHTML = `
    <div id="lz-searchModal" class="lz-modal">
      <div class="lz-modal-content">
        <div class="lz-modal-header">
          <h2>Buscar en LzPlay</h2>
          <span class="lz-close-btn" id="lz-closeModal">×</span>
        </div>
        <div id="lz-resultsGrid" class="lz-results-grid"></div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  document.getElementById("lz-closeModal").onclick = () => {
    document.getElementById("lz-searchModal").style.display = "none";
  };
  document.getElementById("lz-searchModal").onclick = (e) => {
    if (e.target.id === "lz-searchModal") document.getElementById("lz-searchModal").style.display = "none";
  };
}

// Mostrar sugerencias (solo desktop)
function showSuggestions(input, results) {
  let box = input.parentElement.querySelector(".lz-suggestions");
  if (!box) {
    box = document.createElement("div");
    box.className = "lz-suggestions";
    input.parentElement.style.position = "relative";
    input.parentElement.appendChild(box);
  }
  if (results.length === 0) {
    box.style.display = "none";
    return;
  }
  let html = "";
  results.slice(0, 8).forEach(item => {
    html += `<div class="lz-suggestion-item" onclick="window.openContent('${item.url}')">
      <img src="${item.poster}" class="lz-suggestion-poster">
      <div><h4>${item.titulo}</h4><small>${item.año}</small></div>
    </div>`;
  });
  box.innerHTML = html;
  box.style.display = "block";
}

// Abrir modal (usado tanto en desktop como en móvil)
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
        <div class="lz-result-info"><h4>${item.titulo}</h4><small>${item.año}</small></div>
      </div>`;
    });
    grid.innerHTML = html;
  }
  document.getElementById("lz-searchModal").style.display = "flex";
};

// Abrir contenido
window.openContent = function(url) {
  window.location.href = url;
};

// Inicializar buscador
async function initSearch() {
  await loadDatabase();
  injectSearchCSS();
  injectModal();

  setTimeout(() => {
    const searchInputs = document.querySelectorAll('.search-box input');
    searchInputs.forEach(input => {
      let timeout;

      // Sugerencias en tiempo real (Desktop)
      input.addEventListener("input", () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          const query = input.value.trim();
          const results = search(query);
          showSuggestions(input, results);
        }, 160);
      });

      // Enter abre modal completo
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          const query = input.value.trim();
          const results = search(query);
          window.openSearchModal(query);
          const box = input.parentElement.querySelector(".lz-suggestions");
          if (box) box.style.display = "none";
        }
      });

      // Cerrar sugerencias al clic fuera
      document.addEventListener("click", (e) => {
        if (!input.parentElement.contains(e.target)) {
          const box = input.parentElement.querySelector(".lz-suggestions");
          if (box) box.style.display = "none";
        }
      });
    });

    console.log("%c✅ Buscador LzPlay listo (Desktop: sugerencias | Mobile: modal)", "color:#60a5fa; font-weight:bold");
  }, 300);
}

// Auto-inicialización
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSearch);
} else {
  initSearch();
}

window.initSearch = initSearch;
