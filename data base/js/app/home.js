// =============================================
// HOME.JS - Página de inicio + Top vistas Firebase
// =============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-analytics.js";
import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// ================== CONFIGURACIÓN FIREBASE ==================
const firebaseConfig = {
  apiKey: "AIzaSyDb1vEGCkNpcarttuwLLvuB40g8reRFTGM",
  authDomain: "applelz-b5883.firebaseapp.com",
  projectId: "applelz-b5883",
  storageBucket: "applelz-b5883.firebasestorage.app",
  messagingSenderId: "489468218632",
  appId: "1:489468218632:web:598a550f7ebe7c6de7b0bd",
  measurementId: "G-J085DHR8M3"
};

const app = initializeApp(firebaseConfig);
getAnalytics(app);
const db = getFirestore(app);

// =============================================
// OBTENER IDS DE PELÍCULAS DESDE GITHUB
// =============================================
async function getAllMovieIds() {
  try {
    const res = await fetch(
      "https://api.github.com/repos/thexxx880/apple/contents/data%20base/data/movie"
    );

    if (!res.ok) {
      throw new Error("No se pudo obtener la lista de películas");
    }

    const items = await res.json();

    return items
      .filter(item => item.type === "dir")
      .map(item => item.name);

  } catch (error) {
    console.error(
      "Error obteniendo lista de películas:",
      error
    );

    return [];
  }
}

// =============================================
// CARGAR PELÍCULA POR ID
// =============================================
async function fetchMovieById(id) {
  try {
    const url = `https://raw.githubusercontent.com/thexxx880/apple/main/data%20base/data/movie/${id}/${id}.json`;

    const res = await fetch(url);

    if (!res.ok) {
      console.warn(`No existe JSON: ${id}`);
      return null;
    }

    const data = await res.json();

    // IMPORTANTE:
    // ID del documento Firestore
    data.folderId = id;

    // ID TMDB
    data.id = data.id_tmdb || id;

    data.anio =
      data.año ||
      data.anio ||
      "----";

    data.calificacion =
      data.puntuacion ||
      data.calificacion ||
      "N/A";

    return data;

  } catch (error) {
    console.error(
      `Error cargando película ${id}:`,
      error
    );

    return null;
  }
}

// =============================================
// OBTENER MAPA DE VISTAS DESDE FIRESTORE
// colección: contenidos
// campo: vistas
// =============================================
async function getMovieViewsMap() {
  try {
    const snapshot = await getDocs(
      collection(db, "contenidos")
    );

    const map = {};

    snapshot.forEach(docSnap => {
      const data = docSnap.data();

      map[docSnap.id] =
        data.vistas || 0;
    });

    console.log(
      "🔥 MAPA DE VISTAS:",
      map
    );

    return map;

  } catch (error) {
    console.error(
      "Error obteniendo vistas:",
      error
    );

    return {};
  }
}

// =============================================
// HERO ALEATORIO
// =============================================
async function loadRandomHero() {
  const heroSection =
    document.getElementById("hero");

  const heroLogo =
    document.getElementById("hero-logo");

  const heroDesc =
    document.getElementById("hero-description");

  const heroRating =
    document.getElementById("hero-rating");

  const heroYear =
    document.getElementById("hero-year");

  const heroPlayBtn =
    document.getElementById("hero-play-btn");

  try {
    const ids = await getAllMovieIds();

    if (ids.length === 0) return;

    const randomId =
      ids[Math.floor(Math.random() * ids.length)];

    const data =
      await fetchMovieById(randomId);

    if (!data) return;

    if (data.backdrop) {
      heroSection.style.backgroundImage =
        `url('${data.backdrop}')`;
    }

    if (data.logo && heroLogo) {
      heroLogo.src = data.logo;
    }

    if (heroYear) {
      heroYear.textContent =
        data.anio;
    }

    if (heroRating) {
      heroRating.innerHTML =
        `⭐ ${data.calificacion}`;
    }

    if (heroDesc) {
      let sinopsis =
        data.sinopsis || "";

      if (sinopsis.length > 220) {
        sinopsis =
          sinopsis.substring(0, 220) +
          "...";
      }

      heroDesc.textContent =
        sinopsis;
    }

    if (heroPlayBtn && data.id) {
      heroPlayBtn.onclick = (e) => {
        e.preventDefault();

        window.location.href =
          `contenido.html?id=${data.id}`;
      };
    }

  } catch (error) {
    console.error(
      "Error cargando héroe:",
      error
    );
  }
}

