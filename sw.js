// Nom et version du cache : change la version à chaque mise à jour du site
// pour forcer le rechargement des fichiers.
const CACHE_NAME = "galerie66-cache-v7";

// Liste des fichiers essentiels à mettre en cache dès l'installation.
// Note : le catalogue de produits et les réservations viennent maintenant
// de l'API Django, pas de ce cache — ce cache ne sert plus qu'à afficher
// la coquille de l'app hors-ligne (pas les données à jour).
const FICHIERS_A_CACHER = [
    "./",
    "./index.html",
    "./admin.html",
    "./login.html",
    "./styles.css",
    "./menu.js",
    "./script.js",
    "./script-admin.js",
    "./galerie-commun.js",
    "./panier.js",
    "./auth.js",
    "./api.js",
    "./manifest.json",
];

// --- Installation : on met en cache les fichiers de base ---
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(FICHIERS_A_CACHER);
        })
    );
    self.skipWaiting(); // active le nouveau service worker immédiatement
});

// --- Activation : on supprime les anciens caches obsolètes ---
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((noms) =>
            Promise.all(
                noms
                    .filter((nom) => nom !== CACHE_NAME)
                    .map((nom) => caches.delete(nom))
            )
        )
    );
    self.clients.claim();
});

// --- Interception des requêtes : cache d'abord, réseau en secours ---
// Exception : les appels vers l'API Django ne sont JAMAIS servis depuis le
// cache (produits/réservations doivent toujours être à jour, pas figés).
self.addEventListener("fetch", (event) => {
    if (event.request.url.includes("/api/")) {
        return; // laisse la requête suivre son cours normal (réseau direct)
    }

    event.respondWith(
        caches.match(event.request).then((reponseEnCache) => {
            if (reponseEnCache) {
                return reponseEnCache; // trouvé hors-ligne
            }
            return fetch(event.request)
                .then((reponseReseau) => {
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, reponseReseau.clone());
                        return reponseReseau;
                    });
                })
                .catch(() => {
                    // pas de réseau et pas en cache : on revient à la page publique
                    return caches.match("./index.html");
                });
        })
    );
});