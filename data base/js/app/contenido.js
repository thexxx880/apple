// =============================================
// CONTENIDO.JS - Sistema de vistas Firebase
// =============================================
const GITHUB_RAW_BASE =
  "https://raw.githubusercontent.com/thexxx880/apple/main/data%20base/data/movie/";

const LIST_MOVIE_JSON =
  "https://raw.githubusercontent.com/thexxx880/API/main/content/API/JSON/list-movie.JSON";

console.log("LIST_MOVIE_JSON URL:", LIST_MOVIE_JSON);
// ================== CACHE DE ENLACES ==================
let videoLinksCache = null;

// ================== OBTENER ENLACE DE VIDEO ==================
async function getVideoLink(id) {
  try {
    if (!videoLinksCache) {
      console.log("🔄 Cargando list-movie.JSON...");
      const res = await fetch(LIST_MOVIE_JSON);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} - Archivo no encontrado`);
      }
      const text = await res.text();
      videoLinksCache = JSON.parse(text);
      console.log(`✅ list-movie.JSON cargado correctamente (${Object.keys(videoLinksCache).length} películas)`);
    }

    const entry = videoLinksCache[id] || videoLinksCache[id.toString()];
    if (!entry) {
      console.warn(`⚠️ ID ${id} no encontrado en list-movie.JSON`);
      return null;
    }

    let enlace = null;

    // Soporta ambos formatos y devuelve el array completo si hay varios enlaces
    if (entry.enlace) {
      enlace = entry.enlace;
      console.log(`🎥 Enlace cargado desde "enlace" → ID ${id}`);
    } 
    else if (entry.enlaces) {
      enlace = entry.enlaces;
      console.log(`🎥 Enlace cargado desde "enlaces" → ID ${id}`);
    }

    if (enlace) {
      console.log(`✅ Enlace encontrado para ID ${id}`);
      return enlace;
    }

    console.warn(`⚠️ No se encontró ningún enlace para ID: ${id}`);
    console.warn(`   Claves disponibles:`, Object.keys(entry));
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
    // Incremento seguro
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
    // Actualizar contador
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
    // Renderizar primero
    renderPage(
      contenido,
      id
    );
    // Mostrar vistas actuales
    setTimeout(() => {
      window.recargarStats?.();
    }, 300);
    // Incrementar vista
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
  // Stats con vistas iniciales
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
  if (playBtn) playBtn.onclick = () => showPlayerModal(data, id);
  if (trailerBtn) trailerBtn.onclick = () => playTrailer(data);
  loadFavoriteState(id);
  // OCULTAR LOADER
  if (typeof hideLoader === "function") {
    hideLoader();
  } else {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'none';
  }
  console.log(`%c✅ Contenido cargado | ID ${id}`, 'color:#46d369;font-weight:bold');
}

// ================== MI LISTA ==================
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

// ================== TRAILER EN MODAL ==================
function playTrailer(data) {
  const trailerUrl = data.trailer || data.youtube || data.video_trailer;
  if (!trailerUrl) {
    showToast('No hay trailer disponible', 'fa-exclamation-triangle');
    return;
  }
  // Extraer ID de YouTube
  let videoId = trailerUrl;
  if (trailerUrl.includes('youtube.com') || trailerUrl.includes('youtu.be')) {
    const match = trailerUrl.match(/(?:youtu\.be\/|v=|embed\/)([^?&"'>]+)/);
    videoId = match ? match[1] : trailerUrl;
  }
  const modalHtml = `
    <div class="modal-trailer" style="position:fixed;inset:0;background:rgba(0,0,0,0.97);display:flex;align-items:center;justify-content:center;z-index:99999;">
      <div style="position:relative;width:90%;max-width:1100px;">
        <button onclick="this.closest('.modal-trailer').remove()"
                style="position:absolute;top:-60px;right:10px;color:white;font-size:2.5rem;background:none;border:none;cursor:pointer;z-index:10;">✕</button>
        <iframe width="100%" height="620"
                src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen></iframe>
      </div>
    </div>
  `;
  // Eliminar modal anterior si existe
  document.querySelectorAll('.modal-trailer').forEach(m => m.remove());
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// ================== VALIDACIÓN Y APERTURA DE ENLACES ==================

// 🔥 NUEVA FUNCIÓN: Extrae automáticamente el nombre del servidor según la URL
function getServerName(url) {
  const urlLower = url.toLowerCase();
  
  // 1. Excepción para mp4 y m3u8 (Archivos directos)
  if (urlLower.includes('.mp4') || urlLower.includes('.m3u8')) {
    return 'Lz';
  }
  
  // 2. Detección rápida de dominios comunes
  if (urlLower.includes('vidhide')) return 'VidHide';
  if (urlLower.includes('streamwish')) return 'StreamWish';
  if (urlLower.includes('voe')) return 'Voe';
  if (urlLower.includes('filemoon')) return 'Filemoon';
  if (urlLower.includes('dood')) return 'DoodStream';
  if (urlLower.includes('uqload')) return 'Uqload';
  if (urlLower.includes('mixdrop')) return 'MixDrop';
  
  // 3. Fallback genérico: Extraer el dominio base de la URL
  try {
    const host = new URL(url).hostname.replace('www.', '');
    const name = host.split('.')[0];
    return name.charAt(0).toUpperCase() + name.slice(1); // Capitaliza la primera letra
  } catch(e) {
    return 'Externo';
  }
}

async function showPlayerModal(data, id) {
  const videoData = await getVideoLink(id);

  if (!videoData) {
    showToast('❌ No se encontró enlace de video para este contenido', 'fa-exclamation-triangle');
    return;
  }

  // Convertir a un array para procesarlo de manera uniforme (1 o varios enlaces)
  const linksArray = Array.isArray(videoData) ? videoData : [videoData];

  // 🔥 Ahora cargamos absolutamente TODAS las URLs al modal, sin filtrar
  showServerModal(linksArray);
}

// ================== MODAL DE SELECCIÓN DE SERVIDORES ==================

function showServerModal(linksArray) {
  // Generar botones dinámicamente con su respectivo nombre de servidor
  let buttonsHtml = linksArray.map((link, index) => {
    const serverName = getServerName(link);
    return `
      <button onclick="window.location.href='${link}'" 
              style="display:flex;align-items:center;justify-content:center;gap:10px;width:100%;margin-bottom:12px;padding:16px;background:#2a2a2a;color:white;border:1px solid #444;border-radius:10px;font-size:1.1rem;font-weight:bold;cursor:pointer;transition:all 0.2s;"
              onmouseover="this.style.background='#4f7cff';this.style.borderColor='#4f7cff'"
              onmouseout="this.style.background='#2a2a2a';this.style.borderColor='#444'">
        <i class="fa-solid fa-play"></i> Opción ${index + 1} - Server (${serverName})
      </button>`;
  }).join('');

  const modalHtml = `
    <div class="modal-servers" style="position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center;z-index:99999;">
      <div style="position:relative;width:90%;max-width:400px;background:#141414;border:1px solid #333;border-radius:16px;padding:30px;box-shadow:0 10px 40px rgba(0,0,0,0.8);">
        <button onclick="this.closest('.modal-servers').remove()"
                style="position:absolute;top:15px;right:20px;color:#888;font-size:1.8rem;background:none;border:none;cursor:pointer;">✕</button>
        <h3 style="color:white;margin-top:0;margin-bottom:25px;text-align:center;font-size:1.4rem;font-weight:600;">Opciones de Reproducción</h3>
        ${buttonsHtml}
      </div>
    </div>
  `;
  // Eliminar modal anterior si existe en el DOM
  document.querySelectorAll('.modal-servers').forEach(m => m.remove());
  document.body.insertAdjacentHTML('beforeend', modalHtml);
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
