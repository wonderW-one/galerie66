// auth.js — authentification admin réelle via l'API Django (JWT).
// Remplace l'ancien système de hash côté client (contournable en 1 ligne
// dans la console) par de vrais tokens émis par le serveur.
//
// Dépend de api.js (API_BASE_URL, stockerTokens, effacerTokens, obtenirTokenAccess).

// Tente la connexion avec les identifiants du compte staff Django
// (créé via `python manage.py createsuperuser` ou l'admin Django).
async function tenterConnexion(username, motDePasse) {
    const reponse = await fetch(`${API_BASE_URL}/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password: motDePasse }),
    });

    if (!reponse.ok) return false;

    const donnees = await reponse.json();
    stockerTokens({ access: donnees.access, refresh: donnees.refresh });
    return true;
}

function deconnecter() {
    effacerTokens();
    window.location.href = "login.html";
}

// À appeler tout en haut de admin.html : redirige vers la connexion
// si aucun token n'est présent. (La validité réelle du token est vérifiée
// par l'API elle-même sur le premier appel — voir apiFetch dans api.js,
// qui redirige aussi si le token est expiré/invalide.)
function protegerPageAdmin() {
    if (!obtenirTokenAccess()) {
        window.location.href = "login.html";
    }
}