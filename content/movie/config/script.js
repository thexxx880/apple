  // ====================== CARGAR MENÚ EXTERNO ======================
  fetch('../../../config/nav-menu/bottom-nav.html')
    .then(res => res.text())
    .then(html => {
      const div = document.createElement('div');
      div.innerHTML = html;
      document.body.appendChild(div.firstElementChild);
    })
    .catch(() => console.warn('Menú inferior no cargado'));

  // ====================== CONFIGURACIÓN TMDB ======================
  const API_KEY = "38e497c6c1a043d1341416e80915669f";
  const BASE = "https://api.themoviedb.org/3";
  const IMG = "https://image.tmdb.org/t/p/original";

  const params = new URLSearchParams(location.search);
  const id = params.get("id") || "11224";
  const type = params.get("type") || "movie";

  // ====================== DATOS PRINCIPALES ======================
  fetch(`${BASE}/${type}/${id}?api_key=${API_KEY}&language=es-ES&append_to_response=images`)
    .then(r => r.json())
    .then(d => {
      // Hero
      if (d.backdrop_path) document.querySelector(".hero").style.backgroundImage = `url(${IMG}${d.backdrop_path})`;

      // Logo oficial (prioridad español)
      const logos = d.images?.logos || [];
      let logoUrl = logos.length 
        ? IMG + (logos.find(l => l.iso_639_1 === 'es') || logos[0]).file_path 
        : (d.poster_path ? IMG + d.poster_path : '');
      if (logoUrl) document.querySelector(".logo-title").src = logoUrl;

      document.querySelector(".available").textContent = `Disponible: ${d.release_date || d.first_air_date || "Próximamente"}`;
      document.querySelector(".meta").innerHTML = `⭐ ${d.vote_average ? d.vote_average.toFixed(1) : "N/A"}`;

      document.getElementById("descripcion-texto").textContent = d.overview || "Sin sinopsis disponible.";

      // ====================== DETALLES (fondo gris) ======================
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

  // ====================== TRÁILER (solo 1 + modal) ======================
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

  // ====================== SCROLL + MODAL ======================
  const overlay = document.querySelector('.scroll-overlay');
  window.addEventListener('scroll', () => {
    overlay.style.opacity = Math.min(window.scrollY / 420, 0.82);
  });

  const modal = document.getElementById('video-modal');
  const closeBtn = document.getElementById('modal-close');
  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    document.getElementById('youtube-player').src = '';
  });
  modal.addEventListener('click', e => {
    if (e.target === modal) {
      modal.style.display = 'none';
      document.getElementById('youtube-player').src = '';
    }
  });
