// =============================================
// SEARCH.JS - Compatible con Navbar dinámico
// =============================================
const JSON_URL =
"https://raw.githubusercontent.com/thexxx880/apple/main/data%20base/search/search.json";
let database = [];
let dbLoaded = false;

// TMDB API Configuration
const TMDB_API_KEY = "38e497c6c1a043d1341416e80915669f";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// =============================================
// CARGAR DATABASE (manteniendo compatibilidad)
// =============================================
async function loadDatabase() {
    if (dbLoaded) return;
    try {
        const res = await fetch(JSON_URL);
        if (!res.ok) {
            throw new Error("No se pudo cargar search.json");
        }
        const data = await res.json();
        database = Array.isArray(data)
            ? data
            : [data];
        dbLoaded = true;
        console.log(
            `✅ Search DB cargada (${database.length})`
        );
    } catch (err) {
        console.error("❌ Error search.json", err);
    }
}

// =============================================
// TMDB SEARCH (nuevo motor principal para sugerencias)
// =============================================
async function searchTMDB(query) {
    if (!query || query.length < 2) {
        return [];
    }

    try {
        // Búsqueda multi (películas + series) con soporte para varios idiomas
        const languages = ['es', 'es-MX', 'en']; // español, latino, inglés
        let allResults = [];

        // Hacer búsquedas en paralelo para los idiomas prioritarios
        const promises = languages.map(async (lang) => {
            const url = `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=${lang}&page=1&include_adult=false`;
            
            const res = await fetch(url);
            if (!res.ok) return [];
            
            const data = await res.json();
            return (data.results || []).map(item => {
                let titulo = '';
                let poster = '';
                let año = '';
                let tipo = item.media_type || 'movie';
                let urlFinal = '#'; // Se puede personalizar según tu sitio

                if (tipo === 'movie' || tipo === 'tv') {
                    titulo = item.title || item.name || 'Sin título';
                    poster = item.poster_path 
                        ? `https://image.tmdb.org/t/p/w92${item.poster_path}` 
                        : 'https://via.placeholder.com/50x75?text=No+Image';
                    año = (item.release_date || item.first_air_date || '').substring(0, 4);
                    
                    // Construir URL para tu sitio (ajusta según tu estructura)
                    // Ejemplo: /pelicula/tmdb-id-titulo o usa tu DB para matching
                    const slug = titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                    urlFinal = tipo === 'movie' 
                        ? `/pelicula/${item.id}-${slug}` 
                        : `/serie/${item.id}-${slug}`;
                }

                return {
                    id_tmdb: item.id,
                    titulo: titulo,
                    poster: poster,
                    año: año,
                    url: urlFinal,
                    media_type: tipo,
                    score: 100, // Prioridad alta para resultados de TMDB
                    source: 'tmdb'
                };
            });
        });

        const resultsArrays = await Promise.all(promises);
        allResults = resultsArrays.flat();

        // Eliminar duplicados por ID TMDB
        const uniqueResults = [];
        const seen = new Set();
        
        for (const item of allResults) {
            if (item.id_tmdb && !seen.has(item.id_tmdb)) {
                seen.add(item.id_tmdb);
                uniqueResults.push(item);
            }
        }

        // Ordenar por relevancia (puedes mejorar con más lógica)
        return uniqueResults.slice(0, 12); // Más resultados que antes
    } catch (err) {
        console.error("❌ Error en búsqueda TMDB:", err);
        return [];
    }
}

