/* Panel de sonido plegable: el botón ♪ de la barra superior muestra u oculta
   los controles de SFX, música y volumen. Los manejadores de cada juego
   siguen actuando sobre los mismos ids. */
(() => {
    const toggle = document.querySelector('.sound-toggle');
    const panel = document.getElementById('sound-controls');
    if (!toggle || !panel) return;

    const setOpen = (open) => {
        panel.hidden = !open;
        toggle.setAttribute('aria-expanded', String(open));
    };

    setOpen(false);

    toggle.addEventListener('click', () => setOpen(panel.hidden));

    // Pulsar fuera del panel lo cierra; dentro se pueden usar sus controles
    document.addEventListener('click', (e) => {
        if (!panel.hidden && !panel.contains(e.target) && !toggle.contains(e.target)) {
            setOpen(false);
        }
    });
})();
