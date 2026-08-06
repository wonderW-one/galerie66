// galerie-commun.js — code partagé entre index.html et admin.html

/**
 * Affiche une liste de produits (photo, nom, description, taille, prix) dans une grille.
 * @param {Array} liste - produits à afficher
 * @param {string} conteneurId - id de l'élément HTML qui recevra la grille
 * @param {boolean} avecPanier - affiche le bouton "Ajouter au panier" (page visiteur uniquement)
 */
function afficherGalerie(liste, conteneurId = "galerie", avecPanier = true) {
    const conteneur = document.getElementById(conteneurId);
    if (!conteneur) return;
    conteneur.innerHTML = "";

    if (liste.length === 0) {
        conteneur.innerHTML = '<p class="galerie-vide">Aucun produit pour le moment.</p>';
        return;
    }

    liste.forEach((photo) => {
        const carte = document.createElement("div");
        carte.classList.add("carte");

        const img = document.createElement("img");
        img.src = photo.src;
        img.alt = photo.nom || photo.description;
        img.loading = "lazy";
        carte.appendChild(img);

        const contenu = document.createElement("div");
        contenu.classList.add("carte-contenu");

        const nom = document.createElement("h3");
        nom.classList.add("nom-produit");
        nom.textContent = photo.nom || photo.description;
        contenu.appendChild(nom);

        if (photo.description) {
            const description = document.createElement("p");
            description.classList.add("description");
            description.textContent = photo.description;
            contenu.appendChild(description);
        }

        if (photo.taille) {
            const taille = document.createElement("p");
            taille.classList.add("taille-produit");
            taille.textContent = `Taille : ${photo.taille}`;
            contenu.appendChild(taille);
        }

        if (photo.prix) {
            const prix = document.createElement("p");
            prix.classList.add("prix");
            prix.textContent = `${Number(photo.prix).toFixed(2)} $`;
            contenu.appendChild(prix);
        }

        if (avecPanier) {
            const bouton = document.createElement("button");
            bouton.classList.add("btn-ajouter-panier");
            bouton.textContent = "Ajouter au panier";
            bouton.addEventListener("click", () => ajouterAuPanier(photo));
            contenu.appendChild(bouton);
        }

        carte.appendChild(contenu);
        conteneur.appendChild(carte);
    });
}

// Charge et affiche la galerie complète depuis l'API Django :
// tous les visiteurs et l'admin voient désormais les mêmes produits,
// quel que soit leur appareil (fini le "seulement sur mon navigateur").
async function chargerGalerieComplete(avecPanier = true) {
    try {
        const produits = await obtenirProduits();
        afficherGalerie(produits, "galerie", avecPanier);
    } catch (erreur) {
        console.error("Impossible de charger la galerie :", erreur);
        const conteneur = document.getElementById("galerie");
        if (conteneur) {
            conteneur.innerHTML = '<p class="galerie-vide">Impossible de charger les produits pour le moment.</p>';
        }
    }
}

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
async function demanderStockagePersistant() {
    if (navigator.storage && navigator.storage.persist) {
        const dejaPersistant = await navigator.storage.persisted();
        if (!dejaPersistant) {
            await navigator.storage.persist();
        }
    }
}
demanderStockagePersistant();