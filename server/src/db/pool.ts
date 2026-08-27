import mysql, { Pool, PoolConnection } from "mysql2/promise";
import { env } from "../config/env";

let pool: Pool | undefined;

/**
 * Restituisce il connection pool MySQL condiviso, creandolo al primo utilizzo.
 * `mysql.createPool` non apre connessioni finché non arriva la prima query:
 * importare questo modulo è quindi innocuo nei test.
 */
export function getPool(): Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: env.db.host,
      user: env.db.user,
      password: env.db.password,
      database: env.db.database,
      waitForConnections: true,
      connectionLimit: env.db.connectionLimit,
      dateStrings: false,
    });
  }
  return pool;
}

/**
 * Esegue `work` dentro una transazione, effettuando commit in caso di
 * successo e rollback al primo errore. La connessione viene sempre rilasciata.
 *
 * @param work Operazioni da eseguire sulla connessione transazionale.
 * @returns Il valore restituito da `work`.
 */
export async function withTransaction<T>(
  work: (connection: PoolConnection) => Promise<T>,
): Promise<T> {
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/** Chiude il pool. Usato allo spegnimento del server. */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
