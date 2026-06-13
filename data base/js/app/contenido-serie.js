// =============================================
// CONTENIDO-SERIE.JS 
// =============================================

const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/thexxx880/apple/main/data%20base/data/serie/";

let currentSeriesId = null;
let currentSeriesData = null;
let currentSeason = 1;
let currentEpisodeData = null;

// ================== OBTENER ID ==================
function getContentId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id") || params.get("tmdb_id");
}

// ================== DETECTAR TEMPORADAS AUTOMÁTICAMENTE ==================
async function detectarTemporadas(id) {
    let count = 0;
    let s = 1;
    let keepChecking = true;
    
    while (keepChecking) {
        const url = `${GITHUB_RAW_BASE}${id}/t${s}/${id}.json`;
        try {
            const response = await fetch(url, { method: 'HEAD' }); 
            if (response.ok) {
                count++;
                s++;
            } else {
                keepChecking = false;
            }
        } catch (error) {
            keepChecking = false;
        }
    }
    return count === 0 ? 1 : count; 
}

// ================== CARGAR SERIE PRINCIPAL ==================
async function loadSeries() {
    const id = getContentId();
    if (!id) {
        showError("❌ Falta el parámetro <b>id</b>");
        return;
    }
    currentSeriesId = id;

    const url = `${GITHUB_RAW_BASE}${id}/${id}.json`;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Serie no encontrada");

        const data = await res.json();
        currentSeriesData = data;

        const totalSeasons = await detectarTemporadas(id);
        data.number_of_seasons = totalSeasons;

        const lastWatched = getLastWatchedEpisode();
        const startSeason = lastWatched ? lastWatched.season : 1;

        renderSeriesPage(data);
        renderSeasonsTabs(data, startSeason);

        setTimeout(() => loadSeasonEpisodes(id, startSeason), 350);
        setTimeout(incrementarVistas, 900);

    } catch (err) {
        console.error(err);
        showError(`No se encontró la serie<br><small>ID: ${id}</small>`);
    }
}

