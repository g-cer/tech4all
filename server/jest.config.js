/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.test.ts"],
  setupFiles: ["<rootDir>/src/test/setup.ts"],
  clearMocks: true,
  // La copertura è misurata sul codice che contiene decisioni: servizi,
  // rotte, middleware, errori e serializzazione. Le entità sono contenitori
  // di dati con soli accessori e sono esercitate indirettamente da tutte le
  // suite: includerle gonfierebbe la metrica senza aggiungere garanzie.
  collectCoverageFrom: [
    "src/app/services/**/*.ts",
    "src/app/routes/**/*.ts",
    "src/app/middleware/**/*.ts",
    "src/app/errors/**/*.ts",
    "src/app/dto/**/*.ts",
  ],
  coverageReporters: ["text", "lcov"],
  // Soglia verificata dalla CI: la copertura è un vincolo del progetto,
  // non un dato riportato a posteriori nella documentazione.
  coverageThreshold: {
    global: {
      statements: 85,
      branches: 80,
      functions: 85,
      lines: 85,
    },
  },
};
