// =============================================
// CONTENIDO.JS - Sistema de vistas Firebase
// =============================================

const GITHUB_RAW_BASE =
  "https://raw.githubusercontent.com/thexxx880/apple/main/data%20base/data/movie/";

// ✅ JSON CENTRAL CON LOS ENLACES DE VIDEO
const LIST_MOVIE_JSON =
  "https://raw.githubusercontent.com/thexxx880/API/main/content/API/JSON/list-movie.JSON";

// ================== CACHE DE ENLACES ==================
let videoLinksCache = null;

// ================== OBTENER ENLACE DE VIDEO ==================
async function getVideoLink(id) {
  try {
    if (!videoLinksCache) {
      const res = await fetch(LIST_MOVIE_JSON);
      if (!res.ok) throw new Error("No se pudo cargar list-movie.JSON");
      videoLinksCache = await res.json();
    }

    const entry = videoLinksCache[id];
    if (entry && entry.enlace) {
      return entry.enlace;
    }

    console.warn(`⚠️ No se encontró enlace para ID: ${id}`);
    return null;
  } catch (err) {
    console.error("❌ Error cargando enlace de video:", err);
    return null;
  }
}

// ================== OBTENER ID ==================
function getContentId() {
  const params =
    new URLSearchParams(
      window.location.search
    );
  const id =
    params.get("id") ||
    params.get("tmdb_id");
  if (!id) {
    showError(
      "❌ Falta el parámetro <b>id</b>"
    );
    return null;
  }
  return id.toString();
}

// ================== INCREMENTAR VISTAS ==================
async function incrementarVistas() {
  const contentId =
    getContentId();
  if (!contentId) {
    console.warn(
      "No se encontró ID"
    );
    return;
  }
  try {
    const db =
      firebase.firestore();
    const docRef =
      db
        .collection(
          "contenidos"
        )
        .doc(contentId);
    await docRef.set({
      vistas:
        firebase.firestore.FieldValue.increment(1),
      updatedAt:
        firebase.firestore.FieldValue.serverTimestamp()
    }, {
      merge: true
    });
    console.log(
      `✅ Vista incrementada: ${contentId}`
    );
    setTimeout(() => {
      if (
        typeof window.recargarStats ===
        "function"
      ) {
        window.recargarStats();
      }
    }, 300);
  } catch (error) {
    console.error(
      "❌ Error incrementando vistas:",
      error
    );
  }
}

// ================== RECARGAR STATS ==================
window.recargarStats =
  async function () {
    const contentId =
      getContentId();
    if (!contentId) return;
    try {
      const db =
        firebase.firestore();
      const docSnap =
        await db
          .collection(
            "contenidos"
          )
          .doc(contentId)
          .get();
      const viewCountEl =
        document.getElementById(
          "viewCount"
        );
      if (!viewCountEl) {
        return;
      }
      if (docSnap.exists) {
        const data =
          docSnap.data();
        const vistas =
          data.vistas || 0;
        viewCountEl.textContent =
          vistas.toLocaleString(
            "es-ES"
          );
        console.log(
          "👁️ Vistas:",
          vistas
        );
      } else {
        viewCountEl.textContent =
          "0";
      }
    } catch (error) {
      console.error(
        "❌ Error recargando vistas:",
        error
      );
    }
  };

// ================== CARGAR CONTENIDO ==================
async function loadContent() {
  const id =
    getContentId();
  if (!id) return;
  const contenidoUrl =
    `${GITHUB_RAW_BASE}${id}/${id}.json`;
  try {
    const contenidoRes =
      await fetch(
        contenidoUrl
      );
    if (
      !contenidoRes.ok
    ) {
      throw new Error(
        `No se encontró ${id}.json`
      );
    }
    const contenido =
      await contenidoRes.json();
    renderPage(
      contenido,
      id
    );
    setTimeout(() => {
      window.recargarStats?.();
    }, 300);
    setTimeout(() => {
      incrementarVistas();
    }, 1000);
  } catch (err) {
    console.error(err);
    showError(
      `No se encontró el contenido
      <br>
      <small>ID: ${id}</small>`
    );
  }
}

