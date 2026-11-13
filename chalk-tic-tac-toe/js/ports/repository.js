/**
 * RepositoryPort — persistence interface.
 * The domain expects an object implementing these methods.
 * Implemented by adapters/localStorage.js.
 */
const RepositoryPort = {
  /** @returns {{diff, score, round, soundOn}|null} saved preferences, or null. */
  load() {},
  /** @param {{diff: string, score: object, round: number, soundOn: boolean}} state */
  save(state) {},
};
