// =============================================
// CONTENIDO-SERIE.JS - Versión Final con Slider + LocalStorage
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

// ================== CARGAR SERIE PRINCIPAL ==================
async function loadSeries() {
    const id = getContentId();
    if (!id) {
        showError("❌ Falta el parámetro <b>id</b>");
        return;
    }
    currentSeriesId = id;

    const url = `${GITHUB_RAW_BASE}${id}/${id}.json`;
    console.log("Cargando serie:", url);

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Serie no encontrada");

        const data = await res.json();
        currentSeriesData = data;

        renderSeriesPage(data);
        renderSeasonsTabs(data);

        setTimeout(() => loadSeasonEpisodes(id, 1), 350);
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
        <span class="meta-text">${temporadas} Temporada${temporadas > 1 ? 's' : ''}</span>
        <div class="meta-dot"></div>
        <span class="meta-text">${episodiosTotales} Episodios</span>
        <div class="meta-dot"></div>
        <span class="meta-badge">${data.calificacion || 'TV-14'}</span>
        <span class="meta-badge">${data.edad_minima || '13'}+</span>
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
            <div class="stat-value">${episodiosTotales}</div>
            <div class="stat-label">Episodios</div>
        </div>
        <div class="stat-card">
            <i class="fa-solid fa-star stat-icon" style="color:var(--gold)"></i>
            <div class="stat-value" style="color:var(--gold)">${data.puntuacion || '—'}</div>
            <div class="stat-label">Puntuación</div>
        </div>
        <div class="stat-card">
            <i class="fa-solid fa-eye stat-icon"></i>
            <div class="stat-value" id="viewCount">—</div>
            <div class="stat-label">Vistas</div>
        </div>
    `;

    // Reparto
    const castContainer = document.getElementById('castScroll');
    castContainer.innerHTML = (data.reparto || []).map(actor => `
        <div class="cast-card" onclick="showCastInfo('${actor.nombre}')">
            <div class="cast-img-wrap"><img src="${actor.foto || 'https://i.pravatar.cc/150?img=12'}" alt="${actor.nombre}"></div>
            <div class="cast-name">${actor.nombre}</div>
            <div class="cast-role">${actor.personaje}</div>
        </div>
    `).join('');

    // Crew
    const crewContainer = document.getElementById('crewGrid');
    const allCrew = [...(data.equipo_creativo || []), ...(data.crew || [])];
    crewContainer.innerHTML = allCrew.map(person => `
        <div class="crew-card">
            <div class="crew-icon"><i class="fa-solid fa-user-tie"></i></div>
            <div><div class="crew-name">${person.nombre}</div><div class="crew-role">${person.rol}</div></div>
        </div>
    `).join('');

    // Botón principal de reproducir
    const playBtn = document.getElementById('playBtn');
    if (playBtn) {
        playBtn.onclick = () => {
            loadSeasonEpisodes(currentSeriesId, 1).then(() => {
                setTimeout(() => {
                    const firstBtn = document.querySelector('.episode-play-btn');
                    if (firstBtn) firstBtn.click();
                }, 650);
            });
        };
    }

    const trailerBtn = document.getElementById('trailerBtn');
    if (trailerBtn) trailerBtn.onclick = () => playTrailer(data);

    loadFavoriteState(currentSeriesId);

    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'none';

    console.log(`✅ Serie cargada: ${data.titulo}`);
}

// ================== TEMPORADAS ==================
function renderSeasonsTabs(data) {
    const container = document.getElementById('seasonsTabs');
    container.innerHTML = '';
    const total = data.number_of_seasons || 1;

    for (let i = 1; i <= total; i++) {
        const tab = document.createElement('div');
        tab.className = `season-tab ${i === 1 ? 'active' : ''}`;
        tab.textContent = `T${i}`;
        tab.onclick = () => {
            document.querySelectorAll('.season-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            loadSeasonEpisodes(currentSeriesId, i);
        };
        container.appendChild(tab);
    }
}

// ================== CARGAR EPISODIOS DE TEMPORADA ==================
async function loadSeasonEpisodes(seriesId, seasonNumber) {
    currentSeason = seasonNumber;
    const url = `${GITHUB_RAW_BASE}${seriesId}/t${seasonNumber}/${seriesId}.json`;
    console.log("Cargando episodios:", url);

    document.getElementById('currentSeasonTitle').textContent = `Temporada ${seasonNumber}`;
    const container = document.getElementById('episodesList');
    container.innerHTML = `<div style="padding:30px; text-align:center; color:#666;">Cargando episodios...</div>`;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Sin episodios");
        
        const seasonData = await res.json();

        const episodes = Object.keys(seasonData)
            .map(key => ({
                episode_number: parseInt(key),
                video_url: seasonData[key]
            }))
            .sort((a, b) => a.episode_number - b.episode_number);

        renderEpisodes(episodes, seasonNumber);

    } catch (e) {
        container.innerHTML = `
            <div style="padding:40px; text-align:center; color:#ff6b6b;">
                <i class="fa-solid fa-exclamation-triangle" style="font-size:2rem;"></i><br><br>
                No se pudieron cargar los episodios de la Temporada ${seasonNumber}
            </div>`;
    }
}

// ================== RENDERIZAR EPISODIOS EN SLIDER ==================
function renderEpisodes(episodes, seasonNumber) {
    const container = document.getElementById('episodesList');
    container.innerHTML = '';
    container.className = 'episodes-slider';

    if (!episodes.length) {
        container.innerHTML = `<p style="color:#888; padding:30px;">No hay episodios en esta temporada.</p>`;
        return;
    }

    const thumbnail = currentSeriesData?.backdrop || 'https://picsum.photos/id/1015/600/340';
    const lastWatched = getLastWatchedEpisode();

    episodes.forEach(ep => {
        const isActive = lastWatched && 
                         lastWatched.season === seasonNumber && 
                         lastWatched.episode === ep.episode_number;

        const card = document.createElement('div');
        card.className = `episode-card ${isActive ? 'active-episode' : ''}`;
        card.innerHTML = `
            <div class="episode-thumbnail" style="background-image: url('${thumbnail}')">
                <div class="episode-number">E${ep.episode_number}</div>
                <div class="episode-duration">45 min</div>
            </div>
            <div class="episode-info">
                <div class="episode-title">Episodio ${ep.episode_number}</div>
                <button class="episode-play-btn" data-video="${ep.video_url}">
                    <i class="fa-solid fa-play"></i> 
                    <span>Reproducir episodio</span>
                </button>
            </div>
        `;

        const playBtn = card.querySelector('.episode-play-btn');
        playBtn.onclick = () => {
            if (!ep.video_url) {
                alert("Este episodio aún no tiene video disponible.");
                return;
            }

            // Guardar en localStorage
            saveLastWatchedEpisode(seasonNumber, ep.episode_number);

            currentEpisodeData = {
                video: ep.video_url,
                poster: thumbnail,
                title: encodeURIComponent(`${currentSeriesData.titulo} - T${seasonNumber}E${ep.episode_number}`)
            };

            document.getElementById('playerModal').style.display = 'flex';
        };

        container.appendChild(card);
    });

    // Scroll automático al episodio guardado
    setTimeout(() => {
        if (lastWatched && lastWatched.season === seasonNumber) {
            const activeCard = container.querySelector('.active-episode');
            if (activeCard) {
                activeCard.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'nearest', 
                    inline: 'center' 
                });
            }
        }
    }, 700);
}

// ================== GUARDAR ÚLTIMO EPISODIO VISTO ==================
function saveLastWatchedEpisode(season, episode) {
    if (!currentSeriesId) return;
    
    const data = {
        seriesId: currentSeriesId,
        season: season,
        episode: episode,
        timestamp: Date.now()
    };
    
    localStorage.setItem(`lastWatched_${currentSeriesId}`, JSON.stringify(data));
}

// ================== OBTENER ÚLTIMO EPISODIO VISTO ==================
function getLastWatchedEpisode() {
    if (!currentSeriesId) return null;
    
    const saved = localStorage.getItem(`lastWatched_${currentSeriesId}`);
    if (!saved) return null;
    
    try {
        return JSON.parse(saved);
    } catch (e) {
        return null;
    }
}

// ================== REPRODUCTOR ==================
function openPlayer(option) {
    document.getElementById('playerModal').style.display = 'none';

    if (!currentEpisodeData || !currentEpisodeData.video) {
        alert("No hay video disponible.");
        return;
    }

    let url = '';
    if (option === 1) {
        url = `https://lzplayhd.online/lzpro/player.html?video=${encodeURIComponent(currentEpisodeData.video)}&poster=${encodeURIComponent(currentEpisodeData.poster)}&title=${currentEpisodeData.title}`;
    } else {
        url = `https://lzrdrz10.github.io/premiumplayer/player.html?video=${encodeURIComponent(currentEpisodeData.video)}&poster=${encodeURIComponent(currentEpisodeData.poster)}&title=${currentEpisodeData.title}`;
    }
    window.open(url, '_blank');
}

