// Nom et version du cache : change la version à chaque mise à jour du site
// pour forcer le rechargement des fichiers.
const CACHE_NAME = "galerie66-cache-v1";

// Liste des fichiers essentiels à mettre en cache dès l'installation.
// Ajoute ici toutes tes photos/pages si tu veux qu'elles soient
// disponibles hors-ligne dès la première visite.
const FICHIERS_A_CACHER = [
    "./",
    "./index.html",
    "./styles.css",
    "./script.js",
    "./db.js",
    "./manifest.json",
    "./icons/icon-192.png",
    "./icons/icon-512.png",
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
self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((reponseEnCache) => {
            if (reponseEnCache) {
                return reponseEnCache; // trouvé hors-ligne
            }
            return fetch(event.request)
                .then((reponseReseau) => {
                    // on met aussi en cache les nouvelles ressources visitées
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, reponseReseau.clone());
                        return reponseReseau;
                    });
                })
                .catch(() => {
                    // pas de réseau et pas en cache : on peut renvoyer une page de secours ici
                    return caches.match("./index.html");
                });
        })
    );
});