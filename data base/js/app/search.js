// =============================================
// SEARCH.JS - Versión corregida (maneja JSON con errores comunes)
// =============================================
const JSON_URL = "https://raw.githubusercontent.com/thexxx880/apple/main/data%20base/search/search.json";
let database = [];

// ================== CARGAR Y LIMPIAR JSON ==================
async function loadDatabase() {
  try {
    const res = await fetch(JSON_URL);
    let text = await res.text();

    // LIMPIEZA AUTOMÁTICA de errores comunes en GitHub
    text = text.trim()
      .replace(/,\s*}$/g, '}')           // elimina coma antes de }
      .replace(/,\s*]$/g, ']')           // elimina coma antes de ]
      .replace(/}\s*,/g, '},')           // corrige comas entre objetos
      .replace(/,\s*$/, '');             // elimina coma final

    // Si no empieza con [ ni {, lo convertimos en array
    if (!text.startsWith('[') && !text.startsWith('{')) {
      text = '[' + text + ']';
    }

    let data = JSON.parse(text);

    if (!Array.isArray(data)) data = [data];
    database = data;

    console.log(`✅ Buscador cargado correctamente: ${database.length} contenidos`);
  } catch (e) {
    console.error("❌ Error cargando search.json →", e.message);
    console.log("💡 Revisa que search.json sea un array válido: [ {obj1}, {obj2} ] sin coma final");
  }
}

// ================== FUNCIÓN DE BÚSQUEDA ==================
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

// ================== RESTO DEL CÓDIGO (igual que antes) ==================
function injectSearchCSS() {
  if (document.getElementById("lz-search-css")) return;
  const style = document.createElement("style");
  style.id = "lz-search-css";
  style.textContent = `... (el mismo CSS que te di en el mensaje anterior) ...`; 
  // ← Aquí pega el CSS completo del mensaje anterior si quieres, o déjalo como estaba
  document.head.appendChild(style);
}

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

  document.getElementById("lz-closeModal").onclick = () => document.getElementById("lz-searchModal").style.display = "none";
  document.getElementById("lz-searchModal").onclick = (e) => {
    if (e.target.id === "lz-searchModal") document.getElementById("lz-searchModal").style.display = "none";
  };
}

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

window.openContent = function(url) {
  window.location.href = url;
};

async function initSearch() {
  await loadDatabase();
  injectSearchCSS();
  injectModal();

  setTimeout(() => {
    const searchInputs = document.querySelectorAll('.search-box input');
    searchInputs.forEach(input => {
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
    console.log("%c✅ Buscador LzPlay cargado (Desktop sugerencias | Mobile modal)", "color:#60a5fa;font-weight:bold");
  }, 300);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSearch);
} else {
  initSearch();
}

window.initSearch = initSearch;
