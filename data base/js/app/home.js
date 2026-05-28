// =============================================
// HOME.JS - Nueva versión: Últimos 10 de base.json + TMDB Dinámico
// =============================================

const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/thexxx880/apple/main/data%20base/";
const BASE_REGISTRY_URL = `${GITHUB_RAW_BASE}data/base/base.json`;
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/";

// ================== OBTENER ÚLTIMOS 10 CONTENIDOS ==================
async function getLast10Contents() {
    try {
        const res = await fetch(BASE_REGISTRY_URL);
        if (!res.ok) throw new Error("No se pudo cargar base.json");
        const baseData = await res.json();

        // Tomamos las últimas 10 claves (las más recientes agregadas)
        const keys = Object.keys(baseData).slice(-10).reverse(); // newest first

        const promises = keys.map(async (id) => {
            try {
                // Llamada a TMDB usando el ID (clave del JSON)
                const tmdbData = await fetchTMDB(`movie/${id}`);

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
                    sinopsis: tmdbData.overview || "Sin sinopsis disponible.",
                    // El enlace del video se guarda pero no se usa aquí
                    enlace_video: baseData[id]
                };
            } catch (e) {
                console.warn(`Error cargando TMDB ID ${id}:`, e);
                return null;
            }
        });

        const results = await Promise.all(promises);
        return results.filter(item => item !== null); // quitar los que fallaron
    } catch (error) {
        console.error("Error al cargar últimos 10 contenidos:", error);
        return [];
    }
}

// ================== HERO RANDOM (de los últimos 10) ==================
async function loadRandomHero() {
    const heroSection = document.getElementById("hero");
    const heroLogo = document.getElementById("hero-logo");
    const heroDesc = document.getElementById("hero-description");
    const heroRating = document.getElementById("hero-rating");
    const heroYear = document.getElementById("hero-year");
    const heroPlayBtn = document.getElementById("hero-play-btn");

    const contents = await getLast10Contents();
    if (contents.length === 0) return;

    // Elegir uno al azar
    const data = contents[Math.floor(Math.random() * contents.length)];

    if (data.backdrop) heroSection.style.backgroundImage = `url('${data.backdrop}')`;
    if (data.logo && heroLogo) heroLogo.src = data.logo; // si algún día agregas logo en base.json
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

// ================== SECCIÓN DE PELÍCULAS (últimos 10) ==================
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

// ================== INICIO + LOADER ==================
document.addEventListener("DOMContentLoaded", async () => {
    // Iniciar loader
    if (typeof initLoader === "function") {
        initLoader();
    }

    // Cargar hero y películas en paralelo
    await Promise.all([
        loadRandomHero(),
        loadMoviesSection()
    ]);

    // Ocultar loader (respeta los 2 segundos gracias a loader.js)
    if (typeof hideLoader === "function") {
        hideLoader();
    } else {
        const loader = document.getElementById('loader');
        if (loader) loader.style.display = 'none';
    }

    console.log("✅ Página de inicio cargada con los últimos 10 contenidos + TMDB");
});
