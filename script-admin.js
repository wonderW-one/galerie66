// script-admin.js — logique spécifique à la page admin (admin.html) :
// gestion de la galerie (ajout de photos) + box de notifications des réservations.

chargerGalerieComplete(false); // false = pas de bouton "Ajouter au panier" côté admin

// --- Gestion du formulaire d'ajout de produit ---
const formAjout = document.getElementById("formAjout");
if (formAjout) {
    formAjout.addEventListener("submit", async (event) => {
        event.preventDefault();

        const fichier = document.getElementById("champFichier").files[0];
        const nom = document.getElementById("champNom").value.trim();
        const description = document.getElementById("champDescription").value.trim();
        const taille = document.getElementById("champTaille").value.trim();
        const prix = parseFloat(document.getElementById("champPrix").value) || 0;

        if (!fichier || !nom || !description) return;

        const boutonEnvoyer = formAjout.querySelector("button[type='submit']");
        boutonEnvoyer.disabled = true;

        try {
            await ajouterProduitAPI(fichier, nom, description, taille, prix);
            formAjout.reset();
            chargerGalerieComplete(false);
        } catch (erreur) {
            console.error("Échec de l'ajout du produit :", erreur);
            alert("Impossible d'ajouter le produit. Vérifie ta connexion ou reconnecte-toi.");
        } finally {
            boutonEnvoyer.disabled = false;
        }
    });
}

// ==================== NOTIFICATIONS DE RÉSERVATION ====================

const boutonNotif = document.getElementById("boutonNotif");
const pastilleNotif = document.getElementById("pastilleNotif");
const panneauNotif = document.getElementById("panneauNotif");
const listeNotif = document.getElementById("listeNotif");

// Charge les réservations et met à jour la pastille + la liste.
async function chargerNotifications() {
    let reservations;
    try {
        reservations = await recupererReservationsAPI();
    } catch (erreur) {
        console.error("Impossible de charger les réservations :", erreur);
        return;
    }
    const nonLues = reservations.filter((r) => !r.lue);

    // Pastille avec le nombre de demandes non lues
    if (nonLues.length > 0) {
        pastilleNotif.textContent = nonLues.length;
        pastilleNotif.hidden = false;
    } else {
        pastilleNotif.hidden = true;
    }

    // Contenu du panneau
    listeNotif.innerHTML = "";
    if (reservations.length === 0) {
        listeNotif.innerHTML = '<p class="notif-vide">Aucune demande de réservation pour le moment.</p>';
        return;
    }

    reservations.forEach((resa) => {
        const item = document.createElement("div");
        item.classList.add("notif-item");
        if (!resa.lue) item.classList.add("notif-item-nonlue");

        const date = new Date(resa.dateAjout).toLocaleString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

        const produitsHtml = (resa.produits || [])
            .map((p) => `<li>${p.quantite} × ${escapeHtml(p.nom || p.description)}${p.taille ? ` (${escapeHtml(p.taille)})` : ""} — ${(p.prix * p.quantite).toFixed(2)} $</li>`)
            .join("");
        const totalCommande = (resa.produits || []).reduce((t, p) => t + p.quantite * p.prix, 0);

        item.innerHTML = `
            <div class="notif-contenu">
                <p class="notif-nom">${escapeHtml(resa.nom)} ${escapeHtml(resa.prenom)}</p>
                <p class="notif-details">${escapeHtml(resa.email)} · ${escapeHtml(resa.tel)}</p>
                ${produitsHtml ? `<ul class="notif-produits">${produitsHtml}</ul><p class="notif-total">Total : ${totalCommande.toFixed(2)} $</p>` : ""}
                <p class="notif-date">${date}</p>
            </div>
            <div class="notif-actions">
                ${!resa.lue ? `<button class="notif-btn-lu" data-id="${resa.id}">Marquer comme lue</button>` : ""}
                <button class="notif-btn-suppr" data-id="${resa.id}">Supprimer</button>
            </div>
        `;
        listeNotif.appendChild(item);
    });
}

// Évite les injections HTML dans les champs saisis par les visiteurs.
function escapeHtml(texte) {
    const div = document.createElement("div");
    div.textContent = texte ?? "";
    return div.innerHTML;
}

// Ouvre/ferme le panneau de notifications
boutonNotif.addEventListener("click", () => {
    panneauNotif.classList.toggle("panneau-ouvert");
});

// Ferme le panneau si on clique en dehors
document.addEventListener("click", (event) => {
    if (!panneauNotif.contains(event.target) && !boutonNotif.contains(event.target)) {
        panneauNotif.classList.remove("panneau-ouvert");
    }
});

// Marquer comme lue / supprimer (délégation d'événement)
listeNotif.addEventListener("click", async (event) => {
    const id = Number(event.target.dataset.id);
    if (!id) return;

    try {
        if (event.target.classList.contains("notif-btn-lu")) {
            await marquerReservationLueAPI(id);
            chargerNotifications();
        }
        if (event.target.classList.contains("notif-btn-suppr")) {
            await supprimerReservationAPI(id);
            chargerNotifications();
        }
    } catch (erreur) {
        console.error("Action notification échouée :", erreur);
    }
});

chargerNotifications();

// Rafraîchit les notifications toutes les 15 secondes
// (utile si l'admin garde la page ouverte pendant que des demandes arrivent
// sur le même appareil/navigateur).
setInterval(chargerNotifications, 15000);