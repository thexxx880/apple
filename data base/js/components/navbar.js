// =============================================
// NAVBAR + BUSCADOR UNIFICADO - LZPLAY (v3.0)
// Ambos botones abren modal + Búsqueda en modal
// =============================================

// ==================== CONFIG ====================
const JSON_URL = "https://raw.githubusercontent.com/thexxx880/apple/main/data%20base/search/search.json";
let database = [];

// ==================== NAVBAR ====================
function renderNavbar(containerId = "main-header") {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Contenedor #${containerId} no encontrado`);
        return;
    }

    container.innerHTML = `
        <a href="https://lzplayhd.online/apple/data%20base/" class="logo">LZPLAY</a>
  
        <div class="nav-center">
            <a href="https://lzplayhd.online/apple/data%20base/" class="nav-link">Inicio</a>
            <a href="#" class="nav-link">Tendencias</a>
            <a href="../data/movie.html" class="nav-link">Películas</a>
            <a href="../data/serie.html" class="nav-link">Series</a>
           
            <div class="search-box">
                <i class="fas fa-search"></i>
                <input type="text" placeholder="Buscar películas o series">
            </div>
        </div>
  
        <div class="icons">
            <!-- BUSCADOR MÓVIL -->
            <a href="#" class="icon-btn mobile-search"
               onclick="event.preventDefault(); window.openSearchModal();">
                <i class="fas fa-search"></i>
            </a>
           
            <!-- PERFIL -->
            <a href="https://lzplayhd.online/apple/data%20base/menu.html" class="user-avatar">
                <img src="https://wallpapers.com/images/hd/netflix-profile-pictures-1000-x-1000-qo9h82134t9nv0j0.jpg" alt="Usuario">
            </a>
        </div>
    `;

    initNavbarEffects(container);
    initSearch(); // Inicializa buscador inmediatamente
}

// ==================== EFECTOS NAVBAR ====================
function initNavbarEffects(headerElement) {
    window.addEventListener("scroll", () => {
        headerElement.style.background = window.scrollY > 20
            ? "rgba(2,8,23,.92)"
            : "linear-gradient(to bottom, rgba(0,0,0,.75), transparent)";
    }, { passive: true });
}

// ==================== BUSCADOR ====================
async function loadDatabase() {
    try {
        const res = await fetch(JSON_URL);
        let text = await res.text();
        text = text.trim().replace(/,\s*}$/g, '}').replace(/,\s*]$/g, ']');
        let data = JSON.parse(text);
        if (!Array.isArray(data)) data = [data];
        database = data;
        console.log(`✅ Base de datos cargada: ${database.length} contenidos`);
    } catch (e) {
        console.error("❌ Error cargando search.json", e);
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

// ==================== INYECTAR CSS ====================
function injectSearchCSS() {
    if (document.getElementById("lz-search-css")) return;

    const style = document.createElement("style");
    style.id = "lz-search-css";
    style.textContent = `
        .lz-suggestions {
            position: absolute !important; top: 100% !important; left: 0 !important; right: 0 !important;
            background: #0f172a !important; border: 2px solid #2563eb !important; border-radius: 16px !important;
            max-height: 420px !important; overflow-y: auto !important; box-shadow: 0 20px 40px rgba(0,0,0,.9) !important;
            z-index: 99999 !important; display: none; margin-top: 8px !important;
        }
        .lz-suggestion-item {
            padding: 14px 18px !important; display: flex !important; align-items: center !important;
            gap: 16px !important; cursor: pointer !important;
        }
        .lz-suggestion-item:hover { background: #1e40af !important; }
        .lz-suggestion-poster { width: 48px !important; height: 70px !important; object-fit: cover !important; border-radius: 8px !important; }
       
        .lz-modal {
            display: none !important; position: fixed !important; inset: 0 !important;
            background: rgba(2,8,23,0.95) !important; backdrop-filter: blur(12px) !important;
            z-index: 100000 !important; align-items: center !important; justify-content: center !important;
        }
        .lz-modal-content {
            background: #020817 !important; width: 95% !important; max-width: 1100px !important;
            max-height: 92vh !important; border-radius: 24px !important; padding: 25px !important;
            overflow-y: auto !important; border: 2px solid #2563eb !important;
        }
        .lz-modal-header { display: flex !important; justify-content: space-between !important; align-items: center !important; margin-bottom: 20px !important; padding-bottom: 15px !important; border-bottom: 1px solid #1e2937 !important; }
        .lz-close-btn { font-size: 38px !important; cursor: pointer !important; color: #94a3b8 !important; }
       
        .lz-results-grid {
            display: grid !important; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)) !important; gap: 22px !important;
        }
        .lz-result-card {
            background: #111827 !important; border-radius: 18px !important; overflow: hidden !important;
            cursor: pointer !important; transition: all .3s ease !important;
        }
        .lz-result-card:hover { transform: scale(1.08) !important; box-shadow: 0 20px 40px rgba(37,99,235,.5) !important; }
        .lz-result-card img { width: 100% !important; height: 290px !important; object-fit: cover !important; }
        .lz-result-info { padding: 14px !important; }
        .lz-result-info h4 {
            font-size: 15px !important; line-height: 1.3 !important; display: -webkit-box !important;
            -webkit-line-clamp: 2 !important; -webkit-box-orient: vertical !important; overflow: hidden !important;
        }
        .lz-result-info small { color: #60a5fa !important; font-weight: 600 !important; }
        .no-results { text-align: center !important; padding: 100px 20px !important; color: #64748b !important; font-size: 1.1rem !important; }
    `;
    document.head.appendChild(style);
}

// ==================== MODAL ====================
function injectModal() {
    if (document.getElementById("lz-searchModal")) return;

    const modalHTML = `
        <div id="lz-searchModal" class="lz-modal">
            <div class="lz-modal-content">
                <div class="lz-modal-header">
                    <h2 style="margin:0; color:white;">Buscar en LzPlay</h2>
                    <span class="lz-close-btn" id="lz-closeModal">×</span>
                </div>
                
                <!-- INPUT + BOTÓN BUSCAR -->
                <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                    <input type="text" id="modalSearchInput" placeholder="Escribe para buscar..." 
                           style="flex:1; padding:14px 18px; border-radius:50px; border:1px solid #2563eb; background:#111827; color:white; font-size:1rem;">
                    <button onclick="performModalSearch()" 
                            style="padding: 0 28px; border-radius: 50px; border: none; background: #2563eb; color: white; font-weight: 600; cursor: pointer; font-size: 1rem;">
                        Buscar
                    </button>
                </div>
                
                <div id="lz-resultsGrid" class="lz-results-grid"></div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    // Cerrar modal
    document.getElementById("lz-closeModal").onclick = () => {
        document.getElementById("lz-searchModal").style.display = "none";
    };
    document.getElementById("lz-searchModal").onclick = (e) => {
        if (e.target.id === "lz-searchModal") {
            document.getElementById("lz-searchModal").style.display = "none";
        }
    };

    // Funcionalidad del input del modal
    const modalInput = document.getElementById("modalSearchInput");
    if (modalInput) {
        let timeout;
        modalInput.addEventListener("input", () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                const query = modalInput.value.trim();
                const results = search(query);
                renderModalResults(results);
            }, 200);
        });

        modalInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                performModalSearch();
            }
        });
    }
}

// Renderizar resultados en el modal
function renderModalResults(results) {
    const grid = document.getElementById("lz-resultsGrid");
    if (!grid) return;

    if (results.length === 0) {
        grid.innerHTML = `<div class="no-results">😕 No encontramos resultados</div>`;
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
                </div>
            `;
        });
        grid.innerHTML = html;
    }
}