// =============================================
// TOP PELÍCULAS MÁS VISTAS
// =============================================
async function loadMoviesSection() {
  const container =
    document.getElementById(
      "movies-grid"
    );

  if (!container) return;

  container.innerHTML = `
    <p style="
      color:#888;
      padding:40px 20px;
      font-size:.95rem;
    ">
      Cargando películas...
    </p>
  `;

  try {
    // 1. IDs de GitHub
    const ids =
      await getAllMovieIds();

    if (!ids.length) {
      container.innerHTML =
        `<p>No se encontraron películas.</p>`;
      return;
    }

    // 2. Cargar películas
    const movies =
      await Promise.all(
        ids.map(id =>
          fetchMovieById(id)
        )
      );

    const validMovies =
      movies.filter(Boolean);

    // 3. Obtener vistas
    const viewsMap =
      await getMovieViewsMap();

    // 4. Combinar vistas
    const moviesWithViews =
      validMovies.map(movie => ({
        ...movie,

        // USA EL ID DEL DOCUMENTO
        views:
          viewsMap[
            movie.folderId
          ] || 0
      }));

    // DEBUG
    console.table(
      moviesWithViews.map(m => ({
        titulo: m.titulo,
        id: m.folderId,
        vistas: m.views
      }))
    );

    // 5. Ordenar por más vistas
    moviesWithViews.sort(
      (a, b) =>
        b.views - a.views
    );

    // 6. Top 10
    const topMovies =
      moviesWithViews.slice(
        0,
        10
      );

    container.innerHTML = "";

    // 7. Renderizar cards
    topMovies.forEach(movie => {
      const card =
        document.createElement(
          "div"
        );

      card.className =
        "movie-card";

      const ratingHTML =
        window.createRatingCircle
          ? window.createRatingCircle(
              movie.calificacion || 0
            )
          : `<span>${movie.calificacion || 0}</span>`;

      card.innerHTML = `
        <img
          src="${
            movie.poster ||
            "assets/posters/placeholder.jpg"
          }"
          alt="${movie.titulo}"
        >

        <div class="movie-rating">
          ${ratingHTML}
        </div>

        <div class="movie-overlay"></div>
      `;

      card.addEventListener(
        "click",
        () => {
          window.location.href =
            `contenido.html?id=${movie.id}`;
        }
      );

      container.appendChild(card);
    });

    console.log(
      "🔥 TOP PELÍCULAS:",
      topMovies
    );

  } catch (error) {
    console.error(
      "Error cargando películas:",
      error
    );

    container.innerHTML = `
      <p style="
        color:#ff6b6b;
        padding:30px 20px;
      ">
        ❌ Error al cargar películas
      </p>
    `;
  }
}

// =============================================
// INICIO DE LA PÁGINA
// =============================================
document.addEventListener(
  "DOMContentLoaded",
  async () => {

    if (
      typeof initLoader ===
      "function"
    ) {
      initLoader();
    }

    await Promise.all([
      loadRandomHero(),
      loadMoviesSection()
    ]);

    if (
      typeof hideLoader ===
      "function"
    ) {
      hideLoader();
    } else {
      const loader =
        document.getElementById(
          "loader"
        );

      if (loader) {
        loader.style.display =
          "none";
      }
    }

    console.log(
      "✅ Home cargado correctamente"
    );
  }
);
