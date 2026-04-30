// ====================== CARGAR MENÚ EXTERNO ======================
fetch('../../../config/nav-menu/bottom-nav.html')
  .then(res => res.text())
  .then(html => {
    const div = document.createElement('div');
    div.innerHTML = html;
    if (div.firstElementChild) document.body.appendChild(div.firstElementChild);
  })
  .catch(() => console.warn('Menú inferior no encontrado'));

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
    console.error("Error cargando JSON", e);
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

// ====================== BOTÓN REPRODUCIR (VERSIÓN ESTABLE) ======================
document.querySelector('.play-btn').addEventListener('click', async () => {
  const db = await loadVideoDatabase();
  const entry = db[id] || db[id.toString()];

  if (!entry || !entry.enlace) {
    alert("🎬 Este título aún no está disponible.");
    return;
  }

  const enlace = entry.enlace.trim();
  let playerUrl = '';

  if (enlace.includes('drive.google') || /^[a-zA-Z0-9_-]{20,}$/.test(enlace)) {
    const driveId = enlace.includes('id=') ? enlace.split('id=')[1] : enlace;
    playerUrl = `https://lzrdrz10.github.io/player/?player=jwpl&provider=gdrive&format=video%2Fmp4&link=${encodeURIComponent(driveId)}`;
  } else {
    const poster = document.querySelector('.logo-title')?.src || 
                   document.querySelector('.hero')?.style.backgroundImage.replace(/^url\(["']?/, '').replace(/["']?\)$/, '') || "";
    playerUrl = `https://lzrdrz10.github.io/premiumplayer/player.html?video=${encodeURIComponent(enlace)}&poster=${encodeURIComponent(poster)}&title=${encodeURIComponent(window.currentTitle || "Reproduciendo")}`;
  }

  // Contenedor Fullscreen
  const fs = document.createElement('div');
  fs.id = 'fullscreen-video';
  fs.style.cssText = `position:fixed; top:0; left:0; width:100vw; height:100vh; background:#000; z-index:99999; overflow:hidden;`;

  // Loader
  fs.innerHTML = `
    <div style="text-align:center; color:white; margin-top:30%;">
      <div style="border:6px solid rgba(255,255,255,0.2); border-top:6px solid #C9A84C; border-radius:50%; width:60px; height:60px; animation:spin 1s linear infinite; margin:0 auto 20px;"></div>
      <h2>Cargando video...</h2>
      <p style="opacity:0.8; margin-top:10px;">Rota tu dispositivo a horizontal</p>
    </div>
    <style>@keyframes spin{to{transform:rotate(360deg);}}</style>
  `;

  document.body.appendChild(fs);

  // Cargar video después de 5 segundos
  setTimeout(() => {
    fs.innerHTML = `
      <iframe id="main-player-iframe" 
              src="${playerUrl}" 
              frameborder="0" 
              allowfullscreen 
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              style="width:100%; height:100%; border:none;">
      </iframe>
    `;

    const iframe = document.getElementById('main-player-iframe');

    iframe.onload = () => {
      // Fullscreen del contenedor
      if (fs.requestFullscreen) fs.requestFullscreen();
      else if (fs.webkitRequestFullscreen) fs.webkitRequestFullscreen();
    };
  }, 5000);

  // Cerrar con ESC
  const closeFS = () => fs.remove();
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) closeFS();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === "Escape") closeFS();
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
}
