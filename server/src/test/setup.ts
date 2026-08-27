/*
 * Configurazione comune a tutte le suite.
 *
 * Il pool MySQL è sostituito da un doppio: nessun test apre una connessione,
 * quindi la suite gira ovunque senza un database e senza variabili d'ambiente
 * reali. I DAO sono comunque simulati dai singoli test.
 */
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "segreto-di-test";
process.env.CLIENT_ORIGIN = "http://localhost:3000";

jest.mock("../db/pool", () => {
  const connessioneFinta = { query: jest.fn().mockResolvedValue([[], []]) };
  return {
    getPool: () => connessioneFinta,
    withTransaction: <T>(lavoro: (c: unknown) => Promise<T>): Promise<T> =>
      lavoro(connessioneFinta),
    closePool: jest.fn().mockResolvedValue(undefined),
  };
});
