// =============================================
// TOP 10 NETFLIX STYLE - LZPLAY (v2)
// =============================================
document.addEventListener('DOMContentLoaded', function () {
    const container = document.getElementById('lzplay-top10-netflix');
    if (container) container.style.display = 'block';

    const TMDB_API_KEY = '38e497c6c1a043d1341416e80915669f';
    // Se utiliza el enlace "raw" de GitHub para que devuelva un JSON válido
    const JSON_URL = 'https://raw.githubusercontent.com/thexxx880/apple/main/data%20base/data/base/base.json';
    const listContainer = document.getElementById('lzplay-top10-list');
    const outerContainer = document.querySelector('.lzplay-top10-netflix .outer_container');

    const MEDIA_BREAKPOINT = 768;
    const isMobile = window.innerWidth <= MEDIA_BREAKPOINT;
    let autoRotateEnabled = !isMobile;
    let rotationInterval = null;
    let rotationDelay = 5000;

    function getActiveItem() {
        return document.querySelector('.lzplay-top10-netflix .item_container.expanded');
    }

    function setImageMode(item, mode) {
        const img = item.querySelector('img');
        if (!img) return;
        if (mode === 'backdrop' && img.dataset.backdrop) {
            img.src = img.dataset.backdrop;
        } else if (mode === 'poster' && img.dataset.poster) {
            img.src = img.dataset.poster;
        }
    }

    function centerExpandedItem(item, behavior = 'smooth') {
        if (!outerContainer || !item || window.innerWidth > 768) return;
        const doCenter = () => {
            const outerRect = outerContainer.getBoundingClientRect();
            const itemRect = item.getBoundingClientRect();
            const currentScrollLeft = outerContainer.scrollLeft;
            const delta = (itemRect.left + itemRect.width / 2) - (outerRect.left + outerRect.width / 2);
            const maxScrollLeft = outerContainer.scrollWidth - outerContainer.clientWidth;
            const target = Math.max(0, Math.min(currentScrollLeft + delta, maxScrollLeft));
            outerContainer.scrollTo({ left: target, behavior: behavior });
        };
        requestAnimationFrame(() => requestAnimationFrame(doCenter));
    }

    function expandItem(nextItem) {
        document.querySelectorAll('.lzplay-top10-netflix .item_container').forEach(el => {
            el.classList.remove('expanded');
            setImageMode(el, 'poster');
        });
        nextItem.classList.add('expanded');
        setImageMode(nextItem, 'backdrop');
        centerExpandedItem(nextItem, 'smooth');
    }

    function startRotation() {
        if (!autoRotateEnabled) return;
        if (rotationInterval) clearInterval(rotationInterval);
        rotationInterval = setInterval(() => {
            const items = Array.from(document.querySelectorAll('.lzplay-top10-netflix .item_container'));
            if (!items.length) return;
            const currentIndex = items.findIndex(el => el.classList.contains('expanded'));
            const nextIndex = (currentIndex + 1) % items.length;
            expandItem(items[nextIndex]);
        }, rotationDelay);
    }

    function resetRotationTimer() {
        if (!autoRotateEnabled) return;
        if (rotationInterval) clearInterval(rotationInterval);
        startRotation();
    }

    // ==================== CARGAR DATOS ====================
    Promise.all([
        fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=es-MX&page=1`).then(r => r.json()),
        fetch(JSON_URL).then(r => r.json())
    ])
    .then(([tmdbData, videoData]) => {
        const movies = (tmdbData.results || []).slice(0, 10);

        movies.forEach((movie, index) => {
            const rank = index + 1;
            // Se comprueba si el ID de la película existe en el nuevo JSON
            const targetUrl = videoData[movie.id] || videoData[String(movie.id)];
            const hasVideo = !!targetUrl; // true si existe el ID en tu base.json
            
            const poster = movie.poster_path 
                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
                : 'https://via.placeholder.com/300x450?text=No+Image';
            const backdrop = movie.backdrop_path 
                ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` 
                : poster;

            const item = document.createElement('li');
            item.className = 'item_container';

            // Solo expandir el primero en DESKTOP
            if (rank === 1 && !isMobile) {
                item.classList.add('expanded');
            }

            item.innerHTML = `
                <div class="item_number">${rank}</div>
                <div class="status-dot" style="background-color: ${hasVideo ? '#22c55e' : '#ef4444'}"></div>
                <div class="image">
                    <img src="${(rank === 1 && !isMobile) ? backdrop : poster}" 
                         data-poster="${poster}" 
                         data-backdrop="${backdrop}" 
                         alt="${movie.title}">
                </div>
                <div class="info_container">
                    <div class="info_header">
                        <div class="info_number">
                            <img src="https://assets.codepen.io/1890963/${rank}.png?format=auto" alt="${rank}">
                        </div>
                        <div class="info_title">${movie.title}</div>
                    </div>
                    <div class="info_bottom_text">
                        ${movie.overview ? movie.overview.substring(0, 135) + '...' : 'Sin descripción disponible.'}
                    </div>
                    <div style="margin-top: auto;">
                        ${hasVideo 
                            ? `<a href="#" class="watch-btn">▶ Ver ahora</a>` 
                            : `<span style="color:#ef4444; font-weight:600;">Video próximamente</span>`}
                    </div>
                </div>
            `;

            // Click para expandir
            item.addEventListener('click', (e) => {
                const alreadyExpanded = item.classList.contains('expanded');
                if (alreadyExpanded && hasVideo) {
                    e.preventDefault();
                    openPlayer(movie, videoData);
                    return;
                }

                document.querySelectorAll('.lzplay-top10-netflix .item_container').forEach(el => {
                    el.classList.remove('expanded');
                    setImageMode(el, 'poster');
                });

                item.classList.add('expanded');
                setImageMode(item, 'backdrop');
                centerExpandedItem(item, 'smooth');

                if (autoRotateEnabled) {
                    rotationDelay = 8000;
                    resetRotationTimer();
                }
            });

            // Botón Ver ahora
            const watchBtn = item.querySelector('.watch-btn');
            if (watchBtn) {
                watchBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openPlayer(movie, videoData);
                });
            }

            listContainer.appendChild(item);
        });

        // Centrado inicial en móvil (si hay uno expandido)
        if (isMobile) {
            setTimeout(() => {
                const active = getActiveItem();
                if (active) centerExpandedItem(active, 'auto');
            }, 400);
        }

        if (autoRotateEnabled) startRotation();
    })
    .catch(err => console.error('Error cargando Top 10:', err));

    // Manejar resize
    let resizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const previousMode = autoRotateEnabled;
            autoRotateEnabled = window.innerWidth > MEDIA_BREAKPOINT;

            if (autoRotateEnabled && !previousMode) startRotation();
            if (!autoRotateEnabled && previousMode && rotationInterval) {
                clearInterval(rotationInterval);
                rotationInterval = null;
            }

            const active = getActiveItem();
            if (active) centerExpandedItem(active, 'auto');
        }, 180);
    });

    // ==================== ABRIR PLAYER ====================
    function openPlayer(movie, videoData) {
        // Se extrae directamente la URL desde el JSON utilizando el ID de TMDB
        const targetUrl = videoData[movie.id] || videoData[String(movie.id)];
        
        if (!targetUrl) {
            const modal = document.getElementById('lzplay-modal');
            if (modal) modal.style.display = 'flex';
            return;
        }

        // Se redirige al usuario al enlace guardado en el JSON
        const tryLandscape = () => {
            if (screen.orientation && screen.orientation.lock) {
                document.documentElement.requestFullscreen().then(() => {
                    screen.orientation.lock('landscape').catch(() => {});
                }).finally(() => {
                    window.location.href = targetUrl;
                });
            } else {
                window.location.href = targetUrl;
            }
        };

        tryLandscape();
    }

    window.closeModal = function () {
        const modal = document.getElementById('lzplay-modal');
        if (modal) modal.style.display = 'none';
    };
});