// ================== RENDERIZAR PÁGINA ==================
let currentMovieId = null;
let currentMovieData = null;

function renderPage(data, id) {
  currentMovieId = id;
  currentMovieData = data;

  document.getElementById('pageTitle').textContent = `${data.titulo} • LzPlay`;
  const heroBg = document.getElementById('heroBg');
  heroBg.style.backgroundImage = `url('${data.backdrop || data.poster}')`;
  setTimeout(() => heroBg.classList.add('loaded'), 100);

  const heroLogo = document.getElementById('heroLogo');
  heroLogo.innerHTML = data.logo
    ? `<img src="${data.logo}" alt="${data.titulo}">`
    : `<h1 style="font-size:3.8rem;line-height:1;color:white;font-family:'Bebas Neue',sans-serif;">${data.titulo}</h1>`;

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

  document.getElementById('sinopsis').textContent = data.sinopsis || "Sin sinopsis disponible.";

  const generosContainer = document.getElementById('generos');
  generosContainer.innerHTML = (data.generos || []).map(g =>
    `<span class="genre-chip">${g}</span>`
  ).join('');

  document.getElementById('statsRow').innerHTML = `
    <div class="stat-card"><i class="fa-solid fa-calendar-days stat-icon"></i><div class="stat-value">${data.año}</div><div class="stat-label">Estreno</div></div>
    <div class="stat-card"><i class="fa-solid fa-clock stat-icon"></i><div class="stat-value">${data.duracion}</div><div class="stat-label">Duración</div></div>
    <div class="stat-card"><i class="fa-solid fa-star stat-icon" style="color:var(--gold)"></i><div class="stat-value" style="color:var(--gold)">${data.puntuacion}</div><div class="stat-label">Puntuación</div></div>
    <div class="stat-card"><i class="fa-solid fa-eye stat-icon"></i><div class="stat-value" id="viewCount">—</div><div class="stat-label">Vistas</div></div>
  `;

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

  // Asignar eventos
  const playBtn = document.getElementById('playBtn');
  const trailerBtn = document.getElementById('trailerBtn');
  
  if (playBtn) playBtn.onclick = () => showPlayerModal(data, id); // ← Modificado
  if (trailerBtn) trailerBtn.onclick = () => playTrailer(data);

  loadFavoriteState(id);

  if (typeof hideLoader === "function") {
    hideLoader();
  } else {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'none';
  }

  console.log(`%c✅ Contenido cargado | ID ${id}`, 'color:#46d369;font-weight:bold');
}

// ================== MI LISTA CON DATOS COMPLETOS ==================
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

// ================== TRAILER Y MODAL ==================
function playTrailer(data) {
  const trailerUrl = data.trailer || data.youtube || data.video_trailer;
  if (trailerUrl) {
    window.open(trailerUrl, '_blank');
  } else {
    showToast('No hay trailer disponible', 'fa-exclamation-triangle');
  }
}

// ================== SHOW PLAYER MODAL (MODIFICADO) ==================
async function showPlayerModal(data, id) {
  const modal = document.getElementById('playerModal');
  
  const videoUrl = await getVideoLink(id);

  if (!videoUrl) {
    showToast('❌ No se encontró enlace de video para este contenido', 'fa-exclamation-triangle');
    return;
  }

  window.currentMovieData = {
    video: videoUrl,
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
    url = `https://lzplayhd.online/lzpro/player.html?video=${encodeURIComponent(d.video)}&poster=${encodeURIComponent(d.poster)}&title=${d.title}`;
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
  if (!loader) return;
  loader.innerHTML = `
    <div class="error-screen" style="text-align:center;color:white;padding:40px;">
      <h2 style="font-size:2rem;margin-bottom:16px;">${message}</h2>
      <p style="color:#ccc;">Verifica que el archivo exista</p>
      <button onclick="window.location.reload()" style="margin-top:25px;padding:12px 28px;background:#4f7cff;color:white;border:none;border-radius:8px;font-size:1rem;cursor:pointer;">
        Recargar página
      </button>
    </div>`;
}

// ================== INICIO ==================
document.addEventListener("DOMContentLoaded", loadContent);
