// =============== SEGUIR VIENDO (desde Mi Lista) ===============

let currentUser = null;

async function loadContinueWatching() {
    const container = document.getElementById("continueGrid");
    if (!container) return;

    container.innerHTML = `
        <div style="padding: 60px 20px; color: #64748b; text-align:center; width:100%;">
            <i class="fa-solid fa-spinner fa-spin" style="font-size:2rem;"></i>
        </div>`;

    try {
        const snapshot = await firebase.firestore()
            .collection("users")
            .doc(currentUser.uid)
            .collection("myList")
            .get();

        if (snapshot.empty) {
            container.innerHTML = `
                <div style="padding:40px 20px; color:#94a3b8; text-align:center; width:100%;">
                    Aún no tienes contenido en tu lista
                </div>`;
            return;
        }

        let items = [];
        for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            const tmdb = await getTMDBInfo(data.type, data.id);
            if (tmdb) {
                items.push({
                    ...data,
                    title: tmdb.title || tmdb.name || "Sin título",
                    backdrop: tmdb.backdrop_path 
                        ? `https://image.tmdb.org/t/p/w780${tmdb.backdrop_path}` 
                        : "https://via.placeholder.com/780x440/1e2937/64748b?text=Sin+Imagen",
                    year: (tmdb.release_date || tmdb.first_air_date || "").substring(0, 4) || "N/A"
                });
            }
        }

        // Ordenar por título (o puedes cambiar a random)
        items.sort((a, b) => a.title.localeCompare(b.title));

        let html = '';
        items.forEach(item => {
            const typeText = item.type === "movie" ? "Película" : "Serie";
            const typeClass = item.type === "movie" ? "type-movie" : "type-tv";

            html += `
                <div class="continue-card" onclick="goToContent('${item.url || '#'}')">
                    <img src="${item.backdrop}" alt="${item.title}">
                    <div class="continue-type ${typeClass}">${typeText}</div>
                    <div class="continue-overlay">
                        <div class="continue-title">${item.title}</div>
                        <div class="continue-year">${item.year}</div>
                    </div>
                </div>`;
        });

        container.innerHTML = html;
    } catch (error) {
        console.error("Error en Seguir Viendo:", error);
        container.innerHTML = `
            <div style="padding:40px; color:#ef4444; text-align:center; width:100%;">
                Error al cargar los contenidos
            </div>`;
    }
}

async function getTMDBInfo(type, id) {
    try {
        const endpoint = type === "movie" ? "movie" : "tv";
        const url = `https://api.themoviedb.org/3/${endpoint}/${id}?api_key=38e497c6c1a043d1341416e80915669f&language=es-ES`;
        const res = await fetch(url);
        return await res.json();
    } catch (e) {
        console.error(e);
        return null;
    }
}

function goToContent(url) {
    if (url && url !== "#") window.location.href = url;
}

// Cargar automáticamente cuando el usuario esté logueado
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        setTimeout(loadContinueWatching, 600);
    }
});
