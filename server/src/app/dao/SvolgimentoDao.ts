import { Pool, PoolConnection, RowDataPacket } from "mysql2/promise";
import { Svolgimento } from "../entity/gestione_quiz/Svolgimento";
import { getPool } from "../../db/pool";

interface RigaSvolgimento extends RowDataPacket {
  utente_id: number;
  quiz_id: number;
  esito: number;
  data_conseguimento: Date;
  risposte_esatte: number;
}

function toEntity(riga: RigaSvolgimento): Svolgimento {
  return new Svolgimento(
    riga.quiz_id,
    riga.utente_id,
    riga.esito === 1,
    new Date(riga.data_conseguimento),
    riga.risposte_esatte,
  );
}

/** Accesso alla tabella `svolgimento`. */
export class SvolgimentoDao {
  constructor(private readonly db: Pool = getPool()) {}

  public async find(
    quizId: number,
    utenteId: number,
  ): Promise<Svolgimento | null> {
    const [righe] = await this.db.query<RigaSvolgimento[]>(
      "SELECT * FROM svolgimento WHERE quiz_id = ? AND utente_id = ?",
      [quizId, utenteId],
    );
    return righe.length > 0 ? toEntity(righe[0]) : null;
  }

  public async findByUtente(utenteId: number): Promise<Svolgimento[]> {
    const [righe] = await this.db.query<RigaSvolgimento[]>(
      "SELECT * FROM svolgimento WHERE utente_id = ? ORDER BY data_conseguimento DESC",
      [utenteId],
    );
    return righe.map(toEntity);
  }

  /**
   * Inserisce lo svolgimento o ne aggiorna l'esito se già presente.
   * Un unico statement evita la corsa fra lettura e scrittura quando lo
   * stesso utente consegna due volte lo stesso quiz.
   */
  public async save(
    svolgimento: Svolgimento,
    connection: Pool | PoolConnection = this.db,
  ): Promise<void> {
    await connection.query(
      `INSERT INTO svolgimento
         (utente_id, quiz_id, esito, data_conseguimento, risposte_esatte)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         esito = VALUES(esito),
         data_conseguimento = VALUES(data_conseguimento),
         risposte_esatte = VALUES(risposte_esatte)`,
      [
        svolgimento.getUtenteId(),
        svolgimento.getQuizId(),
        svolgimento.getEsito(),
        svolgimento.getDataConseguimento(),
        svolgimento.getRisposteEsatte(),
      ],
    );
  }

  /** Numero di quiz distinti superati dall'utente. */
  public async contaQuizSuperati(
    utenteId: number,
    connection: Pool | PoolConnection = this.db,
  ): Promise<number> {
    const [righe] = await connection.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS totale FROM svolgimento WHERE utente_id = ? AND esito = TRUE",
      [utenteId],
    );
    return Number(righe[0]?.totale ?? 0);
  }
}
