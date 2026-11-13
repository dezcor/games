/**
 * El Gato composition root — builds the domain game, wires it to the adapters and starts it.
 */

const game = new CatGame(
  { aiDelayMin: AI_DELAY_MIN, aiDelayJitter: AI_DELAY_JITTER },
  {
    repository: LocalStorageAdapter,
    renderer: DomRendererAdapter,
    sound: SoundAdapter,
    timer: TimerAdapter,
  }
);
window.game = game;

DomRendererAdapter.init({ effects: DustAdapter });

InputAdapter.init({
  onCell: (index) => game.playerMove(index),
  onNewRound: () => game.newRound(),
  onNewGame: (difficulty) => game.newGame(difficulty),
  onReset: () => game.newGame(game.difficulty),
  onToggleSound: () => game.toggleSound(),
  onMenu: () => {
    SoundAdapter.ui();
    window.location.href = "../index.html";
  },
});

game.init();

DustAdapter.init();
DustAdapter.start();
