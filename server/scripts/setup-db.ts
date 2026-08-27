/**
 * Crea il database Tech4All e, se richiesto, lo popola con i dati di esempio.
 *
 *   npm run db:setup          crea lo schema
 *   npm run db:setup -- --seed  crea lo schema e inserisce i dati di esempio
 *
 * Usa le stesse variabili d'ambiente del server (server/.env) e non richiede
 * il client `mysql` a riga di comando.
 */
import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import { env } from "../src/config/env";

const DIR_SQL = path.resolve(__dirname, "../src/db");

/** Nome del database usato dagli script SQL versionati. */
const DB_PREDEFINITO = "tech4all";

/**
 * Adatta gli script al nome di database configurato in `DB_NAME`.
 * La sostituzione tocca soltanto le istruzioni DDL che nominano il database,
 * mai il contenuto dei dati.
 */
function adattaNomeDatabase(sql: string): string {
  if (env.db.database === DB_PREDEFINITO) {
    return sql;
  }
  return sql.replace(
    new RegExp(
      `\\b(DROP DATABASE IF EXISTS|CREATE DATABASE|USE)\\s+${DB_PREDEFINITO}\\b`,
      "gi",
    ),
    `$1 ${env.db.database}`,
  );
}

/**
 * Divide uno script SQL in statement eseguibili.
 *
 * `DELIMITER` è una direttiva del client `mysql` a riga di comando, non SQL:
 * qui viene interpretata per poter inviare trigger e procedure come singoli
 * statement attraverso il driver.
 */
function dividiStatement(sql: string): string[] {
  const statement: string[] = [];
  let delimitatore = ";";
  let corrente = "";

  for (const riga of sql.split(/\r?\n/)) {
    const direttiva = riga.trim().match(/^DELIMITER\s+(\S+)$/i);
    if (direttiva) {
      delimitatore = direttiva[1];
      continue;
    }

    corrente += `${riga}\n`;

    if (riga.trimEnd().endsWith(delimitatore)) {
      const completo = corrente.trimEnd().slice(0, -delimitatore.length).trim();
      if (completo.length > 0) {
        statement.push(completo);
      }
      corrente = "";
    }
  }

  const residuo = corrente.trim();
  if (residuo.length > 0) {
    statement.push(residuo);
  }
  return statement;
}

async function eseguiFile(
  connessione: mysql.Connection,
  nomeFile: string,
): Promise<void> {
  const sql = adattaNomeDatabase(
    fs.readFileSync(path.join(DIR_SQL, nomeFile), "utf8"),
  );
  const statement = dividiStatement(sql);
  for (const singolo of statement) {
    await connessione.query(singolo);
  }
  console.log(`${nomeFile}: ${statement.length} statement eseguiti.`);
}

async function main(): Promise<void> {
  const conSeed = process.argv.includes("--seed");

  const connessione = await mysql.createConnection({
    host: env.db.host,
    user: env.db.user,
    password: env.db.password,
    multipleStatements: false,
  });

  try {
    await eseguiFile(connessione, "schema.sql");
    if (conSeed) {
      await eseguiFile(connessione, "seed.sql");
    }
    console.log(
      `Database '${env.db.database}' pronto${conSeed ? " con i dati di esempio" : ""}.`,
    );
  } finally {
    await connessione.end();
  }
}

main().catch((errore: unknown) => {
  const messaggio = errore instanceof Error ? errore.message : String(errore);
  console.error(`Errore durante la preparazione del database: ${messaggio}`);
  process.exit(1);
});
