// =============================================
// CONTENIDO.JS - Página de detalle completa (CORREGIDO)
// =============================================

const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/thexxx880/apple/main/data%20base/data/movie/";

// ================== OBTENER ID ==================
function getContentId() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) {
        showError("❌ Falta el parámetro <b>id</b><br><small>Usa: contenido.html?id=22</small>");
        return null;
    }
    return id;
}

// ================== INCREMENTAR VISTAS ==================
async function incrementViewCount(id) {
    const dataUrl = `${GITHUB_RAW_BASE}${id}/data.json`;
    try {
        const res = await fetch(dataUrl);
        let data = res.ok ? await res.json() : { vistas: {} };
        if (!data.vistas) data.vistas = {};
        data.vistas[id] = (data.vistas[id] || 0) + 1;
        return data.vistas[id];
    } catch (e) {
        console.log("No se pudo actualizar vistas");
        return 0;
    }
}

// ================== CARGAR CONTENIDO ==================
async function loadContent() {
    const id = getContentId();
    if (!id) return;

    const contenidoUrl = `${GITHUB_RAW_BASE}${id}/${id}.json`;
    const dataUrl = `${GITHUB_RAW_BASE}${id}/data.json`;

    try {
        const [contenidoRes, dataRes] = await Promise.all([
            fetch(contenidoUrl),
            fetch(dataUrl)
        ]);

        if (!contenidoRes.ok) throw new Error(`No se encontró ${id}.json`);

        const contenido = await contenidoRes.json();
        let vistasData = { vistas: {} };
        if (dataRes.ok) vistasData = await dataRes.json();

        const vistasActuales = await incrementViewCount(id);
        vistasData.vistas[id] = vistasActuales;

        renderPage(contenido, vistasData, id);
    } catch (err) {
        console.error(err);
        showError(`No se encontró el contenido<br><small>ID: ${id}</small>`);
    }
}

// ================== RENDERIZAR PÁGINA ==================
function renderPage(data, vistasData, id) {
    document.getElementById('pageTitle').textContent = `${data.titulo} • LzPlay`;

    // Hero Background
    const heroBg = document.getElementById('heroBg');
    heroBg.style.backgroundImage = `url('${data.backdrop || data.poster}')`;
    setTimeout(() => heroBg.classList.add('loaded'), 100);

    // Hero Logo
    const heroLogo = document.getElementById('heroLogo');
    heroLogo.innerHTML = data.logo 
        ? `<img src="${data.logo}" alt="${data.titulo}">`
        : `<h1 style="font-size:3.8rem;line-height:1;color:white;font-family:'Bebas Neue',sans-serif;">${data.titulo}</h1>`;

    // Meta information
    document.getElementById('heroMeta').innerHTML = `
        <span class="match-score"><i class="fa-solid fa-thumbs-up"></i> ${Math.round(data.puntuacion * 10)}% para ti</span>
        <div class="meta-dot"></div>
        <span class="meta-text">${data.año}</span>
        <div class="meta-dot"></div>
        <span class="meta-text">${data.duracion}</span>
        <div class="meta-dot"></div>
        <span class="meta-badge">${data.calificacion}</span>
        <span class="meta-badge">${data.edad_minima || '13'}+</span>
    `;

    // Sinopsis y Géneros
    document.getElementById('sinopsis').textContent = data.sinopsis || "Sin sinopsis disponible.";
    const generosContainer = document.getElementById('generos');
    generosContainer.innerHTML = (data.generos || []).map(g => 
        `<span class="genre-chip">${g}</span>`
    ).join('');

    // Stats con vistas
    const vistas = vistasData.vistas[id] || 0;
    document.getElementById('statsRow').innerHTML = `
        <div class="stat-card"><i class="fa-solid fa-calendar-days stat-icon"></i><div class="stat-value">${data.año}</div><div class="stat-label">Estreno</div></div>
        <div class="stat-card"><i class="fa-solid fa-clock stat-icon"></i><div class="stat-value">${data.duracion}</div><div class="stat-label">Duración</div></div>
        <div class="stat-card"><i class="fa-solid fa-star stat-icon" style="color:var(--gold)"></i><div class="stat-value" style="color:var(--gold)">${data.puntuacion}</div><div class="stat-label">Puntuación</div></div>
        <div class="stat-card"><i class="fa-solid fa-eye stat-icon"></i><div class="stat-value">${vistas.toLocaleString('es-ES')}</div><div class="stat-label">Vistas</div></div>
    `;

    // Reparto y Crew
    const castContainer = document.getElementById('castScroll');
    castContainer.innerHTML = (data.reparto || []).map(actor => `
        <div class="cast-card" onclick="showCastInfo('${actor.nombre}')">
            <div class="cast-img-wrap"><img src="${actor.foto || 'https://i.pravatar.cc/150?img=12'}" alt="${actor.nombre}"></div>
            <div class="cast-name">${actor.nombre}</div>
            <div class="cast-role">${actor.personaje}</div>
        </div>
    `).join('');

    const crewContainer = document.getElementById('crewGrid');
    const allCrew = [...(data.equipo_creativo || []), ...(data.crew || [])];
    crewContainer.innerHTML = allCrew.map(person => `
        <div class="crew-card">
            <div class="crew-icon"><i class="fa-solid fa-user-tie"></i></div>
            <div><div class="crew-name">${person.nombre}</div><div class="crew-role">${person.rol}</div></div>
        </div>
    `).join('');

    // ================== ASIGNAR EVENTOS ==================
    const playBtn = document.getElementById('playBtn');
    const trailerBtn = document.getElementById('trailerBtn');

    if (playBtn) playBtn.onclick = () => showPlayerModal(data);
    if (trailerBtn) trailerBtn.onclick = () => playTrailer(data);

    // Ocultar loader
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'none';

    console.log(`%c✅ Contenido cargado | ID ${id} | Vistas: ${vistas}`, 'color:#46d369;font-weight:bold');
}

