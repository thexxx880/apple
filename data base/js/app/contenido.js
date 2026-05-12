// =============================================
// CONTENIDO.JS - Página de detalle de película/serie
// =============================================

const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/thexxx880/apple/main/data%20base/data/movie/";

// ================== OBTENER ID DESDE LA URL ==================
function getContentId() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) {
        showError("❌ Falta el parámetro <b>id</b><br><small>Usa: contenido.html?id=22</small>");
        return null;
    }
    return id;
}

// ================== MOSTRAR ERROR ==================
function showError(message) {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.innerHTML = `
            <div class="error-screen">
                <h2 style="font-size:2rem;margin-bottom:16px;">${message}</h2>
                <p style="color:#ccc;">Verifica que el archivo exista en tu repositorio de GitHub.</p>
            </div>`;
    }
}

// ================== CARGAR DATOS ==================
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

        renderPage(contenido, vistasData, id);
    } catch (err) {
        console.error(err);
        showError(`No se encontró el contenido<br><small>ID: ${id}</small>`);
    }
}

// ================== RENDERIZAR PÁGINA ==================
function renderPage(data, vistasData, id) {
    // Título de la pestaña
    document.getElementById('pageTitle').textContent = `${data.titulo} • LzPlay`;

    // Hero Background
    const heroBg = document.getElementById('heroBg');
    heroBg.style.backgroundImage = `url('${data.backdrop || data.poster}')`;
    setTimeout(() => heroBg.classList.add('loaded'), 100);

    // Hero Logo
    const heroLogo = document.getElementById('heroLogo');
    if (data.logo && data.logo !== "") {
        heroLogo.innerHTML = `<img src="${data.logo}" alt="${data.titulo}">`;
    } else {
        heroLogo.innerHTML = `<h1 style="font-size:3.8rem;line-height:1;color:white;font-family:'Bebas Neue',sans-serif;">${data.titulo}</h1>`;
    }

    // Eyebrow / Trending
    const eyebrow = document.getElementById('heroEyebrow');
    eyebrow.innerHTML = data.trending 
        ? `<span class="tag"><i class="fa-solid fa-fire-flame-curved"></i> Tendencia #1</span>`
        : `<span class="tag outline">${data.generos ? data.generos[0] : 'Película'}</span>`;

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

    // Sinopsis
    document.getElementById('sinopsis').textContent = data.sinopsis || "Sin sinopsis disponible.";

    // Géneros
    const generosContainer = document.getElementById('generos');
    generosContainer.innerHTML = (data.generos || []).map(g => 
        `<span class="genre-chip">${g}</span>`
    ).join('');

    // Stats Row
    const vistas = vistasData.vistas[id] || 0;
    document.getElementById('statsRow').innerHTML = `
        <div class="stat-card">
            <i class="fa-solid fa-calendar-days stat-icon"></i>
            <div class="stat-value">${data.año}</div>
            <div class="stat-label">Estreno</div>
        </div>
        <div class="stat-card">
            <i class="fa-solid fa-clock stat-icon"></i>
            <div class="stat-value">${data.duracion}</div>
            <div class="stat-label">Duración</div>
        </div>
        <div class="stat-card">
            <i class="fa-solid fa-star stat-icon" style="color:var(--gold)"></i>
            <div class="stat-value" style="color:var(--gold)">${data.puntuacion}</div>
            <div class="stat-label">Puntuación</div>
        </div>
        <div class="stat-card">
            <i class="fa-solid fa-eye stat-icon"></i>
            <div class="stat-value">${vistas.toLocaleString('es-ES')}</div>
            <div class="stat-label">Vistas</div>
        </div>
    `;

    // Reparto
    const castContainer = document.getElementById('castScroll');
    castContainer.innerHTML = (data.reparto || []).map(actor => `
        <div class="cast-card" onclick="showCastInfo('${actor.nombre}')">
            <div class="cast-img-wrap">
                <img src="${actor.foto || 'https://i.pravatar.cc/150?img=12'}" alt="${actor.nombre}">
            </div>
            <div class="cast-name">${actor.nombre}</div>
            <div class="cast-role">${actor.personaje}</div>
        </div>
    `).join('');

    // Equipo creativo
    const crewContainer = document.getElementById('crewGrid');
    const allCrew = [...(data.equipo_creativo || []), ...(data.crew || [])];
    crewContainer.innerHTML = allCrew.map(person => `
        <div class="crew-card">
            <div class="crew-icon"><i class="fa-solid fa-user-tie"></i></div>
            <div>
                <div class="crew-name">${person.nombre}</div>
                <div class="crew-role">${person.rol}</div>
            </div>
        </div>
    `).join('');

    // Ocultar loader
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'none';

    console.log('%c✅ Contenido cargado correctamente', 'color:#46d369;font-weight:bold');
}

// ================== FUNCIONES INTERACTIVAS ==================
let isPlaying = false;
function togglePlay(btn) {
    isPlaying = !isPlaying;
    const icon = document.getElementById('playIcon');
    const text = document.getElementById('playText');
    if (isPlaying) {
        icon.className = 'fa-solid fa-pause';
        text.textContent = 'Pausar';
        btn.classList.add('playing');
        showToast('Reproduciendo...', 'fa-play');
    } else {
        icon.className = 'fa-solid fa-play';
        text.textContent = 'Reproducir';
        btn.classList.remove('playing');
        showToast('Pausado', 'fa-pause');
    }
}

let liked = false;
function toggleLike(btn) {
    liked = !liked;
    const icon = btn.querySelector('i');
    if (liked) {
        icon.className = 'fa-solid fa-thumbs-up';
        btn.classList.add('liked');
        btn.querySelector('span').textContent = 'Te gustó';
        showToast('¡Te gusta!', 'fa-heart');
    } else {
        icon.className = 'fa-regular fa-thumbs-up';
        btn.classList.remove('liked');
        btn.querySelector('span').textContent = 'Me gusta';
    }
}

let saved = false;
function toggleList(btn) {
    saved = !saved;
    const icon = btn.querySelector('i');
    if (saved) {
        icon.className = 'fa-solid fa-bookmark';
        btn.classList.add('saved');
        btn.querySelector('span').textContent = 'Guardado';
        showToast('Añadido a Mi lista', 'fa-bookmark');
    } else {
        icon.className = 'fa-regular fa-bookmark';
        btn.classList.remove('saved');
        btn.querySelector('span').textContent = 'Mi lista';
    }
}

function shareMovie() {
    showToast('Enlace copiado al portapapeles', 'fa-link');
}

function reportContent() {
    showToast('Reporte enviado. ¡Gracias!', 'fa-flag');
}

function showInfo() {
    showToast('Más información cargada', 'fa-circle-info');
}

function showCastInfo(name) {
    showToast(`Filmografía de ${name}`, 'fa-person');
}

function goBack() {
    window.history.back();
}

function navTo(section, el) {
    document.querySelectorAll('.bottom-nav .nav-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
    showToast(section === 'home' ? 'Inicio' : section, 'fa-circle-check');
}

// ================== TOAST ==================
let toastTimer;
function showToast(msg, icon = 'fa-circle-check') {
    const t = document.getElementById('toast');
    if (!t) return;
    t.innerHTML = `<i class="fa-solid ${icon}"></i> ${msg}`;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

// ================== INICIO ==================
document.addEventListener("DOMContentLoaded", loadContent);