// ================== RENDERIZAR PÁGINA DE SERIE ==================
function renderSeriesPage(data) {
    document.getElementById('pageTitle').textContent = `${data.titulo} • LzPlay`;

    const heroBg = document.getElementById('heroBg');
    heroBg.style.backgroundImage = `url('${data.backdrop || data.poster}')`;
    setTimeout(() => heroBg.classList.add('loaded'), 120);

    const heroLogo = document.getElementById('heroLogo');
    heroLogo.innerHTML = data.logo 
        ? `<img src="${data.logo}" alt="${data.titulo}">`
        : `<h1 style="font-size:3.8rem;line-height:1;color:white;font-family:'Bebas Neue',sans-serif;">${data.titulo}</h1>`;

    const temporadas = data.number_of_seasons || 1;
    const episodiosTotales = data.number_of_episodes || 0;

    document.getElementById('heroMeta').innerHTML = `
        <span class="match-score"><i class="fa-solid fa-thumbs-up"></i> ${Math.round((data.puntuacion || 0) * 10)}% para ti</span>
        <div class="meta-dot"></div>
        <span class="meta-text">${data.año || '2025'}</span>
        <div class="meta-dot"></div>
        <span class="meta-text">${temporadas} Temp.</span>
        <div class="meta-dot"></div>
        <span class="meta-badge">${data.calificacion || 'TV-14'}</span>
    `;

    document.getElementById('sinopsis').textContent = data.sinopsis || "Sin sinopsis disponible.";

    const generosContainer = document.getElementById('generos');
    generosContainer.innerHTML = (data.generos || []).map(g => 
        `<span class="genre-chip">${g}</span>`
    ).join('');

    document.getElementById('statsRow').innerHTML = `
        <div class="stat-card">
            <i class="fa-solid fa-calendar-days stat-icon"></i>
            <div class="stat-value">${data.año || '—'}</div>
            <div class="stat-label">Estreno</div>
        </div>
        <div class="stat-card">
            <i class="fa-solid fa-tv stat-icon"></i>
            <div class="stat-value">${temporadas}</div>
            <div class="stat-label">Temporadas</div>
        </div>
        <div class="stat-card">
            <i class="fa-solid fa-list-ol stat-icon"></i>
            <div class="stat-value">${episodiosTotales > 0 ? episodiosTotales : '—'}</div>
            <div class="stat-label">Episodios</div>
        </div>
        <div class="stat-card">
            <i class="fa-solid fa-star stat-icon" style="color:var(--gold)"></i>
            <div class="stat-value" style="color:var(--gold)">${data.puntuacion || '—'}</div>
            <div class="stat-label">Puntuación</div>
        </div>
    `;

    const castContainer = document.getElementById('castScroll');
    castContainer.innerHTML = (data.reparto || []).map(actor => `
        <div class="cast-card" onclick="alert('Filmografía próximamente')">
            <div class="cast-img-wrap"><img src="${actor.foto || 'https://i.pravatar.cc/150?img=12'}" alt="${actor.nombre}"></div>
            <div class="cast-name">${actor.nombre}</div>
            <div class="cast-role">${actor.personaje}</div>
        </div>
    `).join('');

    const crewContainer = document.getElementById('crewGrid');
    const allCrew = [...(data.equipo_creativo || []), ...(data.crew || [])];
    crewContainer.innerHTML = allCrew.map(person => `
        <div class="crew-card">
            <div class="crew-icon" style="font-size:24px; color:var(--text-dim)"><i class="fa-solid fa-user-tie"></i></div>
            <div>
                <div class="crew-name" style="font-weight:600">${person.nombre}</div>
                <div class="crew-role" style="font-size:12px; color:var(--text-muted)">${person.rol}</div>
            </div>
        </div>
    `).join('');

    // --- CONFIGURAR BOTÓN REPRODUCIR DINÁMICO ---
    const lastWatched = getLastWatchedEpisode();
    const playText = document.getElementById('playText');
    if (lastWatched && playText) {
        playText.textContent = `Continuar T${lastWatched.season} E${lastWatched.episode}`;
    }

    const playBtn = document.getElementById('playBtn');
    if (playBtn) {
        playBtn.onclick = () => {
            const startSeason = lastWatched ? lastWatched.season : 1;
            
            document.querySelectorAll('.season-tab').forEach(t => t.classList.remove('active'));
            const tabs = document.querySelectorAll('.season-tab');
            if (tabs[startSeason - 1]) tabs[startSeason - 1].classList.add('active');

            loadSeasonEpisodes(currentSeriesId, startSeason).then(() => {
                setTimeout(() => {
                    const activeBtn = document.querySelector('.active-episode .episode-play-btn') || document.querySelector('.episode-play-btn');
                    if (activeBtn) activeBtn.click();
                }, 650);
            });
        };
    }

    // --- CONFIGURAR BOTÓN DE TRAILER ---
    const trailerBtn = document.getElementById('trailerBtn');
    if (trailerBtn) {
        trailerBtn.onclick = () => {
            const url = data.trailer || data.youtube;
            if (!url) {
                alert("No hay trailer disponible para esta serie.");
                return;
            }
            abrirTrailerModal(url);
        };
    }

    // --- CONFIGURAR BOTÓN MI LISTA ---
    const listBtn = document.getElementById('listBtn');
    if (listBtn) {
        listBtn.onclick = () => toggleList(listBtn);
    }

    loadFavoriteState(currentSeriesId);

    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'none';
}

