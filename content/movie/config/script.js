
fetch('../../../config/nav-menu/bottom-nav.html')
  .then(res => res.text())
  .then(html => {
    const div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstElementChild);
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

// Variable global para la base de videos
let videoDatabase = null;

// ====================== CARGAR BASE DE VIDEOS ======================
async function loadVideoDatabase() {
  if (videoDatabase) return videoDatabase;
  try {
    const res = await fetch(VIDEO_JSON_URL);
    videoDatabase = await res.json();
    console.log(`✅ Base de videos cargada (${Object.keys(videoDatabase).length} títulos)`);
    return videoDatabase;
  } catch (e) {
    console.error("❌ Error al cargar list-movie.JSON", e);
    return {};
  }
}

// ====================== DATOS PRINCIPALES TMDB ======================
fetch(`${BASE}/${type}/${id}?api_key=${API_KEY}&language=es-ES&append_to_response=images`)
  .then(r => r.json())
  .then(d => {
    // Hero
    if (d.backdrop_path) {
      document.querySelector(".hero").style.backgroundImage = `url(${IMG}${d.backdrop_path})`;
    }

    // Logo
    const logos = d.images?.logos || [];
    let logoUrl = logos.length
      ? IMG + (logos.find(l => l.iso_639_1 === 'es') || logos[0]).file_path
      : (d.poster_path ? IMG + d.poster_path : '');
    if (logoUrl) document.querySelector(".logo-title").src = logoUrl;

    document.querySelector(".available").textContent = `Disponible: ${d.release_date || d.first_air_date || "Próximamente"}`;
    document.querySelector(".meta").innerHTML = `⭐ ${d.vote_average ? d.vote_average.toFixed(1) : "N/A"}`;
    document.getElementById("descripcion-texto").textContent = d.overview || "Sin sinopsis disponible.";

    // Guardar título para el reproductor
    window.currentTitle = d.title || d.name || "Reproduciendo";

    // Detalles
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

// ====================== TRÁILERES ======================
fetch(`${BASE}/${type}/${id}/videos?api_key=${API_KEY}&language=es-ES`)
  .then(r => r.json())
  .then(d => {
    const container = document.getElementById("trailers-row");
    const trailer = d.results.find(v => v.site === "YouTube");
    if (trailer) {
      container.innerHTML = `
        <div class="trailer" data-key="${trailer.key}">
          <img src="https://img.youtube.com/vi/${trailer.key}/hqdefault.jpg">
          <div class="trailer-title">${trailer.name}</div>
        </div>`;
      container.querySelector('.trailer').addEventListener('click', () => {
        document.getElementById('youtube-player').src = `https://www.youtube.com/embed/${trailer.key}?autoplay=1`;
        document.getElementById('video-modal').style.display = 'flex';
      });
    }
  });

// ====================== REPARTO ======================
fetch(`${BASE}/${type}/${id}/credits?api_key=${API_KEY}`)
  .then(r => r.json())
  .then(d => {
    const container = document.getElementById("cast-row");
    d.cast.slice(0,10).forEach(a => {
      container.innerHTML += `
        <div class="trailer">
          <img src="${a.profile_path ? IMG + a.profile_path : 'https://via.placeholder.com/260x390/222/fff?text=Sin+foto'}">
          <div class="trailer-title">${a.name}</div>
        </div>`;
    });
  });

// ====================== IMÁGENES RELACIONADAS ======================
fetch(`${BASE}/${type}/${id}/images?api_key=${API_KEY}`)
  .then(r => r.json())
  .then(d => {
    const container = document.getElementById("images-row");
    d.backdrops.slice(0,8).forEach(i => {
      container.innerHTML += `<div class="trailer"><img src="${IMG}${i.file_path}"></div>`;
    });
  });

// ====================== BOTÓN REPRODUCIR (NUEVA LÓGICA) ======================
document.querySelector('.play-btn').addEventListener('click', async () => {
  const db = await loadVideoDatabase();
  const entry = db[id] || db[id.toString()];

  if (!entry || !entry.enlace) {
    alert("🎬 Este título aún no está disponible en nuestra biblioteca.");
    return;
  }

  const enlace = entry.enlace.trim();
  const modal = document.getElementById('movie-modal');
  const container = document.getElementById('movie-player-container');
  const titleHeader = document.getElementById('movie-title-header');

  titleHeader.textContent = window.currentTitle || "Reproduciendo";
  container.innerHTML = '';

  // Obtener poster (prioridad logo > backdrop)
  const posterImg = document.querySelector('.logo-title').src || 
                    document.querySelector('.hero').style.backgroundImage.replace(/^url\(["']?/, '').replace(/["']?\)$/, '') ||
                    "https://image.tmdb.org/t/p/original/puJKgNcWaGgMk5VHanSSomUTpmw.jpg";

  const titleEncoded = encodeURIComponent(window.currentTitle || "Reproduciendo");

  // === DETECCIÓN DE TIPO ===
  if (enlace.includes('drive.google') || /^[a-zA-Z0-9_-]{20,}$/.test(enlace)) {
    // Google Drive
    const driveId = enlace.includes('id=') ? enlace.split('id=')[1] : enlace;
    const playerUrl = `https://lzrdrz10.github.io/player/?player=jwpl&provider=gdrive&format=video%2Fmp4&link=${encodeURIComponent(driveId)}`;
    
    container.innerHTML = `<iframe src="${playerUrl}" frameborder="0" allowfullscreen allow="autoplay" style="width:100%;height:100%;"></iframe>`;

  } else {
    // MP4 o M3U8 → Premium Player
    const videoEncoded = encodeURIComponent(enlace);
    const posterEncoded = encodeURIComponent(posterImg);

    const playerUrl = `https://lzrdrz10.github.io/premiumplayer/player.html?video=${videoEncoded}&poster=${posterEncoded}&title=${titleEncoded}`;

    container.innerHTML = `
      <iframe src="${playerUrl}" 
              frameborder="0" 
              allowfullscreen 
              allow="autoplay; encrypted-media" 
              style="width:100%; height:100%; border:none;">
      </iframe>`;
  }

  modal.style.display = 'flex';
});

// ====================== SCROLL + MODALES ======================
const overlay = document.querySelector('.scroll-overlay');
window.addEventListener('scroll', () => {
  overlay.style.opacity = Math.min(window.scrollY / 420, 0.82);
});

// Modal YouTube (mantener original)
const youtubeModal = document.getElementById('video-modal');
const youtubeClose = document.getElementById('modal-close');
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

// Modal Reproductor Principal
const movieModal = document.getElementById('movie-modal');
const movieClose = document.getElementById('movie-modal-close');

movieClose.addEventListener('click', () => {
  movieModal.style.display = 'none';
  document.getElementById('movie-player-container').innerHTML = '';
});

movieModal.addEventListener('click', e => {
  if (e.target === movieModal) {
    movieModal.style.display = 'none';
    document.getElementById('movie-player-container').innerHTML = '';
  }
});

// Fullscreen botón
document.getElementById('movie-fullscreen-btn').addEventListener('click', () => {
  const elem = document.getElementById('movie-modal');
  if (elem.requestFullscreen) elem.requestFullscreen();
  else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
});