// ================== TRAILER ==================
function playTrailer(data) {
    const trailerUrl = data.trailer || data.youtube || data.video_trailer;
    if (trailerUrl) {
        window.open(trailerUrl, '_blank');
    } else {
        showToast('No hay trailer disponible para este contenido', 'fa-exclamation-triangle');
    }
}

// ================== MODAL DE REPRODUCTORES ==================
function showPlayerModal(data) {
    const modal = document.getElementById('playerModal');
    
    window.currentMovieData = {
        video: data.enlace_video || data.video || data.url || data.enlace,   // ← CORREGIDO
        poster: data.backdrop || data.poster,
        title: encodeURIComponent(data.titulo || 'Película')
    };

    if (modal) modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('playerModal');
    if (modal) modal.style.display = 'none';
}

function openPlayer(option) {
    const d = window.currentMovieData;
    if (!d || !d.video) {
        showToast('No hay enlace de video disponible', 'fa-exclamation-triangle');
        closeModal();
        return;
    }

    let url = '';
    if (option === 1) {
        url = `https://lzplayhd.online/lzpro/?video=${encodeURIComponent(d.video)}&poster=${encodeURIComponent(d.poster)}&title=${d.title}`;
    } else if (option === 2) {
        url = `https://lzrdrz10.github.io/premiumplayer/player.html?video=${encodeURIComponent(d.video)}&poster=${encodeURIComponent(d.poster)}&title=${d.title}`;
    }

    closeModal();
    window.open(url, '_blank');
}

// ================== OTRAS FUNCIONES ==================
let liked = false;
function toggleLike(btn) {
    liked = !liked;
    const icon = btn.querySelector('i');
    if (liked) {
        icon.className = 'fa-solid fa-thumbs-up';
        btn.classList.add('liked');
        btn.querySelector('span').textContent = 'Te gustó';
    } else {
        icon.className = 'fa-regular fa-thumbs-up';
        btn.classList.remove('liked');
        btn.querySelector('span').textContent = 'Me gusta';
    }
    showToast(liked ? '¡Te gusta!' : 'Quitaste el me gusta', 'fa-heart');
}

let saved = false;
function toggleList(btn) {
    saved = !saved;
    const icon = btn.querySelector('i');
    if (saved) {
        icon.className = 'fa-solid fa-bookmark';
        btn.classList.add('saved');
        btn.querySelector('span').textContent = 'Guardado';
    } else {
        icon.className = 'fa-regular fa-bookmark';
        btn.classList.remove('saved');
        btn.querySelector('span').textContent = 'Mi lista';
    }
    showToast(saved ? 'Añadido a Mi lista' : 'Quitado de Mi lista', 'fa-bookmark');
}

function shareMovie() {
    showToast('Enlace copiado al portapapeles', 'fa-link');
}

function showCastInfo(name) {
    showToast(`Filmografía de ${name}`, 'fa-person');
}

// ================== TOAST ==================
let toastTimer;
function showToast(msg, icon = 'fa-circle-check') {
    let t = document.getElementById('toast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'toast';
        document.body.appendChild(t);
    }
    t.innerHTML = `<i class="fa-solid ${icon}"></i> ${msg}`;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

// ================== INICIO ==================
document.addEventListener("DOMContentLoaded", loadContent);
