// api.js — pont entre le frontend Galerie 66 et l'API Django.
// Remplace les fonctions de db.js qui lisaient/écrivaient dans IndexedDB :
// désormais produits et réservations vivent sur le serveur, partagés par
// tous les visiteurs et par l'admin, quel que soit l'appareil.

// ⚠️ À remplacer par l'URL réelle de ton backend déployé (Render, etc.)
// const API_BASE_URL = "https://TON-BACKEND.onrender.com/api";
const API_BASE_URL = "wonderwone.pythonanywhere.com/api";
const CLE_ACCESS = "galerie66_access_token";
const CLE_REFRESH = "galerie66_refresh_token";

function obtenirTokenAccess() {
    return sessionStorage.getItem(CLE_ACCESS);
}

function obtenirTokenRefresh() {
    return sessionStorage.getItem(CLE_REFRESH);
}

function stockerTokens({ access, refresh }) {
    if (access) sessionStorage.setItem(CLE_ACCESS, access);
    if (refresh) sessionStorage.setItem(CLE_REFRESH, refresh);
}

function effacerTokens() {
    sessionStorage.removeItem(CLE_ACCESS);
    sessionStorage.removeItem(CLE_REFRESH);
}

// Tente de rafraîchir le token d'accès à partir du refresh token.
async function rafraichirToken() {
    const refresh = obtenirTokenRefresh();
    if (!refresh) return false;

    const reponse = await fetch(`${API_BASE_URL}/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
    });

    if (!reponse.ok) return false;
    const donnees = await reponse.json();
    stockerTokens({ access: donnees.access });
    return true;
}

// Wrapper fetch générique : ajoute le token si présent, gère le 401 en
// tentant un refresh une fois, puis redirige vers la connexion si ça échoue.
async function apiFetch(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (!(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }
    const token = obtenirTokenAccess();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    let reponse = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

    if (reponse.status === 401 && obtenirTokenRefresh()) {
        const succes = await rafraichirToken();
        if (succes) {
            headers["Authorization"] = `Bearer ${obtenirTokenAccess()}`;
            reponse = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
        } else {
            effacerTokens();
            window.location.href = "login.html";
            throw new Error("Session expirée");
        }
    }

    return reponse;
}

// ==================== CATALOGUE (public) ====================

async function obtenirProduits() {
    const reponse = await fetch(`${API_BASE_URL}/produit/`);
    if (!reponse.ok) throw new Error("Impossible de charger les produits");
    const donnees = await reponse.json();
    const liste = donnees.results || donnees; // supporte pagination DRF
    return liste.map((p) => ({
        id: p.id,
        nom: p.nom_produit,
        description: p.description,
        taille: p.taille || "",
        prix: p.prix || 0,
        src: p.image, // URL absolue renvoyée par Django (MEDIA_URL)
    }));
}

// ==================== PRODUITS (admin uniquement) ====================

async function ajouterProduitAPI(fichier, nom, description, taille, prix) {
    const formData = new FormData();
    formData.append("image", fichier);
    formData.append("nom_produit", nom);
    formData.append("description", description);
    if (taille) formData.append("taille", taille);
    formData.append("prix", prix);

    const reponse = await apiFetch("/produit/", { method: "POST", body: formData });
    if (!reponse.ok) throw new Error("Échec de l'ajout du produit");
    return reponse.json();
}

async function supprimerProduitAPI(id) {
    const reponse = await apiFetch(`/produit/${id}/`, { method: "DELETE" });
    if (!reponse.ok && reponse.status !== 204) throw new Error("Échec de la suppression du produit");
}

// ==================== RÉSERVATIONS ====================

// Envoi public : pas de token requis, comme le formulaire l'était avant.
async function envoyerReservation(donnees) {
    const payload = {
        nom: donnees.nom,
        prenom: donnees.prenom,
        email: donnees.email,
        tel: donnees.tel,
        produits: donnees.produits.map((p) => ({ id: p.id, quantite: p.quantite })),
    };
    const reponse = await fetch(`${API_BASE_URL}/reservations/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!reponse.ok) throw new Error("Échec de l'envoi de la réservation");
    return reponse.json();
}

// Lecture/gestion admin : token requis (voir apiFetch).
async function recupererReservationsAPI() {
    const reponse = await apiFetch("/reservations/");
    if (!reponse.ok) throw new Error("Impossible de charger les réservations");
    const donnees = await reponse.json();
    const liste = donnees.results || donnees;
    return liste.map((r) => ({
        id: r.id,
        nom: r.client_nom || "",
        email: r.client_email || "",
        tel: r.client_tel || "",
        produits: (r.lignes || []).map((l) => ({
            nom: l.nom_produit,
            quantite: l.quantite,
            prix: l.prix_unitaire,
        })),
        lue: r.statut !== "NOUVELLE",
        dateAjout: r.created_at,
        id_brut: r.id,
    }));
}

async function marquerReservationLueAPI(id) {
    const reponse = await apiFetch(`/reservations/${id}/`, {
        method: "PATCH",
        body: JSON.stringify({ statut: "LUE" }),
    });
    if (!reponse.ok) throw new Error("Échec de la mise à jour");
}

async function supprimerReservationAPI(id) {
    const reponse = await apiFetch(`/reservations/${id}/`, { method: "DELETE" });
    if (!reponse.ok && reponse.status !== 204) throw new Error("Échec de la suppression");
}