// =============================================
// API - Funciones para obtener datos
// =============================================

const API_BASE = "https://raw.githubusercontent.com/thexxx880/apple/main/";

async function fetchRandomHero() {
    try {
        const apiUrl = "https://api.github.com/repos/thexxx880/apple/contents/movie";
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("No se pudo obtener la lista de películas");
        
        const files = await response.json();
        const jsonFiles = files.filter(f => f.name.endsWith(".json")).slice(0, 10);
        
        if (jsonFiles.length === 0) throw new Error("No hay archivos JSON disponibles");
        
        const randomFile = jsonFiles[Math.floor(Math.random() * jsonFiles.length)];
        const movieId = randomFile.name.replace(".json", "");
        
        const rawUrl = `${API_BASE}movie/${movieId}.json`;
        const content = await fetch(rawUrl);
        if (!content.ok) throw new Error("Error al cargar detalles de la película");
        
        return await content.json();
    } catch (error) {
        console.error("Error en fetchRandomHero:", error);
        return null;
    }
}

async function fetchMovies(limit = 10) {
    try {
        const url = `${API_BASE}movie.json`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        
        const data = await response.json();
        
        if (!data.movies || !Array.isArray(data.movies)) {
            throw new Error("Estructura del JSON inválida.");
        }
        
        return data.movies.slice(0, limit);
    } catch (error) {
        console.error("Error en fetchMovies:", error);
        return [];
    }
}

window.fetchRandomHero = fetchRandomHero;
window.fetchMovies = fetchMovies;