// db.js — gestion du stockage des photos ajoutées par l'utilisateur
// via IndexedDB (contrairement à localStorage, IndexedDB peut stocker
// de vrais fichiers binaires comme des images, pas seulement du texte).

const DB_NOM = "galerie66_db";
const DB_VERSION = 2; // version incrémentée : ajout du magasin "reservations"
const MAGASIN = "photos"; // "object store" = la table qui contient les photos
const MAGASIN_RESA = "reservations"; // table des demandes de réservation

// Ouvre (ou crée) la base de données IndexedDB.
function ouvrirBase() {
    return new Promise((resolve, reject) => {
        const requete = indexedDB.open(DB_NOM, DB_VERSION);

        // Appelé à la création ou à la mise à jour de version :
        // on définit la structure de stockage.
        requete.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(MAGASIN)) {
                db.createObjectStore(MAGASIN, {
                    keyPath: "id",
                    autoIncrement: true,
                });
            }
            if (!db.objectStoreNames.contains(MAGASIN_RESA)) {
                db.createObjectStore(MAGASIN_RESA, {
                    keyPath: "id",
                    autoIncrement: true,
                });
            }
        };

        requete.onsuccess = (event) => resolve(event.target.result);
        requete.onerror = (event) => reject(event.target.error);
    });
}

// Ajoute un produit (photo + nom + description + taille + prix) dans IndexedDB.
// `fichier` est un objet File (venant d'un <input type="file">).
async function ajouterPhoto(fichier, nom, description, taille, prix = 0) {
    const db = await ouvrirBase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(MAGASIN, "readwrite");
        const magasin = transaction.objectStore(MAGASIN);

        const enregistrement = {
            blob: fichier, // le fichier binaire est stocké directement
            nom: nom,
            description: description,
            taille: taille,
            prix: prix,
            dateAjout: new Date().toISOString(),
        };

        const requete = magasin.add(enregistrement);
        requete.onsuccess = () => resolve(requete.result); // renvoie l'id généré
        requete.onerror = () => reject(requete.error);
    });
}

// Récupère tous les produits stockés, avec une URL utilisable dans <img src="...">.
async function recupererPhotos() {
    const db = await ouvrirBase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(MAGASIN, "readonly");
        const magasin = transaction.objectStore(MAGASIN);
        const requete = magasin.getAll();

        requete.onsuccess = () => {
            const resultats = requete.result.map((item) => ({
                id: `produit-${item.id}`,
                nom: item.nom || item.description, // compatibilité avec d'anciens produits sans "nom"
                description: item.description,
                taille: item.taille || "",
                prix: item.prix || 0,
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

// ==================== RÉSERVATIONS ====================

// Ajoute une demande de réservation.
async function ajouterReservation(donnees) {
    const db = await ouvrirBase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(MAGASIN_RESA, "readwrite");
        const magasin = transaction.objectStore(MAGASIN_RESA);

        const enregistrement = {
            ...donnees,
            dateAjout: new Date().toISOString(),
            lue: false, // pour la pastille de notification admin
        };

        const requete = magasin.add(enregistrement);
        requete.onsuccess = () => resolve(requete.result);
        requete.onerror = () => reject(requete.error);
    });
}

// Récupère toutes les réservations, les plus récentes en premier.
async function recupererReservations() {
    const db = await ouvrirBase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(MAGASIN_RESA, "readonly");
        const magasin = transaction.objectStore(MAGASIN_RESA);
        const requete = magasin.getAll();

        requete.onsuccess = () => {
            const resultats = requete.result.sort(
                (a, b) => new Date(b.dateAjout) - new Date(a.dateAjout)
            );
            resolve(resultats);
        };
        requete.onerror = () => reject(requete.error);
    });
}

// Marque une réservation comme lue (fait disparaître la pastille).
async function marquerReservationLue(id) {
    const db = await ouvrirBase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(MAGASIN_RESA, "readwrite");
        const magasin = transaction.objectStore(MAGASIN_RESA);
        const requeteGet = magasin.get(id);
        requeteGet.onsuccess = () => {
            const item = requeteGet.result;
            if (!item) return resolve();
            item.lue = true;
            const requeteMaj = magasin.put(item);
            requeteMaj.onsuccess = () => resolve();
            requeteMaj.onerror = () => reject(requeteMaj.error);
        };
        requeteGet.onerror = () => reject(requeteGet.error);
    });
}

// Supprime une réservation.
async function supprimerReservation(id) {
    const db = await ouvrirBase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(MAGASIN_RESA, "readwrite");
        const magasin = transaction.objectStore(MAGASIN_RESA);
        const requete = magasin.delete(id);
        requete.onsuccess = () => resolve();
        requete.onerror = () => reject(requete.error);
    });
}