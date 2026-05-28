// ====================== BUSCADOR LZPLAY - SCRIPT ======================
const JSON_URL = "https://raw.githubusercontent.com/thexxx880/apple/main/data%20base/search/search.json";
let database = [];

async function loadDatabase() {
  try {
    const res = await fetch(JSON_URL);
    let data = await res.json();
    if (!Array.isArray(data)) data = [data];
    database = data;
    console.log(`✅ Buscador cargado: ${database.length} contenidos`);
  } catch (e) {
    console.error("Error al cargar search.json", e);
  }
}

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

function initLzPlaySearch() {
  const input = document.getElementById("lz-searchInput");
  if (!input) return console.error("Buscador no encontrado");

  let timeout;

  input.addEventListener("input", () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      const query = input.value.trim();
      const results = search(query);
      showSuggestions(results);
    }, 180);
  });

  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const query = input.value.trim();
      if (query.length < 2) return;
      document.getElementById("lz-suggestions").style.display = "none";
      const results = search(query);
      showModal(query, results);
    }
  });

  // Cerrar modal
  document.getElementById("lz-closeModal").onclick = () => {
    document.getElementById("lz-searchModal").style.display = "none";
  };
  document.getElementById("lz-searchModal").onclick = (e) => {
    if (e.target.id === "lz-searchModal") document.getElementById("lz-searchModal").style.display = "none";
  };

  console.log("%c✅ Buscador LzPlay inicializado correctamente", "color:#ffcc00;font-weight:bold");
}

// ================== FUNCIONES AUXILIARES ==================
function showSuggestions(results) {
  const container = document.getElementById("lz-suggestions");
  if (results.length === 0) {
    container.style.display = "none";
    return;
  }

  let html = "";
  results.slice(0, 8).forEach(item => {
    html += `
      <div class="lz-suggestion-item" onclick="window.openContent('${item.url}')">
        <img src="${item.poster}" class="lz-suggestion-poster" alt="">
        <div>
          <h4>${item.titulo}</h4>
          <small>${item.año}</small>
        </div>
      </div>`;
  });
  container.innerHTML = html;
  container.style.display = "block";
}

function showModal(query, results) {
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

window.openContent = function(url) {
  window.location.href = url;
};

// ================== INICIALIZACIÓN AUTOMÁTICA AL CARGAR EL SCRIPT ==================
window.initLzPlaySearch = initLzPlaySearch;
console.log("%c📦 Buscador LzPlay listo para carga dinámica", "color:#46d369");
