// =============================================
// CARGADOR GLOBAL DE CATÁLOGOS (Doramas, Series, etc.)
// =============================================

async function loadDynamicCatalog(jsonUrl, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <p style="color:#888; padding:40px 20px; font-size:.95rem;">
            Cargando contenido...
        </p>
    `;

    try {
        const res = await fetch(jsonUrl);
        if (!res.ok) throw new Error("No se pudo cargar el archivo de datos");
        const textData = await res.text();
        const items = [];
        const regex = /"(\d+)"\s*:\s*"([^"]+)"/g;
        let match;
        while ((match = regex.exec(textData)) !== null) {
            items.push({ id: match[1], url: match[2] });
        }

        // 3. Tomar solo los primeros 10
        const latest10Items = items.slice(0, 10);
        const TMDB_API_KEY = "38e497c6c1a043d1341416e80915669f";
        const catalogWithDetails = await Promise.all(
            latest10Items.map(async (item) => {
              const isSerie = item.url.includes("contenido-serie.html");
                const tmdbType = isSerie ? "tv" : "movie";
                
                let rating = "0.0";
                let poster = ""; 

                try {
                    const tmdbUrl = `https://api.themoviedb.org/3/${tmdbType}/${item.id}?api_key=${TMDB_API_KEY}&language=es-MX`;
                    const tmdbRes = await fetch(tmdbUrl);
                    
                    if (tmdbRes.ok) {
                        const tmdbData = await tmdbRes.json();
                        rating = (tmdbData.vote_average || 0).toFixed(1);
                        // Construir la URL de la imagen de TMDB
                        if (tmdbData.poster_path) {
                            poster = `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}`;
                        }
                    }
                } catch (err) {
                    console.error(`Error TMDB en ID ${item.id}:`, err);
                }

                return { ...item, rating, poster };
            })
        );

        container.innerHTML = "";

        catalogWithDetails.forEach(item => {
            const card = document.createElement("div");
            card.className = "catalog-card"; 

            const radius = 22;
            const circumference = 2 * Math.PI * radius;
            const percent = (parseFloat(item.rating) / 10) * 100;
            const offset = circumference - (percent / 100) * circumference;

            let strokeColor = "#22c55e"; // Verde
            if (parseFloat(item.rating) < 7.0) strokeColor = "#eab308"; // Amarillo
            if (parseFloat(item.rating) < 5.0) strokeColor = "#ef4444"; // Rojo
            if (item.rating === "0.0") strokeColor = "#6b7280"; // Gris

            // Si por algún motivo no hay póster, ponemos un fondo oscuro genérico
            const posterImg = item.poster 
                ? `<img src="${item.poster}" alt="Poster" loading="lazy">`
                : `<div style="width:100%; height:100%; background:#1f2937; display:flex; align-items:center; justify-content:center; color:#4b5563; font-size:0.8rem; text-align:center; padding:10px;">Imagen no disponible</div>`;

            card.innerHTML = `
                ${posterImg}
                
                <div class="catalog-rating">
                    <svg class="rating-circle" viewBox="0 0 52 52">
                        <circle class="bg" cx="26" cy="26" r="${radius}"></circle>
                        <circle class="progress" cx="26" cy="26" r="${radius}" 
                            style="stroke: ${strokeColor}; stroke-dasharray: ${circumference}; stroke-dashoffset: ${offset};">
                        </circle>
                    </svg>
                    <span class="rating-value">${item.rating}</span>
                </div>
            `;

            // Clic para redirigir
            card.addEventListener("click", () => {
                window.location.href = item.url;
            });

            container.appendChild(card);
        });

    } catch (error) {
        console.error("Error cargando el catálogo:", error);
        container.innerHTML = `
            <p style="color:#ff6b6b; padding:30px 20px;">
                ❌ Error al cargar esta sección
            </p>
        `;
    }
}

// =============================================
// INICIALIZAR TODAS LAS SECCIONES
// =============================================
document.addEventListener("DOMContentLoaded", () => {
    
    // Cargar Doramas (Asegúrate de usar raw.githubusercontent.com)
    loadDynamicCatalog(
        "https://raw.githubusercontent.com/thexxx880/apple/main/data%20base/plataformas/Doramas.json",
        "doramas-grid"
    );

   loadDynamicCatalog(
       "https://raw.githubusercontent.com/thexxx880/apple/main/data%20base/plataformas/Anime.json",
       "animes-grid"
   );

    // loadDynamicCatalog("https://raw.githubusercontent.com/thexxx880/apple/main/data%20base/plataformas/__AQUI_DIRECCION__.json", "animes-grid");
    
});