// ================== VISTAS ==================
async function incrementarVistas() {
    if (!currentSeriesId) return;
    try {
        await firebase.firestore().collection("contenidos").doc(currentSeriesId).set({
            vistas: firebase.firestore.FieldValue.increment(1),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        setTimeout(() => window.recargarStats?.(), 400);
    } catch (e) {}
}

window.recargarStats = async function () {
    if (!currentSeriesId) return;
    try {
        const doc = await firebase.firestore().collection("contenidos").doc(currentSeriesId).get();
        const el = document.getElementById("viewCount");
        if (el && doc.exists) el.textContent = (doc.data().vistas || 0).toLocaleString("es-ES");
    } catch (e) {}
};

// ================== TRAILER ==================
function playTrailer(data) {
    const url = data.trailer || data.youtube;
    url ? window.open(url, '_blank') : alert("No hay trailer disponible.");
}

// ================== MI LISTA (Firebase) ==================
let isSaved = false;

async function verificarMiLista() {
    const user = firebase.auth().currentUser;
    if (!user || !currentSeriesId) return;

    try {
        const doc = await firebase.firestore()
            .collection("users").doc(user.uid)
            .collection("myList").doc(currentSeriesId).get();

        const btn = document.getElementById("listBtn");
        if (!btn) return;

        if (doc.exists) {
            isSaved = true;
            btn.innerHTML = `<i class="fa-solid fa-bookmark"></i><span>Guardado</span>`;
        } else {
            isSaved = false;
            btn.innerHTML = `<i class="fa-regular fa-bookmark"></i><span>Mi lista</span>`;
        }
    } catch (e) {}
}

async function toggleList() {
    const user = firebase.auth().currentUser;
    if (!user) {
        window.location.href = "https://lzplayhd.online/apple/login.html";
        return;
    }
    const btn = document.getElementById("listBtn");
    if (!btn || !currentSeriesId) return;

    const docRef = firebase.firestore().collection("users").doc(user.uid).collection("myList").doc(currentSeriesId);

    try {
        if (isSaved) {
            await docRef.delete();
            isSaved = false;
            btn.innerHTML = `<i class="fa-regular fa-bookmark"></i><span>Mi lista</span>`;
        } else {
            await docRef.set({
                id: Number(currentSeriesId),
                type: "tv",
                url: window.location.href,
                addedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            isSaved = true;
            btn.innerHTML = `<i class="fa-solid fa-bookmark"></i><span>Guardado</span>`;
        }
    } catch (e) {
        alert("Error al guardar en Mi Lista");
    }
}

async function loadFavoriteState(id) {
    const btn = document.getElementById('listBtn');
    if (!btn) return;
    const user = firebase.auth().currentUser;
    if (!user) return;

    try {
        const doc = await firebase.firestore().collection("users").doc(user.uid).get();
        const favs = doc.exists && doc.data().favorites ? doc.data().favorites : {};
        if (favs[id]) {
            btn.innerHTML = `<i class="fa-solid fa-bookmark"></i><span>Guardado</span>`;
            btn.style.color = '#f5c518';
        }
    } catch (e) {}
}

// ================== AUXILIARES ==================
function showCastInfo(name) {
    alert(`Filmografía de ${name} (próximamente)`);
}

function closeModal() {
    document.getElementById('playerModal').style.display = 'none';
}

function showError(msg) {
    const c = document.querySelector('.content');
    if (c) c.innerHTML = `<div style="text-align:center;padding:60px 20px;color:white;"><h2>${msg}</h2><button onclick="location.reload()" style="margin-top:20px;padding:12px 30px;background:#e50914;color:white;border:none;border-radius:8px;">Recargar</button></div>`;
}

// ================== INICIALIZACIÓN ==================
document.addEventListener("DOMContentLoaded", () => {
    loadSeries();

    firebase.auth().onAuthStateChanged(async (user) => {
        if (!user) return;
        await verificarMiLista();
        const btn = document.getElementById("listBtn");
        if (btn) btn.addEventListener("click", toggleList);
    });

    const crewBtn = document.getElementById('crewToggleBtn');
    if (crewBtn) {
        crewBtn.addEventListener('click', () => {
            const s = document.getElementById('crewSection');
            if (s.style.display === 'none' || s.style.display === '') {
                s.style.display = 'block';
                crewBtn.innerHTML = `<i class="fa-solid fa-chevron-up"></i> Ocultar equipo creativo`;
            } else {
                s.style.display = 'none';
                crewBtn.innerHTML = `<i class="fa-solid fa-users"></i> Ver detalles del equipo creativo`;
            }
        });
    }

    setTimeout(() => {
        if (typeof loadTMDBRating === 'function') loadTMDBRating();
    }, 1300);
});

async function loadTMDBRating() {
    const id = getContentId();
    if (!id) return;
    try {
        const data = await fetchTMDB(`tv/${id}`);
        if (!data) return;
        const el = document.getElementById('ratingNumber');
        if (el) el.textContent = data.vote_average ? data.vote_average.toFixed(1) : '—';
        const bars = document.getElementById('ratingBars');
        if (bars && data.vote_count) {
            bars.innerHTML = `<div style="font-size:0.85rem;color:#aaa;margin-top:8px;">Basado en <strong>${data.vote_count.toLocaleString('es-ES')}</strong> valoraciones en TMDB</div>`;
        }
    } catch (e) {}
}
