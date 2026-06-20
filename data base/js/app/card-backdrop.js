// =============================================
// SECCIÓN BACKDROPS - ANIMACIÓN PARA ADULTOS
// =============================================
async function initLZBackdrops() {
    const container = document.getElementById("lz-backdrop-grid");
    if (!container) return;

    container.innerHTML = `
        <p style="color:#888; padding:40px 20px; font-size:.95rem; text-align:center;">
            Cargando contenido...
        </p>
    `;

    const TMDB_API_KEY = "38e497c6c1a043d1341416e80915669f";
    // Tu nuevo enlace a la base de datos (con evasión de caché)
    const jsonUrl = `https://raw.githubusercontent.com/thexxx880/apple/main/data%20base/plataformas/Animations%20Adult.json?v=${new Date().getTime()}`;

    try {
        const res = await fetch(jsonUrl);
        if (!res.ok) throw new Error("Error al conectar con la base de datos.");
        
        const data = await res.json();
        
        // Convertir el objeto {"ID": "URL"} en una lista y tomar los últimos 10 (invertimos el orden)
        const entries = Object.entries(data).reverse().slice(0, 10);

        if (entries.length === 0) {
            container.innerHTML = `<p style="color:#888; padding:30px;">No hay contenido disponible.</p>`;
            return;
        }

        const itemsWithData = await Promise.all(
            entries.map(async ([id, url]) => {
                // Inteligencia para detectar si es SERIE o PELÍCULA
                const isSeries = url.includes("contenido-serie.html");
                const typeTmdb = isSeries ? "tv" : "movie";
                
                let title = "Título Desconocido";
                let year = "";
                let backdrop = "https://via.placeholder.com/780x439?text=Sin+Imagen";

                try {
                    const tmdbUrl = `https://api.themoviedb.org/3/${typeTmdb}/${id}?api_key=${TMDB_API_KEY}&language=es-MX`;
                    const tmdbRes = await fetch(tmdbUrl);
                    
                    if (tmdbRes.ok) {
                        const tmdbData = await tmdbRes.json();
                        // TMDB usa "name" para series y "title" para películas
                        title = isSeries ? tmdbData.name : tmdbData.title;
                        
                        // Extraer solo el año de la fecha
                        const dateStr = isSeries ? tmdbData.first_air_date : tmdbData.release_date;
                        year = dateStr ? dateStr.substring(0, 4) : "N/A";
                        
                        // Si hay backdrop, lo usamos; si no, buscamos el poster; si tampoco, placeholder
                        if (tmdbData.backdrop_path) {
                            backdrop = `https://image.tmdb.org/t/p/w780${tmdbData.backdrop_path}`;
                        } else if (tmdbData.poster_path) {
                            backdrop = `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}`;
                        }
                    }
                } catch (err) {
                    console.warn(`Error obteniendo datos TMDB para el ID: ${id}`);
                }

                return { id, url, isSeries, title, year, backdrop };
            })
        );

        // Limpiar el mensaje de carga
        container.innerHTML = "";

        // Dibujar las tarjetas
        itemsWithData.forEach(item => {
            const card = document.createElement("div");
            card.className = "lz-bd-card";

            const badgeText = item.isSeries ? "Serie" : "Película";
            const badgeClass = item.isSeries ? "serie" : "movie";

            card.innerHTML = `
                <img src="${item.backdrop}" alt="${item.title}" loading="lazy">
                <div class="lz-bd-badge ${badgeClass}">${badgeText}</div>
                <div class="lz-bd-overlay">
                    <div class="lz-bd-title-text">${item.title}</div>
                    <div class="lz-bd-year">${item.year}</div>
                </div>
            `;

            // Clic a la URL correcta
            card.addEventListener("click", () => {
                window.location.href = item.url;
            });

            container.appendChild(card);
        });

    } catch (error) {
        console.error("Error al cargar la sección de Backdrops:", error);
        container.innerHTML = `
            <p style="color:#ef4444; padding:30px 20px; text-align:center;">
                ❌ Error al cargar esta categoría.
            </p>
        `;
    }
}

// Ejecutar
document.addEventListener("DOMContentLoaded", initLZBackdrops);
