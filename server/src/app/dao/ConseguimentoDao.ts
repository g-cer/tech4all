import { Pool, PoolConnection, RowDataPacket } from "mysql2/promise";
import { Conseguimento } from "../entity/gestione_obiettivi/Conseguimento";
import { getPool } from "../../db/pool";

interface RigaConseguimento extends RowDataPacket {
  utente_id: number;
  obiettivo_nome: string;
  data_conseguimento: Date;
}

function toEntity(riga: RigaConseguimento): Conseguimento {
  return new Conseguimento(
    riga.utente_id,
    riga.obiettivo_nome,
    new Date(riga.data_conseguimento),
  );
}

/** Accesso alla tabella `conseguimento`. */
export class ConseguimentoDao {
  constructor(private readonly db: Pool = getPool()) {}

  public async findByUtente(utenteId: number): Promise<Conseguimento[]> {
    const [righe] = await this.db.query<RigaConseguimento[]>(
      `SELECT * FROM conseguimento
        WHERE utente_id = ?
        ORDER BY data_conseguimento`,
      [utenteId],
    );
    return righe.map(toEntity);
  }

  /**
   * Registra il conseguimento se non già presente.
   * `INSERT IGNORE` rende l'operazione idempotente: rieseguire un quiz
   * già superato non deve duplicare né fallire.
   */
  public async assegna(
    conseguimento: Conseguimento,
    connection: Pool | PoolConnection = this.db,
  ): Promise<void> {
    await connection.query(
      `INSERT IGNORE INTO conseguimento
         (utente_id, obiettivo_nome, data_conseguimento)
       VALUES (?, ?, ?)`,
      [
        conseguimento.getUtenteId(),
        conseguimento.getObiettivoNome(),
        conseguimento.getDataConseguimento(),
      ],
    );
  }
}
