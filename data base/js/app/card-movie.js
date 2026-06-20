// =============================================
// ÚLTIMAS PELÍCULAS PUBLICADAS (Aislado)
// =============================================
async function initLZRecentMovies() {
    const container = document.getElementById("lz-recent-movies-grid");
    if (!container) return;

    container.innerHTML = `
        <p style="color:#888; padding:40px 20px; font-size:.95rem; text-align:center;">
            Cargando últimos estrenos...
        </p>
    `;

    const TMDB_API_KEY = "38e497c6c1a043d1341416e80915669f";
    // Evitamos caché añadiendo getTime()
    const jsonUrl = `https://raw.githubusercontent.com/thexxx880/apple/main/data%20base/search/search.json?v=${new Date().getTime()}`;

    try {
        const res = await fetch(jsonUrl);
        if (!res.ok) throw new Error("Error de conexión");
        
        const allMovies = await res.json();
        const latest10Movies = allMovies.slice(0, 10);

        const moviesWithRatings = await Promise.all(
            latest10Movies.map(async (pelicula) => {
                let rating = "0.0";
                if (pelicula.id_tmdb) {
                    try {
                        const tmdbUrl = `https://api.themoviedb.org/3/movie/${pelicula.id_tmdb}?api_key=${TMDB_API_KEY}&language=es-MX`;
                        const tmdbRes = await fetch(tmdbUrl);
                        if (tmdbRes.ok) {
                            const tmdbData = await tmdbRes.json();
                            rating = (tmdbData.vote_average || 0).toFixed(1);
                        }
                    } catch (err) {
                        console.warn(`Error TMDB ID: ${pelicula.id_tmdb}`);
                    }
                }
                return { ...pelicula, rating };
            })
        );

        container.innerHTML = "";

        moviesWithRatings.forEach(pelicula => {
            const card = document.createElement("div");
            card.className = "lz-rm-card";

            const radius = 22; 
            const circumference = 2 * Math.PI * radius;
            const percent = (parseFloat(pelicula.rating) / 10) * 100;
            const offset = circumference - (percent / 100) * circumference;

            let strokeColor = "#22c55e"; 
            if (parseFloat(pelicula.rating) < 7.0) strokeColor = "#eab308"; 
            if (parseFloat(pelicula.rating) < 5.0) strokeColor = "#ef4444"; 
            if (pelicula.rating === "0.0") strokeColor = "#6b7280"; 

            card.innerHTML = `
                <img src="${pelicula.poster}" alt="${pelicula.titulo}" loading="lazy">
                
                <div class="lz-rm-rating">
                    <svg class="lz-rm-circle" viewBox="0 0 52 52">
                        <circle class="lz-rm-bg" cx="26" cy="26" r="${radius}"></circle>
                        <circle class="lz-rm-progress" cx="26" cy="26" r="${radius}" 
                            style="stroke: ${strokeColor}; stroke-dasharray: ${circumference}; stroke-dashoffset: ${offset};">
                        </circle>
                    </svg>
                    <span class="lz-rm-value">${pelicula.rating}</span>
                </div>
            `;

            card.addEventListener("click", () => {
                if (pelicula.url) {
                    window.location.href = pelicula.url;
                }
            });

            container.appendChild(card);
        });

    } catch (error) {
        console.error("Error al cargar la sección:", error);
        container.innerHTML = `
            <p style="color:#ef4444; padding:30px 20px; text-align:center;">
                ❌ No se pudieron cargar las películas.
            </p>
        `;
    }
}

// Ejecutar
document.addEventListener("DOMContentLoaded", initLZRecentMovies);
