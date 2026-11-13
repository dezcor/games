/**
 * InputAdapter — implements InputPort.
 * Maps DOM events (cell clicks, buttons, keyboard shortcuts) to the handlers the composition root provides.
 */
const InputAdapter = {
  init(handlers) {
    document.getElementById("cells").addEventListener("click", (event) => {
      const cell = event.target.closest(".cell.empty");
      if (cell) handlers.onCell(Number(cell.dataset.i));
    });

    document.querySelectorAll(".diff").forEach((button) => {
      button.addEventListener("click", () => handlers.onNewGame(button.dataset.diff));
    });

    document.getElementById("btnNew").addEventListener("click", () => handlers.onNewRound());
    document.getElementById("btnNext").addEventListener("click", () => handlers.onNewRound());
    document.getElementById("btnMenu").addEventListener("click", () => handlers.onMenu());
    document.getElementById("btnMute").addEventListener("click", () => handlers.onToggleSound());
    document.getElementById("btnReset").addEventListener("click", () => {
      if (window.confirm("¿Borrar marcador y empezar de cero?")) handlers.onReset();
    });

    document.addEventListener("keydown", (event) => {
      // Browser shortcuts (Ctrl+B, Ctrl+N, ⌘+M…) and held keys must not trigger game actions.
      if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
      const key = event.key;
      if (key === "n" || key === "N") {
        handlers.onNewRound();
      } else if (key === "m" || key === "M") {
        handlers.onToggleSound();
      } else if (key === "b" || key === "B") {
        if (window.confirm("¿Borrar marcador?")) handlers.onReset();
      } else if (/^[1-9]$/.test(key)) {
        handlers.onCell(Number(key) - 1);
      }
    });
  },
};