// ================== TEMPORADAS ==================
function renderSeasonsTabs(data, activeSeason = 1) {
    const container = document.getElementById('seasonsTabs');
    container.innerHTML = '';
    const total = data.number_of_seasons || 1;

    for (let i = 1; i <= total; i++) {
        const tab = document.createElement('div');
        tab.className = `season-tab ${i === activeSeason ? 'active' : ''}`;
        tab.textContent = `Temporada ${i}`;
        tab.onclick = () => {
            document.querySelectorAll('.season-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            loadSeasonEpisodes(currentSeriesId, i);
        };
        container.appendChild(tab);
    }
}

// ================== CARGAR EPISODIOS ==================
async function loadSeasonEpisodes(seriesId, seasonNumber) {
    currentSeason = seasonNumber;
    const url = `${GITHUB_RAW_BASE}${seriesId}/t${seasonNumber}/${seriesId}.json`;
    
    document.getElementById('currentSeasonTitle').textContent = `Temporada ${seasonNumber}`;
    const container = document.getElementById('episodesList');
    container.innerHTML = `<div style="padding:30px; text-align:center; color:#666; width:100%;">Cargando episodios...</div>`;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Sin episodios");
        
        const seasonData = await res.json();
        
        // NUEVO: Soportar la nueva estructura con Backdrop y la vieja estructura normal
        const hasNewStructure = seasonData.capitulos !== undefined;
        const episodesData = hasNewStructure ? seasonData.capitulos : seasonData;
        
        // Obtener el backdrop de la temporada (o usar el de la serie por defecto)
        const seasonBackdrop = (hasNewStructure && seasonData.backdrop) 
            ? seasonData.backdrop 
            : (currentSeriesData.backdrop || currentSeriesData.poster);

        // NUEVO: Cambiar el fondo principal (heroBg) al seleccionar la temporada
        const heroBg = document.getElementById('heroBg');
        if (heroBg) {
            heroBg.style.backgroundImage = `url('${seasonBackdrop}')`;
        }

        // Mapear los episodios
        const episodes = Object.keys(episodesData)
            .filter(key => key !== 'backdrop' && key !== 'capitulos') // Filtro de seguridad
            .map(key => ({
                episode_number: parseInt(key),
                video_url: episodesData[key]
            }))
            .sort((a, b) => a.episode_number - b.episode_number);

        // Pasamos el backdrop de la temporada a la función de renderizado
        renderEpisodes(episodes, seasonNumber, seasonBackdrop);
    } catch (e) {
        container.innerHTML = `
            <div style="padding:40px; text-align:center; color:#ff6b6b; width:100%;">
                <i class="fa-solid fa-exclamation-triangle" style="font-size:2rem;"></i><br><br>
                No se pudieron cargar los episodios de la Temporada ${seasonNumber}
            </div>`;
    }
}

// ================== CENTRAR EPISODIO ACTIVO ==================
function centrarEpisodioActivo() {
    const container = document.getElementById('episodesList');
    const activeCard = container.querySelector('.active-episode');
    
    if (activeCard && container) {
        const containerCenter = container.clientWidth / 2;
        const cardCenter = activeCard.clientWidth / 2;
        const targetScroll = activeCard.offsetLeft - containerCenter + cardCenter;
        
        container.scrollTo({
            left: targetScroll,
            behavior: 'smooth'
        });
    }
}

// ================== RENDERIZAR TARJETAS EPISODIOS ==================
function renderEpisodes(episodes, seasonNumber, seasonBackdrop) {
    const container = document.getElementById('episodesList');
    container.innerHTML = '';

    if (!episodes.length) {
        container.innerHTML = `<p style="color:#888; padding:30px;">No hay episodios en esta temporada.</p>`;
        return;
    }

    // NUEVO: Usamos el backdrop de la temporada para las miniaturas
    const thumbnail = seasonBackdrop || currentSeriesData?.backdrop || 'https://picsum.photos/id/1015/600/340';
    const lastWatched = getLastWatchedEpisode();

    episodes.forEach(ep => {
        const isActive = lastWatched && lastWatched.season === seasonNumber && lastWatched.episode === ep.episode_number;

        const card = document.createElement('div');
        card.className = `episode-card ${isActive ? 'active-episode' : ''}`;
        
        card.innerHTML = `
            <div class="episode-thumbnail" style="background-image: url('${thumbnail}')">
                <div class="episode-number">E${ep.episode_number}</div>
                <div class="episode-duration">45m</div>
            </div>
            <div class="episode-info">
                <div class="episode-title">Episodio ${ep.episode_number}</div>
                <div class="episode-sinopsis">Disfruta del episodio ${ep.episode_number} de la temporada ${seasonNumber} de ${currentSeriesData.titulo}.</div>
                <button class="episode-play-btn" data-video="${ep.video_url}">
                    <i class="fa-solid fa-play"></i> 
                    <span>Reproducir</span>
                </button>
            </div>
        `;

        const playBtn = card.querySelector('.episode-play-btn');
        playBtn.onclick = () => {
            if (!ep.video_url) {
                alert("Este episodio aún no tiene video disponible.");
                return;
            }
            saveLastWatchedEpisode(seasonNumber, ep.episode_number);
            
            document.querySelectorAll('.episode-card').forEach(c => c.classList.remove('active-episode'));
            card.classList.add('active-episode');
            
            centrarEpisodioActivo();

            const pt = document.getElementById('playText');
            if(pt) pt.textContent = `Continuar T${seasonNumber} E${ep.episode_number}`;

            currentEpisodeData = {
                video: ep.video_url,
                poster: thumbnail, // El reproductor también usará este backdrop como poster
                title: encodeURIComponent(`${currentSeriesData.titulo} - T${seasonNumber}E${ep.episode_number}`)
            };

            document.getElementById('playerModal').style.display = 'flex';
        };

        container.appendChild(card);
    });

    setTimeout(() => {
        centrarEpisodioActivo();
    }, 150);
}

