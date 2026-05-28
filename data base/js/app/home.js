// =============================================
// HOME.JS - Versión con depuración (debug) + Últimos 10
// =============================================

const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/thexxx880/apple/main/data%20base/";
const BASE_REGISTRY_URL = `${GITHUB_RAW_BASE}data/base/base.json`;
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/";

console.log("🔍 HOME.JS cargado - URL de base.json:", BASE_REGISTRY_URL);

// ================== OBTENER ÚLTIMOS 10 ==================
async function getLast10Contents() {
    console.log("📡 Intentando cargar base.json...");
    try {
        const res = await fetch(BASE_REGISTRY_URL);
        console.log("📡 Estado de base.json:", res.status, res.statusText);
        
        if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);
        
        const baseData = await res.json();
        console.log("✅ base.json cargado correctamente. IDs encontrados:", Object.keys(baseData));

        const keys = Object.keys(baseData).slice(-10).reverse(); // últimos 10

        const promises = keys.map(async (id) => {
            try {
                console.log(`📡 Consultando TMDB para ID: ${id}`);
                const tmdbData = await fetchTMDB(`movie/${id}`);

                if (!tmdbData) throw new Error("TMDB devolvió null");

                return {
                    id: id,
                    titulo: tmdbData.title || "Sin título",
                    poster: tmdbData.poster_path 
                        ? `${TMDB_IMAGE_BASE}w500${tmdbData.poster_path}` 
                        : "assets/posters/placeholder.jpg",
                    backdrop: tmdbData.backdrop_path 
                        ? `${TMDB_IMAGE_BASE}original${tmdbData.backdrop_path}` 
                        : "",
                    calificacion: tmdbData.vote_average 
                        ? parseFloat(tmdbData.vote_average.toFixed(1)) 
                        : 7.5,
                    anio: (tmdbData.release_date || "").substring(0, 4) || "----",
                    sinopsis: tmdbData.overview || "",
                    enlace_video: baseData[id]
                };
            } catch (e) {
                console.warn(`⚠️ Error con ID ${id}:`, e.message);
                return null;
            }
        });

        const results = await Promise.all(promises);
        return results.filter(item => item !== null);
    } catch (error) {
        console.error("❌ Error grave al cargar últimos 10:", error);
        return [];
    }
}

// ================== HERO RANDOM ==================
async function loadRandomHero() {
    // ... (mismo código que te di antes, sin cambios)
    const heroSection = document.getElementById("hero");
    const heroLogo = document.getElementById("hero-logo");
    const heroDesc = document.getElementById("hero-description");
    const heroRating = document.getElementById("hero-rating");
    const heroYear = document.getElementById("hero-year");
    const heroPlayBtn = document.getElementById("hero-play-btn");

    const contents = await getLast10Contents();
    if (contents.length === 0) return;

    const data = contents[Math.floor(Math.random() * contents.length)];

    if (data.backdrop) heroSection.style.backgroundImage = `url('${data.backdrop}')`;
    if (heroYear) heroYear.textContent = data.anio || "----";
    if (heroRating) heroRating.innerHTML = `⭐ ${data.calificacion || "N/A"}`;

    if (heroDesc) {
        let sinopsis = data.sinopsis || "";
        if (sinopsis.length > 220) sinopsis = sinopsis.substring(0, 220) + "...";
        heroDesc.textContent = sinopsis;
    }

    if (heroPlayBtn && data.id) {
        heroPlayBtn.onclick = (e) => {
            e.preventDefault();
            window.location.href = `contenido.html?id=${data.id}`;
        };
    }
}

// ================== SECCIÓN PELÍCULAS ==================
async function loadMoviesSection() {
    const container = document.getElementById("movies-grid");
    if (!container) return;

    container.innerHTML = `<p style="color:#888; padding: 40px 20px; font-size: 0.95rem;">Cargando últimas películas...</p>`;

    const movies = await getLast10Contents();

    if (movies.length === 0) {
        container.innerHTML = `<p style="color:#ff6b6b; padding: 30px 20px;">No se encontraron películas recientes.</p>`;
        return;
    }

    container.innerHTML = "";

    movies.forEach(movie => {
        const card = document.createElement("div");
        card.className = "movie-card";

        const ratingHTML = window.createRatingCircle 
            ? window.createRatingCircle(movie.calificacion || 0) 
            : `<span>${movie.calificacion || 0}</span>`;

        card.innerHTML = `
            <img src="${movie.poster}" alt="${movie.titulo}" loading="lazy">
            <div class="movie-rating">${ratingHTML}</div>
            <div class="movie-overlay"></div>
            <div class="movie-title">${movie.titulo}</div>
        `;

        card.addEventListener("click", () => {
            window.location.href = `contenido.html?id=${movie.id}`;
        });

        container.appendChild(card);
    });
}

// ================== INICIO ==================
document.addEventListener("DOMContentLoaded", async () => {
    if (typeof initLoader === "function") initLoader();

    await Promise.all([
        loadRandomHero(),
        loadMoviesSection()
    ]);

    if (typeof hideLoader === "function") {
        hideLoader();
    } else {
        const loader = document.getElementById('loader');
        if (loader) loader.style.display = 'none';
    }

    console.log("✅ HOME.JS finalizado correctamente");
});
