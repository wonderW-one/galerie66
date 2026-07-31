// Liste des photos : ajoute/modifie les entrées ici
const photos = [
    { src: "images/photo1.jpg", description: "Description de la photo 1" },
    { src: "images/photo2.jpg", description: "Description de la photo 2" },
    { src: "images/photo3.jpg", description: "Description de la photo 3" },
];

/**
 * Affiche une liste de photos (avec description) dans une grille.
 * @param {Array<{src: string, description: string}>} liste - photos à afficher
 * @param {string} conteneurId - id de l'élément HTML qui recevra la grille
 */
function afficherGalerie(liste, conteneurId = "galerie") {
    const conteneur = document.getElementById(conteneurId);
    conteneur.innerHTML = ""; // vide le conteneur avant de le remplir

    liste.forEach((photo) => {
        // case (carte) de la grille
        const carte = document.createElement("div");
        carte.classList.add("carte");

        // image
        const img = document.createElement("img");
        img.src = photo.src;
        img.alt = photo.description;

        // description
        const texte = document.createElement("p");
        texte.classList.add("description");
        texte.textContent = photo.description;

        carte.appendChild(img);
        carte.appendChild(texte);
        conteneur.appendChild(carte);
    });
}

// Affiche la galerie au chargement de la page :
// photos par défaut + photos ajoutées par l'utilisateur (stockées dans IndexedDB)
async function chargerGalerieComplete() {
    const photosUtilisateur = await recupererPhotos();
    afficherGalerie([...photos, ...photosUtilisateur]);
}
chargerGalerieComplete();

// --- Gestion du formulaire d'ajout de photo ---
const formAjout = document.getElementById("formAjout");
formAjout.addEventListener("submit", async (event) => {
    event.preventDefault();

    const fichier = document.getElementById("champFichier").files[0];
    const description = document.getElementById("champDescription").value.trim();

    if (!fichier || !description) return;

    await ajouterPhoto(fichier, description);
    formAjout.reset();
    chargerGalerieComplete(); // rafraîchit la grille avec la nouvelle photo
});

// --- Rend le site utilisable hors-ligne (installe le Service Worker) ---
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("sw.js")
            .then(() => console.log("Service Worker enregistré : mode hors-ligne actif"))
            .catch((erreur) => console.error("Échec du Service Worker :", erreur));
    });
}

// --- Demande l'autorisation de stockage persistant sur le téléphone ---
// (empêche le système de vider automatiquement les données stockées
// par le site en cas de manque d'espace)
async function demanderStockagePersistant() {
    if (navigator.storage && navigator.storage.persist) {
        const dejaPersistant = await navigator.storage.persisted();
        if (!dejaPersistant) {
            const accorde = await navigator.storage.persist();
            console.log(
                accorde
                    ? "Stockage persistant accordé : les données resteront sur l'appareil."
                    : "Stockage persistant refusé par le navigateur/utilisateur."
            );
        }
    }
}
demanderStockagePersistant();