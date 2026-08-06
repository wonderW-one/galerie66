// script.js — logique de la page publique (index.html) :
// affichage du catalogue + envoi d'une demande de réservation avec le panier.

chargerGalerieComplete(true); // true = affiche le bouton "Ajouter au panier"

// --- Gestion du formulaire de réservation ---
const formReservation = document.getElementById("ajouteprofile");

if (formReservation) {
    formReservation.addEventListener("submit", async (event) => {
        event.preventDefault();

        const panier = obtenirPanier();
        if (panier.length === 0) {
            afficherMessageReservation("Ajoutez au moins un produit à votre panier avant de réserver.", "erreur");
            return;
        }

        const donnees = {
            nom: document.getElementById("nom").value.trim(),
            prenom: document.getElementById("prenom").value.trim(),
            email: document.getElementById("email").value.trim(),
            tel: document.getElementById("tel").value.trim(),
            produits: panier, // liste des produits sélectionnés (avec quantités)
        };

        if (!donnees.nom || !donnees.prenom || !donnees.email || !donnees.tel) {
            return;
        }

        const boutonEnvoyer = formReservation.querySelector("button[type='submit']");
        boutonEnvoyer.disabled = true;
        boutonEnvoyer.textContent = "Envoi...";

        try {
            await envoyerReservation(donnees);
            afficherMessageReservation("Votre demande de réservation a bien été envoyée !", "succes");
            formReservation.reset();
            viderPanier(); // vide le panier après envoi réussi
        } catch (erreur) {
            console.error("Erreur lors de l'enregistrement de la réservation :", erreur);
            afficherMessageReservation("Une erreur est survenue, réessaie.", "erreur");
        } finally {
            boutonEnvoyer.disabled = false;
            boutonEnvoyer.textContent = "Réserver";
        }
    });
}

// Affiche un petit message de confirmation/erreur sous le formulaire.
function afficherMessageReservation(texte, type) {
    let message = document.getElementById("messageReservation");
    if (!message) {
        message = document.createElement("p");
        message.id = "messageReservation";
        formReservation.appendChild(message);
    }
    message.textContent = texte;
    message.className = `message-reservation message-${type}`;

    setTimeout(() => {
        message.textContent = "";
        message.className = "message-reservation";
    }, 4000);
}