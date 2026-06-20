// =============================================
// ÚLTIMAS PELÍCULAS PUBLICADAS
// =============================================
async function loadMoviesSection() {
    // Asegúrate de cambiar el ID en tu HTML a id="movies-grid"
    const container = document.getElementById("movies-grid");
    if (!container) return;

    container.innerHTML = `
        <p style="color:#888; padding:40px 20px; font-size:.95rem;">
            Cargando películas...
        </p>
    `;

    try {
        // 1. Obtener el JSON desde GitHub
        const jsonUrl = "https://raw.githubusercontent.com/thexxx880/apple/main/data%20base/search/search.json";
        const res = await fetch(jsonUrl);
        
        if (!res.ok) throw new Error("No se pudo cargar el JSON de películas");
        const moviesData = await res.json();

        // 2. Tomar EXCLUSIVAMENTE los primeros 10 contenidos (los más recientes)
        const latest10Movies = moviesData.slice(0, 10);

        // 3. Extraer la calificación de TMDB
        const TMDB_API_KEY = "38e497c6c1a043d1341416e80915669f";
        
        const moviesWithRatings = await Promise.all(
            latest10Movies.map(async (pelicula) => {
                let rating = "0.0";
                try {
                    const tmdbUrl = `https://api.themoviedb.org/3/movie/${pelicula.id_tmdb}?api_key=${TMDB_API_KEY}&language=es-MX`;
                    const tmdbRes = await fetch(tmdbUrl);
                    if (tmdbRes.ok) {
                        const tmdbData = await tmdbRes.json();
                        rating = (tmdbData.vote_average || 0).toFixed(1);
                    }
                } catch (err) {
                    console.error(`Error TMDB en ID ${pelicula.id_tmdb}:`, err);
                }
                return { ...pelicula, rating };
            })
        );

        // 4. Limpiar contenedor
        container.innerHTML = "";

        // 5. Renderizar cards
        moviesWithRatings.forEach(pelicula => {
            const card = document.createElement("div");
            // Actualiza tu CSS para usar .movies-card en lugar de .series-card
            card.className = "movies-card";

            // Lógica matemática para el SVG
            const radius = 22; // Ajustado para un SVG de 52x52
            const circumference = 2 * Math.PI * radius;
            const percent = (parseFloat(pelicula.rating) / 10) * 100;
            const offset = circumference - (percent / 100) * circumference;

            // Colores por calificación
            let strokeColor = "#22c55e"; // Verde
            if (parseFloat(pelicula.rating) < 7.0) strokeColor = "#eab308"; // Amarillo
            if (parseFloat(pelicula.rating) < 5.0) strokeColor = "#ef4444"; // Rojo
            if (pelicula.rating === "0.0") strokeColor = "#6b7280"; // Gris

            card.innerHTML = `
                <img src="${pelicula.poster}" alt="Poster" loading="lazy">
                
                <div class="movies-rating">
                    <svg class="rating-circle" viewBox="0 0 52 52">
                        <circle class="bg" cx="26" cy="26" r="${radius}"></circle>
                        <circle class="progress" cx="26" cy="26" r="${radius}" 
                            style="stroke: ${strokeColor}; stroke-dasharray: ${circumference}; stroke-dashoffset: ${offset};">
                        </circle>
                    </svg>
                    <span class="rating-value">${pelicula.rating}</span>
                </div>
            `;

            // Redirigir al URL original
            card.addEventListener("click", () => {
                window.location.href = pelicula.url;
            });

            container.appendChild(card);
        });

    } catch (error) {
        console.error("Error cargando películas:", error);
        container.innerHTML = `
            <p style="color:#ff6b6b; padding:30px 20px;">
                ❌ Error al cargar las últimas películas
            </p>
        `;
    }
}

// Ejecutar
document.addEventListener("DOMContentLoaded", loadMoviesSection);
