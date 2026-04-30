// ====================== CARGAR MENÚ EXTERNO ======================
fetch('../../../config/nav-menu/bottom-nav.html')
  .then(res => res.text())
  .then(html => {
    const div = document.createElement('div');
    div.innerHTML = html;
    if (div.firstElementChild) document.body.appendChild(div.firstElementChild);
  })
  .catch(() => console.warn('Menú inferior no cargado'));

// ====================== CONFIGURACIÓN ======================
const API_KEY = "38e497c6c1a043d1341416e80915669f";
const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p/original";
const VIDEO_JSON_URL = "https://raw.githubusercontent.com/thexxx880/API/main/content/API/JSON/list-movie.JSON";

const params = new URLSearchParams(location.search);
const id = params.get("id") || "11224";
const type = params.get("type") || "movie";

let videoDatabase = null;

async function loadVideoDatabase() {
  if (videoDatabase) return videoDatabase;
  try {
    const res = await fetch(VIDEO_JSON_URL);
    videoDatabase = await res.json();
    return videoDatabase;
  } catch (e) {
    console.error("❌ Error JSON", e);
    return {};
  }
}

// ====================== DATOS TMDB ======================
fetch(`${BASE}/${type}/${id}?api_key=${API_KEY}&language=es-ES&append_to_response=images`)
  .then(r => r.json())
  .then(d => {
    if (d.backdrop_path) document.querySelector(".hero").style.backgroundImage = `url(${IMG}${d.backdrop_path})`;

    const logos = d.images?.logos || [];
    let logoUrl = logos.length
      ? IMG + (logos.find(l => l.iso_639_1 === 'es') || logos[0]).file_path
      : (d.poster_path ? IMG + d.poster_path : '');
    if (logoUrl) document.querySelector(".logo-title").src = logoUrl;

    document.querySelector(".available").textContent = `Disponible: ${d.release_date || d.first_air_date || "Próximamente"}`;
    document.querySelector(".meta").innerHTML = `⭐ ${d.vote_average ? d.vote_average.toFixed(1) : "N/A"}`;
    document.getElementById("descripcion-texto").textContent = d.overview || "Sin sinopsis disponible.";

    window.currentTitle = d.title || d.name || "Reproduciendo";
  });

// ====================== TRÁILERES, REPARTO, IMÁGENES ======================
fetch(`${BASE}/${type}/${id}/videos?api_key=${API_KEY}&language=es-ES`).then(r => r.json()).then(d => {
  const container = document.getElementById("trailers-row");
  if (!container) return;
  const trailer = d.results.find(v => v.site === "YouTube");
  if (trailer) {
    container.innerHTML = `<div class="trailer" data-key="${trailer.key}"><img src="https://img.youtube.com/vi/${trailer.key}/hqdefault.jpg"><div class="trailer-title">${trailer.name}</div></div>`;
    container.querySelector('.trailer').addEventListener('click', () => {
      document.getElementById('youtube-player').src = `https://www.youtube.com/embed/${trailer.key}?autoplay=1`;
      document.getElementById('video-modal').style.display = 'flex';
    });
  }
});

fetch(`${BASE}/${type}/${id}/credits?api_key=${API_KEY}`).then(r => r.json()).then(d => {
  const container = document.getElementById("cast-row");
  if (!container) return;
  container.innerHTML = '';
  d.cast.slice(0,10).forEach(a => {
    container.innerHTML += `<div class="trailer"><img src="${a.profile_path ? IMG + a.profile_path : 'https://via.placeholder.com/260x390/222/fff?text=Sin+foto'}"><div class="trailer-title">${a.name}</div></div>`;
  });
});

fetch(`${BASE}/${type}/${id}/images?api_key=${API_KEY}`).then(r => r.json()).then(d => {
  const container = document.getElementById("images-row");
  if (!container) return;
  container.innerHTML = '';
  d.backdrops.slice(0,8).forEach(i => {
    container.innerHTML += `<div class="trailer"><img src="${IMG}${i.file_path}"></div>`;
  });
});

// ====================== BOTÓN REPRODUCIR → NUEVA VENTANA ======================
document.querySelector('.play-btn').addEventListener('click', async () => {
  const db = await loadVideoDatabase();
  const entry = db[id] || db[id.toString()];

  if (!entry || !entry.enlace) {
    alert("🎬 Este título aún no está disponible en nuestra biblioteca.");
    return;
  }

  const enlace = entry.enlace.trim();
  let playerUrl = '';

  if (enlace.includes('drive.google') || /^[a-zA-Z0-9_-]{20,}$/.test(enlace)) {
    const driveId = enlace.includes('id=') ? enlace.split('id=')[1] : enlace;
    playerUrl = `https://lzrdrz10.github.io/player/?player=jwpl&provider=gdrive&format=video%2Fmp4&link=${encodeURIComponent(driveId)}`;
  } else {
    const posterImg = document.querySelector('.logo-title')?.src || 
                      document.querySelector('.hero')?.style.backgroundImage.replace(/^url\(["']?/, '').replace(/["']?\)$/, '') || "";
    const titleEncoded = encodeURIComponent(window.currentTitle || "Reproduciendo");
    const videoEncoded = encodeURIComponent(enlace);
    const posterEncoded = encodeURIComponent(posterImg);
    playerUrl = `https://lzrdrz10.github.io/premiumplayer/player.html?video=${videoEncoded}&poster=${posterEncoded}&title=${titleEncoded}`;
  }

  // Abrir en nueva ventana
  const newWindow = window.open(
    playerUrl, 
    '_blank', 
    'width=1280,height=720,fullscreen=yes,scrollbars=no,status=no'
  );

  if (newWindow) {
    // Intentar poner la nueva ventana en fullscreen
    setTimeout(() => {
      try {
        if (newWindow.document.fullscreenEnabled) {
          newWindow.document.documentElement.requestFullscreen();
        }
      } catch (e) {
        console.log("No se pudo entrar en fullscreen automático");
      }
    }, 1500);
  } else {
    alert("⚠️ Bloqueador de ventanas emergentes activado.\nPor favor permite ventanas emergentes para este sitio.");
  }
});

// ====================== SCROLL + MODAL YOUTUBE ======================
const overlay = document.querySelector('.scroll-overlay');
if (overlay) {
  window.addEventListener('scroll', () => {
    overlay.style.opacity = Math.min(window.scrollY / 420, 0.82);
  });
}

const youtubeModal = document.getElementById('video-modal');
const youtubeClose = document.getElementById('modal-close');
if (youtubeClose && youtubeModal) {
  youtubeClose.addEventListener('click', () => {
    youtubeModal.style.display = 'none';
    document.getElementById('youtube-player').src = '';
  });
  youtubeModal.addEventListener('click', e => {
    if (e.target === youtubeModal) {
      youtubeModal.style.display = 'none';
      document.getElementById('youtube-player').src = '';
    }
  });
}
