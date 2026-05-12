// =============================================
// CONTENIDO.JS - Versión FINAL y CORREGIDA
// =============================================

const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/thexxx880/apple/main/data%20base/data/movie/";

// ================== OBTENER ID ==================
function getContentId() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) {
    showError("❌ Falta el parámetro <b>id</b>");
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
let currentMovieId = null;
let currentMovieData = null;

function renderPage(data, vistasData, id) {
  currentMovieId = id;
  currentMovieData = data;

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

  // Meta
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

  // Sinopsis y géneros
  document.getElementById('sinopsis').textContent = data.sinopsis || "Sin sinopsis disponible.";
  const generosContainer = document.getElementById('generos');
  generosContainer.innerHTML = (data.generos || []).map(g => 
    `<span class="genre-chip">${g}</span>`
  ).join('');

  // Stats
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

  loadFavoriteState(id);

  // Ocultar loader
  const loader = document.getElementById('loader');
  if (loader) loader.style.display = 'none';

  console.log(`%c✅ Contenido cargado | ID ${id}`, 'color:#46d369;font-weight:bold');
}

// ================== MI LISTA CON FIREBASE ==================
async function toggleFavorite(movieId, movieData) {
  const auth = window.firebaseAuth;
  const db = window.firebaseDb;
  const user = auth.currentUser;

  if (!user) {
    showToast('Iniciando sesión...', 'fa-spinner fa-spin');
    return false;
  }

  const userRef = doc(db, 'users', user.uid);

  try {
    const docSnap = await getDoc(userRef);
    let favorites = docSnap.exists() && docSnap.data().favorites ? { ...docSnap.data().favorites } : {};

    if (favorites[movieId]) {
      delete favorites[movieId];
    } else {
      const currentUrl = window.location.href;
      favorites[movieId] = {
        id: movieId,
        url: currentUrl,
        titulo: document.getElementById('pageTitle').textContent.replace(' • LzPlay', ''),
        año: movieData.año,
        generos: movieData.generos || [],
        backdrop: movieData.backdrop || movieData.poster,
        poster: movieData.poster,
        logo: movieData.logo || ''
      };
    }

    await setDoc(userRef, { favorites }, { merge: true });
    return !!favorites[movieId];
  } catch (error) {
    console.error('Error en Mi lista:', error);
    showToast('Error al guardar', 'fa-exclamation-triangle');
    return false;
  }
}

async function loadFavoriteState(movieId) {
  const btn = document.getElementById('listBtn');
  if (!btn) return;

  const auth = window.firebaseAuth;
  const db = window.firebaseDb;
  const user = auth.currentUser;
  if (!user) return;

  try {
    const docSnap = await getDoc(doc(db, 'users', user.uid));
    const favorites = docSnap.exists() && docSnap.data().favorites ? docSnap.data().favorites : {};
    const isSaved = !!favorites[movieId];

    const icon = btn.querySelector('i');
    if (isSaved) {
      icon.className = 'fa-solid fa-bookmark';
      btn.classList.add('saved');
      btn.style.color = '#f5c518';
      btn.querySelector('span').textContent = 'Guardado';
    } else {
      icon.className = 'fa-regular fa-bookmark';
      btn.classList.remove('saved');
      btn.style.color = '';
      btn.querySelector('span').textContent = 'Mi lista';
    }
  } catch (e) {
    console.error('Error cargando Mi lista:', e);
  }
}

function toggleList(btn) {
  if (!currentMovieId || !currentMovieData) return;
  toggleFavorite(currentMovieId, currentMovieData).then(isSaved => {
    const icon = btn.querySelector('i');
    if (isSaved) {
      icon.className = 'fa-solid fa-bookmark';
      btn.classList.add('saved');
      btn.style.color = '#f5c518';
      btn.querySelector('span').textContent = 'Guardado';
      showToast('Añadido a Mi lista ✓', 'fa-bookmark');
    } else {
      icon.className = 'fa-regular fa-bookmark';
      btn.classList.remove('saved');
      btn.style.color = '';
      btn.querySelector('span').textContent = 'Mi lista';
      showToast('Eliminado de Mi lista', 'fa-bookmark');
    }
  });
}

// ================== TRAILER ==================
function playTrailer(data) {
  const trailerUrl = data.trailer || data.youtube || data.video_trailer;
  if (trailerUrl) {
    window.open(trailerUrl, '_blank');
  } else {
    showToast('No hay trailer disponible', 'fa-exclamation-triangle');
  }
}

// ================== MODAL REPRODUCTORES ==================
function showPlayerModal(data) {
  const modal = document.getElementById('playerModal');
  window.currentMovieData = {
    video: data.enlace_video || data.video || data.url || data.enlace,
    poster: data.backdrop || data.poster,
    title: encodeURIComponent(data.titulo || 'Película')
  };
  modal.style.display = 'flex';
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

// ================== FUNCIONES AUXILIARES ==================
function showCastInfo(name) {
  showToast(`Filmografía de ${name}`, 'fa-person');
}

function goBack() {
  window.history.back();
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

// ================== SHOW ERROR ==================
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

// ================== INICIO ==================
document.addEventListener("DOMContentLoaded", loadContent);
