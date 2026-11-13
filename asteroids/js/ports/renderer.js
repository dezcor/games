/**
 * RendererPort: draws one frame from a read-only view of the domain state.
 * view = { width, height, state, ship, asteroids, bullets, ufo, ufoBullets, powerups,
 *          shipEffects, shipColor }
 * Implemented by adapters/canvas-renderer.js (CanvasRenderer).
 */
const RendererPort = {
    draw(view) {},
};