// =============================================
// SEARCH ENGINE (combinado: local + TMDB)
// =============================================
async function search(query) {
    if (!query || query.length < 2) {
        return [];
    }

    // Primero buscar en base local (manteniendo funcionalidad original)
    const q = query.toLowerCase().trim();
    const localResults = database
        .map(item => {
            let score = 0;
            const titulo =
                (item.titulo || "")
                .toLowerCase();
            const alternos =
                (item["titulo alternos"] || "")
                .toLowerCase();
            const sinopsis =
                (item.sinopsis || "")
                .toLowerCase();
            const id =
                String(item.id_tmdb || "");
            if (titulo.includes(q))
                score += 100;
            if (alternos.includes(q))
                score += 80;
            if (id === q)
                score += 70;
            if (sinopsis.includes(q))
                score += 40;
            if (titulo.startsWith(q))
                score += 30;
            return {
                ...item,
                score
            };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score);

    // Complementar con TMDB para más resultados y mejor precisión
    const tmdbResults = await searchTMDB(query);

    // Combinar resultados (local primero, luego TMDB)
    const combined = [...localResults];
    
    // Agregar TMDB evitando duplicados por id_tmdb o título aproximado
    const localIds = new Set(localResults.map(item => item.id_tmdb || item.id));
    
    for (const tmdbItem of tmdbResults) {
        if (!localIds.has(tmdbItem.id_tmdb)) {
            combined.push(tmdbItem);
        }
    }

    return combined;
}

// =============================================
// SUGERENCIAS (mejorada)
// =============================================
function showSuggestions(input, results) {
    let box =
        input.parentElement.querySelector(
            ".lz-suggestions"
        );
    if (!box) {
        box =
            document.createElement("div");
        box.className =
            "lz-suggestions";
        input.parentElement.appendChild(box);
    }
    if (!results.length) {
        box.innerHTML = "";
        box.style.display = "none";
        return;
    }
    box.innerHTML =
        results.slice(0, 10) // Aumentado un poco
        .map(item => `
            <div class="lz-suggestion-item"
                data-url="${item.url}">
                <img
                    src="${item.poster || 'https://via.placeholder.com/50x75?text=No+Image'}"
                    class="lz-suggestion-poster"
                    onerror="this.src='https://via.placeholder.com/50x75?text=No+Image'"
                >
                <div>
                    <h4>${item.titulo}</h4>
                    <small>${item.año || ""} ${item.media_type ? `(${item.media_type === 'tv' ? 'Serie' : 'Película'})` : ''}</small>
                </div>
            </div>
        `)
        .join("");
    box.style.display = "block";
    box.onclick = (e) => {
        const card =
            e.target.closest(
                ".lz-suggestion-item"
            );
        if (!card) return;
        window.location.href =
            card.dataset.url;
    };
}

// =============================================
// ATTACH SEARCH TO NAVBAR
// =============================================
window.attachNavbarSearch =
async function () {
    await loadDatabase();
    const input =
        document.querySelector(
            "#navbar-search"
        );
    if (!input) return;
    // evitar listeners duplicados
    if (input.dataset.loaded)
        return;
    input.dataset.loaded = true;
    let timeout;
    input.addEventListener(
        "input",
        () => {
            clearTimeout(timeout);
            timeout = setTimeout(async () => {
                const results =
                    await search(input.value); // Ahora async
                showSuggestions(
                    input,
                    results
                );
            }, 150); // Ligero aumento para API
        }
    );
    // ENTER = modal
    input.addEventListener(
        "keydown",
        async e => {  // async para search
            if (e.key !== "Enter")
                return;
            const results =
                await search(input.value);
            if (results[0]) {
                window.location.href =
                    results[0].url;
            }
        }
    );
    // cerrar al click afuera
    document.addEventListener(
        "click",
        e => {
            if (
                !input.parentElement
                .contains(e.target)
            ) {
                const box =
                    input.parentElement
                    .querySelector(
                        ".lz-suggestions"
                    );
                if (box)
                    box.style.display =
                        "none";
            }
        }
    );
    // Mobile button
    const mobileBtn =
        document.getElementById(
            "mobileSearchBtn"
        );
    if (mobileBtn) {
        mobileBtn.onclick = () => {
            input.focus();
        };
    }
    console.log(
        "✅ Search conectado al navbar (con TMDB)"
    );
};

// =============================================
// AUTO INIT
// =============================================
document.addEventListener(
    "DOMContentLoaded",
    loadDatabase
);
