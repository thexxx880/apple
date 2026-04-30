// ====================== CARGAR MENÚ EXTERNO ======================
fetch('../../../config/nav-menu/bottom-nav.html')
  .then(res => {
    if (!res.ok) throw new Error('404');
    return res.text();
  })
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

// ====================== CARGAR BASE DE VIDEOS ======================
async function loadVideoDatabase() {
  if (videoDatabase) return videoDatabase;
  try {
    const res = await fetch(VIDEO_JSON_URL);
    if (!res.ok) throw new Error('JSON no encontrado');
    videoDatabase = await res.json();
    console.log(`✅ Base de videos cargada (${Object.keys(videoDatabase).length} títulos)`);
    return videoDatabase;
  } catch (e) {
    console.error("❌ Error al cargar list-movie.JSON", e);
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

    const genres = d.genres ? d.genres.map(g => g.name).join(', ') : '—';
    const languages = d.spoken_languages ? d.spoken_languages.map(l => l.english_name).join(', ') : '—';
    const companies = d.production_companies ? d.production_companies.map(c => c.name).join(', ') : '—';
    const countries = d.production_countries ? d.production_countries.map(c => c.name).join(', ') : '—';

    const detailsHTML = `
      <div class="detail-item"><strong>Título original</strong><span>${d.original_title || d.original_name || '—'}</span></div>
      <div class="detail-item"><strong>Fecha de estreno</strong><span>${d.release_date || d.first_air_date || '—'}</span></div>
      <div class="detail-item"><strong>Géneros</strong><span>${genres}</span></div>
      <div class="detail-item"><strong>Duración</strong><span>${d.runtime ? d.runtime + ' minutos' : (d.number_of_seasons ? d.number_of_seasons + ' temporadas' : '—')}</span></div>
      <div class="detail-item"><strong>Idioma original</strong><span>${d.original_language ? d.original_language.toUpperCase() : '—'}</span></div>
      <div class="detail-item"><strong>Idiomas hablados</strong><span>${languages}</span></div>
      <div class="detail-item"><strong>Países de producción</strong><span>${countries}</span></div>
      <div class="detail-item"><strong>Compañías productoras</strong><span>${companies}</span></div>
      <div class="detail-item"><strong>Estado</strong><span>${d.status || '—'}</span></div>
      <div class="detail-item"><strong>Popularidad</strong><span>${d.popularity ? d.popularity.toFixed(1) : '—'}</span></div>
      ${d.budget ? `<div class="detail-item"><strong>Presupuesto</strong><span>$${d.budget.toLocaleString('es-ES')}</span></div>` : ''}
      ${d.revenue ? `<div class="detail-item"><strong>Recaudación</strong><span>$${d.revenue.toLocaleString('es-ES')}</span></div>` : ''}
    `;
    document.getElementById("details-container").innerHTML = detailsHTML;
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

// ====================== BOTÓN REPRODUCIR + LOADER + FULLSCREEN AUTO ======================
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

  // Contenedor Fullscreen
  const fs = document.createElement('div');
  fs.id = 'fullscreen-video';
  fs.style.cssText = `position:fixed; top:0; left:0; width:100vw; height:100vh; background:#000; z-index:99999; margin:0; padding:0; overflow:hidden;`;

  // Loader
  fs.innerHTML = `
    <div style="text-align:center; color:white; margin-top:20%;">
      <div style="border:6px solid rgba(255,255,255,0.2); border-top:6px solid #C9A84C; border-radius:50%; width:60px; height:60px; animation:spin 1s linear infinite; margin:0 auto 25px;"></div>
      <h2>Cargando video...</h2>
      <p style="opacity:0.7;">Espera un momento</p>
    </div>
    <style>@keyframes spin{to{transform:rotate(360deg);}}</style>
  `;

  document.body.appendChild(fs);

  // Después de 5 segundos cargar el iframe
  setTimeout(() => {
    fs.innerHTML = `
      <iframe id="main-player-iframe" 
              src="${playerUrl}" 
              frameborder="0" 
              allowfullscreen 
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              style="width:100%; height:100%; border:none; display:block;">
      </iframe>
    `;

    const iframe = document.getElementById('main-player-iframe');

    // Intentar fullscreen automático del iframe
    iframe.onload = () => {
      try {
        if (iframe.requestFullscreen) {
          iframe.requestFullscreen();
        } else if (iframe.webkitRequestFullscreen) {
          iframe.webkitRequestFullscreen();
        } else if (iframe.msRequestFullscreen) {
          iframe.msRequestFullscreen();
        }
      } catch (e) {
        console.log("Fullscreen automático no disponible en este navegador");
      }
    };

  }, 5000);

  // Cerrar con ESC
  const closeFS = () => fs.remove();
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) closeFS();
  });
  document.addEventListener('keydown', function handler(e) {
    if (e.key === "Escape") {
      closeFS();
      document.removeEventListener('keydown', handler);
    }
  });
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
