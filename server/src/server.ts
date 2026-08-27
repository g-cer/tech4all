import { creaApp } from "./app";
import { assertEnv, env } from "./config/env";
import { closePool } from "./db/pool";

/** Avvia il server HTTP, verificando prima la configurazione. */
function avvia(): void {
  try {
    assertEnv();
  } catch (error) {
    console.error((error as Error).message);
    process.exit(1);
  }

  const server = creaApp().listen(env.port, () => {
    console.log(`Server avviato su http://localhost:${env.port}`);
  });

  const spegni = (segnale: string): void => {
    console.log(`\n${segnale} ricevuto: chiusura in corso.`);
    server.close(() => {
      void closePool().finally(() => process.exit(0));
    });
  };

  process.on("SIGINT", () => spegni("SIGINT"));
  process.on("SIGTERM", () => spegni("SIGTERM"));
}

avvia();
