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
        // 1. Obtener el JSON desde GitHub
        const jsonUrl = "https://raw.githubusercontent.com/thexxx880/apple/main/data%20base/search/search-serie.json";
        const res = await fetch(jsonUrl);
        
        if (!res.ok) throw new Error("No se pudo cargar el JSON de series");
        const seriesData = await res.json();

        // 2. Tomar EXCLUSIVAMENTE los primeros 10 contenidos (los más recientes)
        const latest10Series = seriesData.slice(0, 10);

        // 3. Extraer la calificación de TMDB
        const TMDB_API_KEY = "38e497c6c1a043d1341416e80915669f";
        
        const seriesWithRatings = await Promise.all(
            latest10Series.map(async (serie) => {
                let rating = "0.0";
                try {
                    const tmdbUrl = `https://api.themoviedb.org/3/tv/${serie.id_tmdb}?api_key=${TMDB_API_KEY}&language=es-MX`;
                    const tmdbRes = await fetch(tmdbUrl);
                    if (tmdbRes.ok) {
                        const tmdbData = await tmdbRes.json();
                        rating = (tmdbData.vote_average || 0).toFixed(1);
                    }
                } catch (err) {
                    console.error(`Error TMDB en ID ${serie.id_tmdb}:`, err);
                }
                return { ...serie, rating };
            })
        );

        // 4. Limpiar contenedor
        container.innerHTML = "";

        // 5. Renderizar cards
        seriesWithRatings.forEach(serie => {
            const card = document.createElement("div");
            card.className = "series-card";

            // Lógica matemática para el SVG
            const radius = 22; // Ajustado para un SVG de 52x52
            const circumference = 2 * Math.PI * radius;
            const percent = (parseFloat(serie.rating) / 10) * 100;
            const offset = circumference - (percent / 100) * circumference;

            // Colores por calificación
            let strokeColor = "#22c55e"; // Verde
            if (parseFloat(serie.rating) < 7.0) strokeColor = "#eab308"; // Amarillo
            if (parseFloat(serie.rating) < 5.0) strokeColor = "#ef4444"; // Rojo
            if (serie.rating === "0.0") strokeColor = "#6b7280"; // Gris

            card.innerHTML = `
                <img src="${serie.poster}" alt="Poster" loading="lazy">
                
                <div class="series-rating">
                    <svg class="rating-circle" viewBox="0 0 52 52">
                        <circle class="bg" cx="26" cy="26" r="${radius}"></circle>
                        <circle class="progress" cx="26" cy="26" r="${radius}" 
                            style="stroke: ${strokeColor}; stroke-dasharray: ${circumference}; stroke-dashoffset: ${offset};">
                        </circle>
                    </svg>
                    <span class="rating-value">${serie.rating}</span>
                </div>
            `;

            // Redirigir al URL original
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

// Ejecutar
document.addEventListener("DOMContentLoaded", loadSeriesSection);
