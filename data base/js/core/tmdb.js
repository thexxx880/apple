/* ==========================
TMDB API REMOTA
========================== */

const TMDB_API_KEY =
"38e497c6c1a043d1341416e80915669f";

/* ==========================
FETCH UNIVERSAL TMDB
========================== */

async function fetchTMDB(
    endpoint
) {

    try {

        const response =
        await fetch(
            `https://api.themoviedb.org/3/${endpoint}${
                endpoint.includes("?")
                ? "&"
                : "?"
            }api_key=${TMDB_API_KEY}&language=es-ES`
        );

        if (!response.ok) {
            throw new Error(
                "Error en TMDB"
            );
        }

        return await response.json();

    } catch(error) {

        console.error(
            "TMDB Error:",
            error
        );

        return null;
    }
}
