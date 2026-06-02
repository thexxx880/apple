// =============== SEGUIR VIENDO - Versión Corregida ===============

let currentUser = null;

// Esperar a que Firebase esté listo
function waitForFirebase() {
    return new Promise((resolve) => {
        const checkFirebase = setInterval(() => {
            if (typeof firebase !== "undefined" && firebase.apps && firebase.apps.length > 0) {
                clearInterval(checkFirebase);
                resolve();
            }
        }, 300);
    });
}

async function loadContinueWatching() {
    const section = document.getElementById("continueSection");
    const container = document.getElementById("continueGrid");
    
    if (!container || !section) return;

    container.innerHTML = `
        <div style="padding: 50px 20px; color: #64748b; text-align:center; width:100%;">
            <i class="fa-solid fa-spinner fa-spin"></i>
        </div>`;

    try {
        await waitForFirebase();

        if (!firebase.auth().currentUser) {
            section.style.display = "none";
            return;
        }

        currentUser = firebase.auth().currentUser;

        const snapshot = await firebase.firestore()
            .collection("users")
            .doc(currentUser.uid)
            .collection("myList")
            .get();

        if (snapshot.empty) {
            section.style.display = "none";
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

        if (items.length === 0) {
            section.style.display = "none";
            return;
        }

        section.style.display = "block";

        let html = '';
        items.forEach(item => {
            const typeText = item.type === "movie" ? "P" : "S";
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
        section.style.display = "none";
    }
}

async function getTMDBInfo(type, id) {
    try {
        const endpoint = type === "movie" ? "movie" : "tv";
        const url = `https://api.themoviedb.org/3/${endpoint}/${id}?api_key=38e497c6c1a043d1341416e80915669f&language=es-ES`;
        const res = await fetch(url);
        return await res.json();
    } catch (e) {
        return null;
    }
}

function goToContent(url) {
    if (url && url !== "#") window.location.href = url;
}

// Iniciar cuando la página cargue
document.addEventListener("DOMContentLoaded", () => {
    // Pequeño delay para asegurar que applelz.js se cargó
    setTimeout(loadContinueWatching, 1200);
});
