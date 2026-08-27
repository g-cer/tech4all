import path from "path";
import dotenv from "dotenv";

dotenv.config();

/**
 * Variabili d'ambiente richieste per avviare il server.
 * Sono raccolte qui in un unico punto: nessun altro modulo legge `process.env`.
 */
const REQUIRED_VARS = [
  "DB_HOST",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME",
  "JWT_SECRET",
] as const;

function read(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

function readInt(name: string, fallback: number): number {
  const parsed = Number.parseInt(read(name), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

const nodeEnv = read("NODE_ENV", "development");

export const env = {
  nodeEnv,
  isProduction: nodeEnv === "production",
  isTest: nodeEnv === "test",
  port: readInt("PORT", 5000),
  clientOrigin: read("CLIENT_ORIGIN", "http://localhost:3000"),

  db: {
    host: read("DB_HOST"),
    user: read("DB_USER"),
    password: read("DB_PASSWORD"),
    database: read("DB_NAME"),
    connectionLimit: readInt("DB_CONNECTION_LIMIT", 10),
  },

  jwt: {
    /** In test si usa un valore fittizio: nessun token reale viene emesso. */
    secret: read("JWT_SECRET", nodeEnv === "test" ? "test-secret" : ""),
    /** Durata del token di sessione. */
    expiresIn: read("JWT_EXPIRES_IN", "2h"),
    cookieName: "tech4all_token",
  },

  bcryptRounds: readInt("BCRYPT_ROUNDS", 10),

  /** Radice dei file caricati, servita staticamente su /uploads. */
  uploadsDir: path.resolve(__dirname, "../../uploads"),
} as const;

/**
 * Verifica che tutte le variabili obbligatorie siano valorizzate.
 * Va invocata una sola volta all'avvio: fallisce con un messaggio unico
 * che elenca tutto ciò che manca, invece di un errore per volta.
 *
 * @throws Error se una o più variabili obbligatorie sono assenti.
 */
export function assertEnv(): void {
  const missing = REQUIRED_VARS.filter((name) => !read(name));
  if (missing.length > 0) {
    throw new Error(
      `Variabili d'ambiente mancanti: ${missing.join(", ")}.\n` +
        "Copia server/.env.example in server/.env e valorizzale.",
    );
  }
}
