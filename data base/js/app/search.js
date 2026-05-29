// =============================================
// SEARCH.JS - Compatible con Navbar dinámico
// =============================================

const JSON_URL =
"https://raw.githubusercontent.com/thexxx880/apple/main/data%20base/search/search.json";

let database = [];
let dbLoaded = false;

// =============================================
// CARGAR DATABASE
// =============================================
async function loadDatabase() {

    if (dbLoaded) return;

    try {
        const res = await fetch(JSON_URL);

        if (!res.ok) {
            throw new Error("No se pudo cargar search.json");
        }

        const data = await res.json();

        database = Array.isArray(data)
            ? data
            : [data];

        dbLoaded = true;

        console.log(
            `✅ Search DB cargada (${database.length})`
        );

    } catch (err) {
        console.error("❌ Error search.json", err);
    }
}

// =============================================
// SEARCH ENGINE
// =============================================
function search(query) {

    if (!query || query.length < 2) {
        return [];
    }

    const q = query.toLowerCase().trim();

    return database
        .map(item => {

            let score = 0;

            const titulo =
                (item.titulo || "")
                .toLowerCase();

            const alternos =
                (item["titulo alternos"] || "")
                .toLowerCase();

            const sinopsis =
                (item.sinopsis || "")
                .toLowerCase();

            const id =
                String(item.id_tmdb || "");

            if (titulo.includes(q))
                score += 100;

            if (alternos.includes(q))
                score += 80;

            if (id === q)
                score += 70;

            if (sinopsis.includes(q))
                score += 40;

            if (titulo.startsWith(q))
                score += 30;

            return {
                ...item,
                score
            };

        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score);
}

// =============================================
// SUGERENCIAS
// =============================================
function showSuggestions(input, results) {

    let box =
        input.parentElement.querySelector(
            ".lz-suggestions"
        );

    if (!box) {

        box =
            document.createElement("div");

        box.className =
            "lz-suggestions";

        input.parentElement.appendChild(box);
    }

    if (!results.length) {
        box.innerHTML = "";
        box.style.display = "none";
        return;
    }

    box.innerHTML =
        results.slice(0, 8)
        .map(item => `
            <div class="lz-suggestion-item"
                data-url="${item.url}">

                <img
                    src="${item.poster}"
                    class="lz-suggestion-poster"
                >

                <div>
                    <h4>${item.titulo}</h4>
                    <small>${item.año || ""}</small>
                </div>
            </div>
        `)
        .join("");

    box.style.display = "block";

    box.onclick = (e) => {

        const card =
            e.target.closest(
                ".lz-suggestion-item"
            );

        if (!card) return;

        window.location.href =
            card.dataset.url;
    };
}

// =============================================
// ATTACH SEARCH TO NAVBAR
// =============================================
window.attachNavbarSearch =
async function () {

    await loadDatabase();

    const input =
        document.querySelector(
            "#navbar-search"
        );

    if (!input) return;

    // evitar listeners duplicados
    if (input.dataset.loaded)
        return;

    input.dataset.loaded = true;

    let timeout;

    input.addEventListener(
        "input",
        () => {

            clearTimeout(timeout);

            timeout = setTimeout(() => {

                const results =
                    search(input.value);

                showSuggestions(
                    input,
                    results
                );

            }, 120);
        }
    );

    // ENTER = modal
    input.addEventListener(
        "keydown",
        e => {

            if (e.key !== "Enter")
                return;

            const results =
                search(input.value);

            if (results[0]) {
                window.location.href =
                    results[0].url;
            }
        }
    );

    // cerrar al click afuera
    document.addEventListener(
        "click",
        e => {

            if (
                !input.parentElement
                .contains(e.target)
            ) {

                const box =
                    input.parentElement
                    .querySelector(
                        ".lz-suggestions"
                    );

                if (box)
                    box.style.display =
                        "none";
            }
        }
    );

    // Mobile button
    const mobileBtn =
        document.getElementById(
            "mobileSearchBtn"
        );

    if (mobileBtn) {

        mobileBtn.onclick = () => {
            input.focus();
        };
    }

    console.log(
        "✅ Search conectado al navbar"
    );
};

// =============================================
// AUTO INIT
// =============================================
document.addEventListener(
    "DOMContentLoaded",
    loadDatabase
);
