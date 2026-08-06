// panier.js — gestion du panier de produits sélectionnés pour réservation.
// Le panier est stocké dans localStorage (simple liste, pas de fichiers
// binaires ici) donc il survit à un rechargement de page, y compris hors-ligne.

const CLE_PANIER = "galerie66_panier";

// Récupère le contenu actuel du panier.
function obtenirPanier() {
    const donnees = localStorage.getItem(CLE_PANIER);
    return donnees ? JSON.parse(donnees) : [];
}

// Sauvegarde le panier et met à jour l'affichage (badge + liste).
function sauvegarderPanier(panier) {
    localStorage.setItem(CLE_PANIER, JSON.stringify(panier));
    rafraichirAffichagePanier();
}

// Ajoute un produit au panier (évite les doublons, incrémente la quantité).
function ajouterAuPanier(produit) {
    const panier = obtenirPanier();
    const existant = panier.find((p) => p.id === produit.id);

    if (existant) {
        existant.quantite += 1;
    } else {
        panier.push({
            id: produit.id,
            nom: produit.nom || produit.description,
            description: produit.description,
            taille: produit.taille || "",
            prix: produit.prix || 0,
            src: produit.src,
            quantite: 1,
        });
    }
    sauvegarderPanier(panier);
}

// Retire complètement un produit du panier.
function retirerDuPanier(id) {
    const panier = obtenirPanier().filter((p) => p.id !== id);
    sauvegarderPanier(panier);
}

// Change la quantité d'un produit (minimum 1).
function changerQuantite(id, delta) {
    const panier = obtenirPanier();
    const produit = panier.find((p) => p.id === id);
    if (!produit) return;
    produit.quantite = Math.max(1, produit.quantite + delta);
    sauvegarderPanier(panier);
}

// Vide entièrement le panier (après envoi de la réservation par exemple).
function viderPanier() {
    sauvegarderPanier([]);
}

// Calcule le nombre total d'articles et le total en montant.
function calculerTotaux(panier) {
    const nombreArticles = panier.reduce((total, p) => total + p.quantite, 0);
    const montantTotal = panier.reduce((total, p) => total + p.quantite * p.prix, 0);
    return { nombreArticles, montantTotal };
}

// ==================== AFFICHAGE ====================

// Met à jour la pastille du panier + la liste dans le panneau + le résumé
// affiché au-dessus du formulaire de réservation.
function rafraichirAffichagePanier() {
    const panier = obtenirPanier();
    const { nombreArticles, montantTotal } = calculerTotaux(panier);

    // Pastille sur l'icône panier
    const pastille = document.getElementById("pastillePanier");
    if (pastille) {
        if (nombreArticles > 0) {
            pastille.textContent = nombreArticles;
            pastille.hidden = false;
        } else {
            pastille.hidden = true;
        }
    }

    // Liste déroulante du panier
    const listePanier = document.getElementById("listePanier");
    if (listePanier) {
        listePanier.innerHTML = "";
        if (panier.length === 0) {
            listePanier.innerHTML = '<p class="panier-vide">Votre panier est vide.</p>';
        } else {
            panier.forEach((produit) => {
                const item = document.createElement("div");
                item.classList.add("panier-item");
                item.innerHTML = `
                    <img src="${produit.src}" alt="${produit.nom}">
                    <div class="panier-item-info">
                        <p class="panier-item-nom">${produit.nom}${produit.taille ? ` (${produit.taille})` : ""}</p>
                        <p class="panier-item-prix">${produit.prix.toFixed(2)} $ x
                            <button class="panier-qte-moins" data-id="${produit.id}">-</button>
                            <span>${produit.quantite}</span>
                            <button class="panier-qte-plus" data-id="${produit.id}">+</button>
                        </p>
                    </div>
                    <button class="panier-retirer" data-id="${produit.id}" aria-label="Retirer">✕</button>
                `;
                listePanier.appendChild(item);
            });
        }
    }

    const totalPanier = document.getElementById("totalPanier");
    if (totalPanier) {
        totalPanier.textContent = `${montantTotal.toFixed(2)} $`;
    }

    // Résumé au-dessus du formulaire de réservation
    const resumeReservation = document.getElementById("resumeReservation");
    if (resumeReservation) {
        if (panier.length === 0) {
            resumeReservation.innerHTML =
                '<p class="resume-vide">Aucun produit sélectionné. Ajoutez des produits depuis la galerie avant de réserver.</p>';
        } else {
            resumeReservation.innerHTML =
                "<ul>" +
                panier
                    .map((p) => `<li>${p.quantite} × ${p.nom}${p.taille ? ` (${p.taille})` : ""} — ${(p.prix * p.quantite).toFixed(2)} $</li>`)
                    .join("") +
                `</ul><p class="resume-total">Total : ${montantTotal.toFixed(2)} $</p>`;
        }
    }
}

// --- Délégation d'événements pour les boutons du panneau panier ---
document.addEventListener("click", (event) => {
    const id = event.target.dataset.id;
    if (!id) return;

    if (event.target.classList.contains("panier-retirer")) {
        retirerDuPanier(id);
    }
    if (event.target.classList.contains("panier-qte-plus")) {
        changerQuantite(id, 1);
    }
    if (event.target.classList.contains("panier-qte-moins")) {
        changerQuantite(id, -1);
    }
});

// Ouvre/ferme le panneau panier
document.addEventListener("DOMContentLoaded", () => {
    const boutonPanier = document.getElementById("boutonPanier");
    const panneauPanier = document.getElementById("panneauPanier");

    if (boutonPanier && panneauPanier) {
        boutonPanier.addEventListener("click", () => {
            panneauPanier.classList.toggle("panneau-ouvert");
        });
        document.addEventListener("click", (event) => {
            if (!panneauPanier.contains(event.target) && !boutonPanier.contains(event.target)) {
                panneauPanier.classList.remove("panneau-ouvert");
            }
        });
    }

    rafraichirAffichagePanier();
});