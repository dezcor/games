/**
 * LocalStorageAdapter — implements RepositoryPort.
 * Stores { diff, score, round, soundOn } under the same key as before.
 */
const LocalStorageAdapter = {
  load() {
    try {
      return JSON.parse(localStorage.getItem(GATO_STORAGE_KEY) || "null");
    } catch (error) {
      return null;
    }
  },

  save(state) {
    try {
      localStorage.setItem(GATO_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      // Storage can be unavailable (private browsing); the game keeps working without it.
    }
  },
};
