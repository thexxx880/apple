// =============================================
// HOME.JS - Lógica específica de la página de inicio
// =============================================

async function loadRandomHero() {
    const heroSection = document.getElementById("hero");
    const heroLogo = document.getElementById("hero-logo");
    const heroDesc = document.getElementById("hero-description");
    const heroRating = document.getElementById("hero-rating");
    const heroYear = document.getElementById("hero-year");
    const heroPlayBtn = document.getElementById("hero-play-btn");

    try {
        const data = await fetchRandomHero();
        if (!data) return;

        if (data.backdrop) heroSection.style.backgroundImage = `url('${data.backdrop}')`;
        if (data.logo && heroLogo) heroLogo.src = data.logo;
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
                alert(`Reproduciendo: ${data.titulo || 'Película'} (ID: ${data.id})`);
                // window.location.href = `player.html?id=${data.id}`;
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
        const movies = await fetchMovies(10);
        
        if (movies.length === 0) {
            container.innerHTML = `<p style="color:#ff6b6b; padding: 30px 20px;">No se encontraron películas.</p>`;
            return;
        }

        container.innerHTML = "";

        movies.forEach(movie => {
            const card = document.createElement("div");
            card.className = "movie-card";

            const ratingHTML = window.createRatingCircle ? 
                window.createRatingCircle(movie.calificacion || 0) : 
                `<span>${movie.calificacion || 0}</span>`;

            card.innerHTML = `
                <img src="${movie.poster || 'assets/posters/placeholder.jpg'}" alt="${movie.titulo}">
                <div class="movie-rating">${ratingHTML}</div>
                <div class="movie-overlay"></div>
            `;

            card.addEventListener("click", () => {
                alert(`Abrir película: ${movie.titulo} (ID: ${movie.id})`);
            });

            container.appendChild(card);
        });

    } catch (error) {
        console.error("Error cargando películas:", error);
        container.innerHTML = `<p style="color:#ff6b6b; padding: 30px 20px;">❌ Error al cargar las películas.</p>`;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadRandomHero();
    loadMoviesSection();
});