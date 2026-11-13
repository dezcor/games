/**
 * InputPort — player commands the domain reacts to.
 * Mouse, keyboard and buttons are mapped to these by adapters/input.js.
 */
const InputPort = {
  /** The player picks cell `index` (click or keys 1–9). */
  onCell(index) {},
  /** Next round ("Otra vez", ↻, or N). */
  onNewRound() {},
  /** A difficulty button: start a new game at `difficulty`. */
  onNewGame(difficulty) {},
  /** Reset the scoreboard (after confirmation). */
  onReset() {},
  /** Sound button or M. */
  onToggleSound() {},
  /** Back to the hub. */
  onMenu() {},
};