// Función del botón "Buscar" del modal
window.performModalSearch = function() {
    const input = document.getElementById("modalSearchInput");
    if (!input) return;

    const query = input.value.trim();
    const results = search(query);
    renderModalResults(results);
};

// ==================== FUNCIONES DEL BUSCADOR ====================
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
        html += `
            <div class="lz-suggestion-item" onclick="window.openContent('${item.url}')">
                <img src="${item.poster}" class="lz-suggestion-poster">
                <div>
                    <h4>${item.titulo}</h4>
                    <small>${item.año}</small>
                </div>
            </div>
        `;
    });
    box.innerHTML = html;
    box.style.display = "block";
}

window.openSearchModal = function(query = "") {
    const modal = document.getElementById("lz-searchModal");
    const input = document.getElementById("modalSearchInput");
    const grid = document.getElementById("lz-resultsGrid");

    // Si hay query, buscar y mostrar resultados
    const results = search(query);
    renderModalResults(results);

    modal.style.display = "flex";

    // Enfocar el input del modal
    if (input) {
        setTimeout(() => {
            input.focus();
            if (query) input.value = query;
        }, 300);
    }
};

window.openContent = function(url) {
    window.location.href = url;
};

// ==================== INICIALIZACIÓN ====================
async function initSearch() {
    await loadDatabase();
    injectSearchCSS();
    injectModal();

    // === DESKTOP: Sugerencias + Enter abre modal ===
    const inputs = document.querySelectorAll('.search-box input');
    inputs.forEach(input => {
        let timeout;

        input.addEventListener("input", () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                const results = search(input.value.trim());
                showSuggestions(input, results);
            }, 160);
        });

        // Enter → abrir modal con resultados
        input.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                const query = input.value.trim();
                window.openSearchModal(query);
                const box = input.parentElement.querySelector(".lz-suggestions");
                if (box) box.style.display = "none";
            }
        });

        // Cerrar sugerencias al hacer clic fuera
        document.addEventListener("click", (e) => {
            if (!input.parentElement.contains(e.target)) {
                const box = input.parentElement.querySelector(".lz-suggestions");
                if (box) box.style.display = "none";
            }
        });
    });

    console.log("%c✅ Navbar + Buscador unificado v3.0 cargado", "color:#22c55e; font-weight:bold");
}

// ==================== FUNCIÓN PRINCIPAL ====================
function initNavbar(containerId = "main-header") {
    renderNavbar(containerId);
    console.log("✅ Navbar inicializado (versión unificada v3.0)");
}

window.initNavbar = initNavbar;
window.renderNavbar = renderNavbar;
