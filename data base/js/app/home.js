// =============================================
// HOME.JS - Lógica de la página de inicio + Vistas con Firebase
// =============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-analytics.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  increment, 
  serverTimestamp 
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
const analytics = getAnalytics(app);
const db = getFirestore(app);

// ================== FUNCIONES DE GITHUB ==================
async function getAllMovieIds() {
  try {
    const res = await fetch('https://api.github.com/repos/thexxx880/apple/contents/data%20base/data/movie');
    if (!res.ok) throw new Error('Error al obtener lista de películas');
    const items = await res.json();
    return items.filter(item => item.type === 'dir').map(item => item.name);
  } catch (error) {
    console.error("Error obteniendo IDs de películas:", error);
    return [];
  }
}

async function fetchMovieById(id) {
  try {
    const url = `https://raw.githubusercontent.com/thexxx880/apple/main/data%20base/data/movie/${id}/${id}.json`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();

    // Normalización de campos
    data.id = data.id_tmdb || id;
    data.anio = data.año || data.anio || "----";
    data.calificacion = data.puntuacion || data.calificacion || "N/A";
    return data;
  } catch (error) {
    console.error(`Error cargando película ${id}:`, error);
    return null;
  }
}

// ================== FUNCIONES DE VISTAS (FIRESTORE) ==================
async function incrementMovieViews(movieId) {
  try {
    const ref = doc(db, "movieViews", movieId);
    await setDoc(ref, {
      views: increment(1),
      lastViewed: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error("Error al incrementar vistas:", error);
  }
}

async function getMovieViewsMap() {
  try {
    const snapshot = await getDocs(collection(db, "movieViews"));
    const map = {};
    snapshot.forEach(docSnap => {
      map[docSnap.id] = docSnap.data().views || 0;
    });
    return map;
  } catch (error) {
    console.error("Error obteniendo mapa de vistas:", error);
    return {};
  }
}

// ================== CARGAR HÉROE ==================
async function loadRandomHero() {
  const heroSection = document.getElementById("hero");
  const heroLogo = document.getElementById("hero-logo");
  const heroDesc = document.getElementById("hero-description");
  const heroRating = document.getElementById("hero-rating");
  const heroYear = document.getElementById("hero-year");
  const heroPlayBtn = document.getElementById("hero-play-btn");

  try {
    const ids = await getAllMovieIds();
    if (ids.length === 0) return;

    const randomId = ids[Math.floor(Math.random() * ids.length)];
    const data = await fetchMovieById(randomId);
    if (!data) return;

    if (data.backdrop) heroSection.style.backgroundImage = `url('${data.backdrop}')`;
    if (data.logo && heroLogo) heroLogo.src = data.logo;
    if (heroYear) heroYear.textContent = data.anio;
    if (heroRating) heroRating.innerHTML = `⭐ ${data.calificacion}`;

    if (heroDesc) {
      let sinopsis = data.sinopsis || "";
      if (sinopsis.length > 220) sinopsis = sinopsis.substring(0, 220) + "...";
      heroDesc.textContent = sinopsis;
    }

    if (heroPlayBtn && data.id) {
      heroPlayBtn.onclick = (e) => {
        e.preventDefault();
        window.location.href = `contenido.html?id=${data.id}`;
      };
    }
  } catch (error) {
    console.error("Error cargando héroe:", error);
  }
}

// ================== CARGAR PELÍCULAS ORDENADAS POR VISTAS ==================
async function loadMoviesSection() {
  const container = document.getElementById("movies-grid");
  if (!container) return;

  container.innerHTML = `<p style="color:#888; padding: 40px 20px; font-size: 0.95rem;">Cargando películas más vistas...</p>`;

  try {
    const ids = await getAllMovieIds();
    if (ids.length === 0) {
      container.innerHTML = `<p style="color:#ff6b6b; padding: 30px 20px;">No se encontraron películas.</p>`;
      return;
    }

    const viewsMap = await getMovieViewsMap();
    const movies = [];

    for (const id of ids) {
      const movie = await fetchMovieById(id);
      if (movie) {
        movie.views = viewsMap[id] || 0;
        movies.push(movie);
      }
    }

    if (movies.length === 0) {
      container.innerHTML = `<p style="color:#ff6b6b; padding: 30px 20px;">No se encontraron películas.</p>`;
      return;
    }

    // 🔥 ORDENAR DE MAYOR A MENOR VISTAS
    movies.sort((a, b) => (b.views || 0) - (a.views || 0));

    // Tomar las 10 más vistas
    const topMovies = movies.slice(0, 10);

    container.innerHTML = "";

    topMovies.forEach(movie => {
      const card = document.createElement("div");
      card.className = "movie-card";

      const ratingHTML = window.createRatingCircle 
        ? window.createRatingCircle(movie.calificacion || 0)
        : `<span>${movie.calificacion || 0}</span>`;

      card.innerHTML = `
        <img src="${movie.poster || 'assets/posters/placeholder.jpg'}" alt="${movie.titulo}">
        <div class="movie-rating">${ratingHTML}</div>
        <div class="movie-overlay"></div>
        ${movie.views > 0 ? `<div class="view-count">${movie.views.toLocaleString()} vistas</div>` : ''}
      `;

      // Incrementar vistas + redirigir
      card.addEventListener("click", () => {
        incrementMovieViews(movie.id);
        window.location.href = `contenido.html?id=${movie.id}`;
      });

      container.appendChild(card);
    });

  } catch (error) {
    console.error("Error cargando sección de películas:", error);
    container.innerHTML = `<p style="color:#ff6b6b; padding: 30px 20px;">❌ Error al cargar las películas.</p>`;
  }
}

// ================== INICIO DE LA PÁGINA ==================
document.addEventListener("DOMContentLoaded", async () => {
  // Iniciar loader si existe
  if (typeof initLoader === "function") {
    initLoader();
  }

  // Cargar contenido
  await Promise.all([
    loadRandomHero(),
    loadMoviesSection()
  ]);

  // Ocultar loader
  if (typeof hideLoader === "function") {
    hideLoader();
  } else {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'none';
  }

  console.log("✅ home.js cargado correctamente - Películas ordenadas por vistas");
});