// ================== CONTROL SLIDER ==================
function scrollSlider(direction) {
    const slider = document.getElementById('episodesList');
    const scrollAmount = 212; 
    slider.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
}

// ================== FUNCIONES DE STORAGE ==================
function saveLastWatchedEpisode(season, episode) {
    if (!currentSeriesId) return;
    const data = { seriesId: currentSeriesId, season: season, episode: episode, timestamp: Date.now() };
    localStorage.setItem(`lastWatched_${currentSeriesId}`, JSON.stringify(data));
}

function getLastWatchedEpisode() {
    if (!currentSeriesId) return null;
    const saved = localStorage.getItem(`lastWatched_${currentSeriesId}`);
    return saved ? JSON.parse(saved) : null;
}

// ================== MODALES (TRAILER & PLAYER) ==================
function abrirTrailerModal(url) {
    let videoId = "";
    if (url.includes("youtube.com/watch?v=")) {
        videoId = url.split("v=")[1].split("&")[0];
    } else if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1].split("?")[0];
    }

    if (!videoId) {
        window.open(url, '_blank'); 
        return;
    }

    const modal = document.getElementById('trailerModal');
    const iframe = document.getElementById('trailerIframe');
    if (modal && iframe) {
        iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        modal.style.display = 'flex';
    }
}

function closeTrailerModal() {
    const modal = document.getElementById('trailerModal');
    const iframe = document.getElementById('trailerIframe');
    if (modal) {
        modal.style.display = 'none';
        if (iframe) iframe.src = ""; 
    }
}

function openPlayer(option) {
    document.getElementById('playerModal').style.display = 'none';
    if (!currentEpisodeData || !currentEpisodeData.video) return;

    let url = option === 1 
        ? `https://lzplayhd.online/lzpro/player.html?video=${encodeURIComponent(currentEpisodeData.video)}&poster=${encodeURIComponent(currentEpisodeData.poster)}&title=${currentEpisodeData.title}`
        : `https://lzrdrz10.github.io/premiumplayer/player.html?video=${encodeURIComponent(currentEpisodeData.video)}&poster=${encodeURIComponent(currentEpisodeData.poster)}&title=${currentEpisodeData.title}`;
    
    window.location.href = url;
}

function closeModal() {
    document.getElementById('playerModal').style.display = 'none';
}

function showError(msg) {
    const c = document.querySelector('.content');
    if (c) c.innerHTML = `<div style="text-align:center;padding:60px 20px;color:white;"><h2>${msg}</h2><button onclick="location.reload()" style="margin-top:20px;padding:12px 30px;background:var(--red);color:white;border:none;border-radius:8px;">Recargar</button></div>`;
}

// ================== FIREBASE & OTROS (MI LISTA) ==================
async function incrementarVistas() {
    if (!currentSeriesId) return;
    try {
        await firebase.firestore().collection("contenidos").doc(currentSeriesId).set({
            vistas: firebase.firestore.FieldValue.increment(1),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    } catch (e) {}
}

// TOAST NOTIFICATIONS (Alertas UI)
function showToast(msg, iconClass = 'fa-info-circle') {
    let toast = document.getElementById('app-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'app-toast';
        toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(20,20,20,0.95);color:#fff;padding:12px 24px;border-radius:8px;border:1px solid #333;box-shadow:0 4px 12px rgba(0,0,0,0.5);z-index:99999;transition:opacity 0.3s;display:flex;align-items:center;gap:10px;font-family:sans-serif;font-size:14px;';
        document.body.appendChild(toast);
    }
    toast.innerHTML = `<i class="fa-solid ${iconClass}"></i> <span>${msg}</span>`;
    toast.style.opacity = '1';
    toast.style.display = 'flex';
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.style.display = 'none', 300);
    }, 3000);
}

