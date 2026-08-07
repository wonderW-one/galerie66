document.addEventListener('DOMContentLoaded', () => {
    const boutonHamburger = document.getElementById('boutonHamburger');
    const menuMobile = document.getElementById('menuMobile');

    if (boutonHamburger && menuMobile) {
        boutonHamburger.addEventListener('click', () => {
            const estOuvert = menuMobile.classList.toggle('menu-ouvert');
            boutonHamburger.classList.toggle('actif', estOuvert);
            boutonHamburger.setAttribute('aria-expanded', estOuvert);
        });

        // Ferme le menu quand on clique sur un lien
        menuMobile.querySelectorAll('a').forEach(lien => {
            lien.addEventListener('click', () => {
                menuMobile.classList.remove('menu-ouvert');
                boutonHamburger.classList.remove('actif');
                boutonHamburger.setAttribute('aria-expanded', false);
            });
        });
    }
});