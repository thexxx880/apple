// =============================================
// ÚLTIMAS PELÍCULAS PUBLICADAS (Versión Limpia)
// =============================================
async function loadMoviesSection() {
    const container = document.getElementById("movies-grid");
    if (!container) return;

    // Mensaje de carga inicial
    container.innerHTML = `
        <p style="color:#888; padding:40px 20px; font-size:.95rem; text-align:center;">
            Cargando últimos estrenos...
        </p>
    `;

    const TMDB_API_KEY = "38e497c6c1a043d1341416e80915669f";
    
    // NOTA: Se usa el enlace "raw" de GitHub y se le agrega un timestamp para que NUNCA lea datos viejos (caché)
    const jsonUrl = `https://raw.githubusercontent.com/thexxx880/apple/main/data%20base/search/search.json?v=${new Date().getTime()}`;

    try {
        // 1. Obtener los datos directamente de tu JSON en GitHub
        const res = await fetch(jsonUrl);
        if (!res.ok) throw new Error("Error de red al conectar con GitHub.");
        
        const allMovies = await res.json();

        // 2. Tomar EXCLUSIVAMENTE los primeros 10 contenidos (los recién agregados)
        const latest10Movies = allMovies.slice(0, 10);

        // 3. Consultar la API de TMDB solo para obtener la calificación
        const moviesWithRatings = await Promise.all(
            latest10Movies.map(async (pelicula) => {
                let rating = "0.0";
                
                if (pelicula.id_tmdb) {
                    try {
                        const tmdbUrl = `https://api.themoviedb.org/3/movie/${pelicula.id_tmdb}?api_key=${TMDB_API_KEY}&language=es-MX`;
                        const tmdbRes = await fetch(tmdbUrl);
                        if (tmdbRes.ok) {
                            const tmdbData = await tmdbRes.json();
                            // Extraer y formatear la calificación a 1 decimal
                            rating = (tmdbData.vote_average || 0).toFixed(1);
                        }
                    } catch (err) {
                        console.warn(`No se pudo cargar la calificación TMDB para el ID: ${pelicula.id_tmdb}`);
                    }
                }
                
                // Retorna la información de tu JSON combinada con la calificación real
                return { ...pelicula, rating };
            })
        );

        // 4. Limpiar el contenedor
        container.innerHTML = "";

        // 5. Renderizar cada tarjeta
        moviesWithRatings.forEach(pelicula => {
            const card = document.createElement("div");
            card.className = "movies-card";

            // Lógica matemática para el anillo de progreso (SVG)
            const radius = 22; 
            const circumference = 2 * Math.PI * radius;
            const percent = (parseFloat(pelicula.rating) / 10) * 100;
            const offset = circumference - (percent / 100) * circumference;

            // Determinar color de la calificación
            let strokeColor = "#22c55e"; // Verde (Buena)
            if (parseFloat(pelicula.rating) < 7.0) strokeColor = "#eab308"; // Amarillo (Regular)
            if (parseFloat(pelicula.rating) < 5.0) strokeColor = "#ef4444"; // Rojo (Mala)
            if (pelicula.rating === "0.0") strokeColor = "#6b7280"; // Gris (Sin calificación)

            // Construcción del HTML interno de la tarjeta
            card.innerHTML = `
                <img src="${pelicula.poster}" alt="${pelicula.titulo}" loading="lazy">
                
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

            // Al hacer clic, redirigir al enlace guardado en tu JSON
            card.addEventListener("click", () => {
                if (pelicula.url) {
                    window.location.href = pelicula.url;
                }
            });

            container.appendChild(card);
        });

    } catch (error) {
        console.error("Error al cargar la sección de películas:", error);
        container.innerHTML = `
            <p style="color:#ef4444; padding:30px 20px; text-align:center;">
                ❌ No se pudieron cargar las películas.
            </p>
        `;
    }
}

// Ejecutar el script una vez que la página web esté completamente lista
document.addEventListener("DOMContentLoaded", loadMoviesSection);