// LOGICA DE GUARDADO FIRESTORE (NUEVA ESTRUCTURA)
async function toggleFavorite(seriesId, seriesData) {
    const user = firebase.auth().currentUser;
    if (!user) {
        showToast('Iniciando sesión o no autenticado', 'fa-spinner fa-spin');
        return false;
    }

    // Referencia al documento específico dentro de la subcolección myList
    const docRef = firebase.firestore()
        .collection("users")
        .doc(user.uid)
        .collection("myList")
        .doc(seriesId.toString());

    try {
        const docSnap = await docRef.get();

        if (docSnap.exists) {
            // Si ya existe, lo eliminamos (Quitar de mi lista)
            await docRef.delete();
            return false;
        } else {
            // Si no existe, lo creamos con el formato exacto requerido
            await docRef.set({
                addedAt: firebase.firestore.FieldValue.serverTimestamp(),
                id: Number(seriesId), // int64 format
                type: "serie",
                url: `https://lzplayhd.online/apple/data%20base/contenido-serie.html?id=${seriesId}`
            });
            return true;
        }
    } catch (error) {
        console.error('Error en Mi lista:', error);
        showToast('Error al guardar', 'fa-exclamation-triangle');
        return false;
    }
}

// ACCION DEL BOTON
function toggleList(btn) {
    if (!currentSeriesId || !currentSeriesData) return;
    
    toggleFavorite(currentSeriesId, currentSeriesData).then(isSaved => {
        const icon = btn.querySelector('i');
        const span = btn.querySelector('span');

        if (isSaved) {
            if (icon) icon.className = 'fa-solid fa-bookmark';
            btn.classList.add('saved');
            btn.style.color = '#f5c518';
            if (span) span.textContent = 'Guardado';
            showToast('Añadido a Mi lista ✓', 'fa-bookmark');
        } else {
            if (icon) icon.className = 'fa-regular fa-bookmark';
            btn.classList.remove('saved');
            btn.style.color = '';
            if (span) span.textContent = 'Mi lista';
            showToast('Eliminado de Mi lista', 'fa-bookmark');
        }
    });
}

// CARGAR ESTADO INICIAL
async function loadFavoriteState(id) {
    const btn = document.getElementById('listBtn');
    if (!btn) return;
    
    // Esperamos un momento por si firebase auth tarda en inicializar
    setTimeout(async () => {
        const user = firebase.auth().currentUser;
        if (!user) return;

        try {
            // Comprobamos la existencia del documento en myList
            const docRef = firebase.firestore()
                .collection("users")
                .doc(user.uid)
                .collection("myList")
                .doc(id.toString());

            const docSnap = await docRef.get();
            const isSaved = docSnap.exists;
            
            const icon = btn.querySelector('i');
            const span = btn.querySelector('span');

            if (isSaved) {
                if(icon) icon.className = 'fa-solid fa-bookmark';
                btn.classList.add('saved');
                btn.style.color = '#f5c518';
                if(span) span.textContent = 'Guardado';
            } else {
                if(icon) icon.className = 'fa-regular fa-bookmark';
                btn.classList.remove('saved');
                btn.style.color = '';
                if(span) span.textContent = 'Mi lista';
            }
        } catch (e) {
            console.error('Error cargando Mi lista:', e);
        }
    }, 1000);
}

// Iniciar
document.addEventListener("DOMContentLoaded", () => {
    loadSeries();

    const crewBtn = document.getElementById('crewToggleBtn');
    if (crewBtn) {
        crewBtn.addEventListener('click', () => {
            const s = document.getElementById('crewSection');
            const isHidden = s.style.display === 'none' || s.style.display === '';
            s.style.display = isHidden ? 'block' : 'none';
            crewBtn.innerHTML = isHidden 
                ? `<i class="fa-solid fa-chevron-up"></i> Ocultar equipo creativo`
                : `<i class="fa-solid fa-users"></i> Ver detalles del equipo creativo`;
        });
    }

    setTimeout(async () => {
        const id = getContentId();
        if (!id) return;
        try {
            const data = await fetchTMDB(`tv/${id}`);
            if (data && data.vote_average) {
                document.getElementById('ratingNumber').textContent = data.vote_average.toFixed(1);
                document.getElementById('ratingBars').innerHTML = `<div style="font-size:0.85rem;color:#aaa;margin-top:8px;">Basado en <strong>${data.vote_count.toLocaleString('es-ES')}</strong> valoraciones</div>`;
            }
        } catch (e) {}
    }, 1300);
});
