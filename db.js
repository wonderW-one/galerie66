// db.js — gestion du stockage des photos ajoutées par l'utilisateur
// via IndexedDB (contrairement à localStorage, IndexedDB peut stocker
// de vrais fichiers binaires comme des images, pas seulement du texte).

const DB_NOM = "galerie66_db";
const DB_VERSION = 1;
const MAGASIN = "photos"; // "object store" = la table qui contient les photos

// Ouvre (ou crée) la base de données IndexedDB.
function ouvrirBase() {
    return new Promise((resolve, reject) => {
        const requete = indexedDB.open(DB_NOM, DB_VERSION);

        // Appelé uniquement à la création ou à la mise à jour de version :
        // on définit la structure de stockage.
        requete.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(MAGASIN)) {
                db.createObjectStore(MAGASIN, {
                    keyPath: "id",
                    autoIncrement: true,
                });
            }
        };

        requete.onsuccess = (event) => resolve(event.target.result);
        requete.onerror = (event) => reject(event.target.error);
    });
}

// Ajoute une photo (fichier image + description) dans IndexedDB.
// `fichier` est un objet File (venant d'un <input type="file">).
async function ajouterPhoto(fichier, description) {
    const db = await ouvrirBase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(MAGASIN, "readwrite");
        const magasin = transaction.objectStore(MAGASIN);

        const enregistrement = {
            blob: fichier, // le fichier binaire est stocké directement
            description: description,
            dateAjout: new Date().toISOString(),
        };

        const requete = magasin.add(enregistrement);
        requete.onsuccess = () => resolve(requete.result); // renvoie l'id généré
        requete.onerror = () => reject(requete.error);
    });
}

// Récupère toutes les photos stockées, avec une URL utilisable dans <img src="...">.
async function recupererPhotos() {
    const db = await ouvrirBase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(MAGASIN, "readonly");
        const magasin = transaction.objectStore(MAGASIN);
        const requete = magasin.getAll();

        requete.onsuccess = () => {
            const resultats = requete.result.map((item) => ({
                id: item.id,
                description: item.description,
                src: URL.createObjectURL(item.blob), // URL temporaire valable pour cette session
            }));
            resolve(resultats);
        };
        requete.onerror = () => reject(requete.error);
    });
}

// Supprime une photo par son id.
async function supprimerPhoto(id) {
    const db = await ouvrirBase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(MAGASIN, "readwrite");
        const magasin = transaction.objectStore(MAGASIN);
        const requete = magasin.delete(id);
        requete.onsuccess = () => resolve();
        requete.onerror = () => reject(requete.error);
    });
}