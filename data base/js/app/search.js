// =============================================
// SEARCH.JS - Versión FINAL (Mobile + Diseño mejorado)
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

// ================== CSS MEJORADO ==================
function injectSearchCSS() {
  if (document.getElementById("lz-search-css")) return;
  const style = document.createElement("style");
  style.id = "lz-search-css";
  style.textContent = `
    .lz-suggestions {
      position: absolute !important;
      top: 100% !important;
      left: 0 !important;
      right: 0 !important;
      background: #0f172a !important;
      border: 2px solid #2563eb !important;
      border-radius: 16px !important;
      max-height: 420px !important;
      overflow-y: auto !important;
      box-shadow: 0 20px 40px rgba(0,0,0,.8) !important;
      z-index: 99999 !important;
      display: none;
      margin-top: 8px !important;
    }
    .lz-suggestion-item {
      padding: 14px 18px !important;
      display: flex !important;
      align-items: center !important;
      gap: 16px !important;
      cursor: pointer !important;
    }
    .lz-suggestion-item:hover { background: #1e40af !important; }
    .lz-suggestion-poster {
      width: 48px !important;
      height: 70px !important;
      object-fit: cover !important;
      border-radius: 8px !important;
    }

    /* MODAL */
    .lz-modal {
      display: none !important;
      position: fixed !important;
      inset: 0 !important;
      background: rgba(2,8,23,0.95) !important;
      backdrop-filter: blur(12px) !important;
      z-index: 100000 !important;
      align-items: center !important;
      justify-content: center !important;
    }
    .lz-modal-content {
      background: #020817 !important;
      width: 95% !important;
      max-width: 1100px !important;
      max-height: 92vh !important;
      border-radius: 24px !important;
      padding: 25px !important;
      overflow-y: auto !important;
      border: 2px solid #2563eb !important;
    }
    .lz-modal-header {
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      margin-bottom: 20px !important;
      padding-bottom: 15px !important;
      border-bottom: 1px solid #1e2937 !important;
    }
    .lz-close-btn {
      font-size: 38px !important;
      cursor: pointer !important;
      color: #94a3b8 !important;
    }

    /* Resultados del modal */
    .lz-results-grid {
      display: grid !important;
      grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)) !important;
      gap: 22px !important;
    }
    .lz-result-card {
      background: #111827 !important;
      border-radius: 18px !important;
      overflow: hidden !important;
      cursor: pointer !important;
      transition: all .3s ease !important;
    }
    .lz-result-card:hover {
      transform: scale(1.08) !important;
      box-shadow: 0 20px 40px rgba(37,99,235,.5) !important;
    }
    .lz-result-card img {
      width: 100% !important;
      height: 290px !important;     /* Poster más grande */
      object-fit: cover !important;
    }
    .lz-result-info {
      padding: 14px !important;
    }
    .lz-result-info h4 {
      font-size: 15px !important;
      line-height: 1.3 !important;
      display: -webkit-box !important;
      -webkit-line-clamp: 2 !important;      /* Máximo 2 líneas */
      -webkit-box-orient: vertical !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      margin-bottom: 6px !important;
    }
    .lz-result-info small {
      color: #60a5fa !important;
      font-weight: 600 !important;
    }
    .no-results {
      text-align: center !important;
      padding: 100px 20px !important;
      color: #64748b !important;
      font-size: 1.1rem !important;
    }
  `;
  document.head.appendChild(style);
}

// Inyectar modal con input de búsqueda (para escribir en móvil)
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

  // Búsqueda en tiempo real dentro del modal
  let timeout;
  modalInput.addEventListener("input", () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      const query = modalInput.value.trim();
      window.openSearchModal(query);
    }, 180);
  });
}

// Mostrar sugerencias en desktop
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

// Abrir modal (usado por mobile y por Enter en desktop)
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

  // Enfocar el input del modal automáticamente
  setTimeout(() => {
    const modalInput = document.getElementById("modalSearchInput");
    if (modalInput) modalInput.focus();
  }, 300);
};

window.openContent = function(url) {
  window.location.href = url;
};

// Inicializar
async function initSearch() {
  await loadDatabase();
  injectSearchCSS();
  injectModal();

  setTimeout(() => {
    const inputs = document.querySelectorAll('.search-box input');
    inputs.forEach(input => {
      let timeout;

      input.addEventListener("input", () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          const query = input.value.trim();
          const results = search(query);
          showSuggestions(input, results);
        }, 160);
      });

      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          const query = input.value.trim();
          window.openSearchModal(query);
          const box = input.parentElement.querySelector(".lz-suggestions");
          if (box) box.style.display = "none";
        }
      });

      document.addEventListener("click", (e) => {
        if (!input.parentElement.contains(e.target)) {
          const box = input.parentElement.querySelector(".lz-suggestions");
          if (box) box.style.display = "none";
        }
      });
    });

    console.log("%c✅ Buscador mejorado (Mobile + Diseño final)", "color:#60a5fa; font-weight:bold");
  }, 400);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSearch);
} else {
  initSearch();
}

window.initSearch = initSearch;
