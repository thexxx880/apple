// =============================================
// ÚLTIMAS SERIES PUBLICADAS
// =============================================
async function loadSeriesSection() {
    const container = document.getElementById("series-grid");
    if (!container) return;

    container.innerHTML = `
        <p style="color:#888; padding:40px 20px; font-size:.95rem;">
            Cargando series...
        </p>
    `;

    try {
        // 1. Obtener el JSON desde GitHub (usando raw.githubusercontent)
        const jsonUrl = "https://raw.githubusercontent.com/thexxx880/apple/main/data%20base/search/search-serie.json";
        const res = await fetch(jsonUrl);
        
        if (!res.ok) throw new Error("No se pudo cargar el JSON de series");
        const seriesData = await res.json();

        // 2. Tomar las últimas series agregadas (invertimos el array y tomamos 15)
        const latestSeries = seriesData.reverse().slice(0, 15);

        // 3. Extraer la calificación real de TMDB
        const TMDB_API_KEY = "38e497c6c1a043d1341416e80915669f";
        
        const seriesWithRatings = await Promise.all(
            latestSeries.map(async (serie) => {
                let rating = 0;
                try {
                    const tmdbUrl = `https://api.themoviedb.org/3/tv/${serie.id_tmdb}?api_key=${TMDB_API_KEY}&language=es-MX`;
                    const tmdbRes = await fetch(tmdbUrl);
                    if (tmdbRes.ok) {
                        const tmdbData = await tmdbRes.json();
                        rating = tmdbData.vote_average || 0;
                    }
                } catch (err) {
                    console.error(`Error TMDB en ${serie.titulo}:`, err);
                }
                return { ...serie, rating: rating.toFixed(1) };
            })
        );

        // 4. Limpiar contenedor
        container.innerHTML = "";

        // 5. Renderizar cards
        seriesWithRatings.forEach(serie => {
            const card = document.createElement("div");
            card.className = "series-card";

            // Lógica matemática para el anillo SVG integrado
            const radius = 18; // Radio del círculo interior
            const circumference = 2 * Math.PI * radius;
            const percent = (serie.rating / 10) * 100;
            const offset = circumference - (percent / 100) * circumference;

            // Colores dinámicos por calificación
            let strokeColor = "#22c55e"; // Verde
            if (serie.rating < 7.0) strokeColor = "#eab308"; // Amarillo
            if (serie.rating < 5.0) strokeColor = "#ef4444"; // Rojo
            if (serie.rating === "0.0") strokeColor = "#6b7280"; // Gris si no hay nota

            card.innerHTML = `
                <img src="${serie.poster}" alt="${serie.titulo}" loading="lazy">
                
                <div class="series-rating">
                    <svg class="rating-circle" viewBox="0 0 40 40">
                        <circle class="bg" cx="20" cy="20" r="${radius}"></circle>
                        <circle class="progress" cx="20" cy="20" r="${radius}" 
                            style="stroke: ${strokeColor}; stroke-dasharray: ${circumference}; stroke-dashoffset: ${offset};">
                        </circle>
                    </svg>
                    <span class="rating-value">${serie.rating}</span>
                </div>

                <div class="series-overlay">
                    <h3 class="series-title">${serie.titulo}</h3>
                </div>
            `;

            // El click redirige a la URL nativa que tienes en tu JSON
            card.addEventListener("click", () => {
                window.location.href = serie.url;
            });

            container.appendChild(card);
        });

    } catch (error) {
        console.error("Error cargando series:", error);
        container.innerHTML = `
            <p style="color:#ff6b6b; padding:30px 20px;">
                ❌ Error al cargar las últimas series
            </p>
        `;
    }
}

// Ejecutar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", loadSeriesSection);
