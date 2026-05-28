// =============================================
// HOME.JS - Lógica específica de la página de inicio + Loader
// =============================================

// ================== HELPERS PARA GITHUB ==================
async function getAllMovieIds() {
    try {
        const res = await fetch('https://api.github.com/repos/thexxx880/apple/contents/data%20base/data/movie');
        if (!res.ok) throw new Error('No se pudo obtener la lista de películas');
        
        const items = await res.json();
        // Filtramos solo las carpetas (type === 'dir')
        return items
            .filter(item => item.type === 'dir')
            .map(item => item.name);
    } catch (error) {
        console.error("Error obteniendo lista de películas:", error);
        return [];
    }
}

async function fetchMovieById(id) {
    try {
        const url = `https://raw.githubusercontent.com/thexxx880/apple/main/data%20base/data/movie/${id}/${id}.json`;
        const res = await fetch(url);
        if (!res.ok) return null;

        const data = await res.json();

        // Normalización de campos para compatibilidad con el código existente
        data.id = data.id_tmdb || id;                    // ← ID para los enlaces
        data.anio = data.año || data.anio || "----";     // ← Año (maneja la ñ)
        
        // Usamos puntuacion (7.8) para el rating numérico (mejor que "PG-13")
        // Si quieres mostrar la calificación de edad, cambia esta línea
        data.calificacion = data.puntuacion || data.calificacion || "N/A";

        return data;
    } catch (error) {
        console.error(`Error cargando película ${id}:`, error);
        return null;
    }
}

// ================== FUNCIONES PRINCIPALES ==================
async function loadRandomHero() {
    const heroSection = document.getElementById("hero");
    const heroLogo = document.getElementById("hero-logo");
    const heroDesc = document.getElementById("hero-description");
    const heroRating = document.getElementById("hero-rating");
    const heroYear = document.getElementById("hero-year");
    const heroPlayBtn = document.getElementById("hero-play-btn");

    try {
        const ids = await getAllMovieIds();
        if (ids.length === 0) {
            console.warn("No hay películas disponibles");
            return;
        }

        // Elegir una película aleatoria
        const randomId = ids[Math.floor(Math.random() * ids.length)];
        const data = await fetchMovieById(randomId);
        if (!data) return;

        // Aplicar datos al hero
        if (data.backdrop) {
            heroSection.style.backgroundImage = `url('${data.backdrop}')`;
        }
        if (data.logo && heroLogo) heroLogo.src = data.logo;
        if (heroYear) heroYear.textContent = data.anio;
        if (heroRating) heroRating.innerHTML = `⭐ ${data.calificacion}`;

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
    } catch (error) {
        console.error("Error cargando héroe:", error);
    }
}

async function loadMoviesSection() {
    const container = document.getElementById("movies-grid");
    if (!container) return;

    container.innerHTML = `<p style="color:#888; padding: 40px 20px; font-size: 0.95rem;">Cargando películas...</p>`;

    try {
        const ids = await getAllMovieIds();
        if (ids.length === 0) {
            container.innerHTML = `<p style="color:#ff6b6b; padding: 30px 20px;">No se encontraron películas.</p>`;
            return;
        }

        // Barajamos y tomamos hasta 10
        const shuffled = ids.sort(() => 0.5 - Math.random());
        const selectedIds = shuffled.slice(0, 10);

        const movies = [];
        for (const id of selectedIds) {
            const movie = await fetchMovieById(id);
            if (movie) movies.push(movie);
        }

        if (movies.length === 0) {
            container.innerHTML = `<p style="color:#ff6b6b; padding: 30px 20px;">No se encontraron películas.</p>`;
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
                <img src="${movie.poster || 'assets/posters/placeholder.jpg'}" alt="${movie.titulo}">
                <div class="movie-rating">${ratingHTML}</div>
                <div class="movie-overlay"></div>
            `;

            card.addEventListener("click", () => {
                if (movie.id) {
                    window.location.href = `contenido.html?id=${movie.id}`;
                }
            });

            container.appendChild(card);
        });
    } catch (error) {
        console.error("Error cargando películas:", error);
        container.innerHTML = `<p style="color:#ff6b6b; padding: 30px 20px;">❌ Error al cargar las películas.</p>`;
    }
}

// ================== INICIO + LOADER ==================
document.addEventListener("DOMContentLoaded", async () => {
    // Iniciar loader
    if (typeof initLoader === "function") {
        initLoader();
    }

    // Cargar todo el contenido
    await Promise.all([
        loadRandomHero(),
        loadMoviesSection()
    ]);

    // Ocultar loader
    if (typeof hideLoader === "function") {
        hideLoader();
    } else {
        const loader = document.getElementById('loader');
        if (loader) loader.style.display = 'none';
    }

    console.log("✅ Página de inicio cargada completamente desde GitHub");
});
