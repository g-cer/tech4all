import { Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { Obiettivo } from "../entity/gestione_obiettivi/Obiettivo";
import { getPool } from "../../db/pool";

interface RigaObiettivo extends RowDataPacket {
  nome: string;
  descrizione: string;
  grafica_badge: string;
  quiz_da_superare: number;
}

function toEntity(riga: RigaObiettivo): Obiettivo {
  return new Obiettivo(
    riga.nome,
    riga.descrizione,
    riga.grafica_badge,
    riga.quiz_da_superare,
  );
}

/** Accesso alla tabella `obiettivo`. */
export class ObiettivoDao {
  constructor(private readonly db: Pool = getPool()) {}

  public async findAll(): Promise<Obiettivo[]> {
    const [righe] = await this.db.query<RigaObiettivo[]>(
      "SELECT * FROM obiettivo ORDER BY quiz_da_superare",
    );
    return righe.map(toEntity);
  }

  public async findByNome(nome: string): Promise<Obiettivo | null> {
    const [righe] = await this.db.query<RigaObiettivo[]>(
      "SELECT * FROM obiettivo WHERE nome = ?",
      [nome],
    );
    return righe.length > 0 ? toEntity(righe[0]) : null;
  }

  public async create(obiettivo: Obiettivo): Promise<void> {
    await this.db.query(
      `INSERT INTO obiettivo (nome, descrizione, grafica_badge, quiz_da_superare)
       VALUES (?, ?, ?, ?)`,
      [
        obiettivo.getNome(),
        obiettivo.getDescrizione(),
        obiettivo.getGraficaBadge(),
        obiettivo.getQuizDaSuperare(),
      ],
    );
  }

  public async update(obiettivo: Obiettivo): Promise<void> {
    await this.db.query(
      `UPDATE obiettivo
          SET descrizione = ?, grafica_badge = ?, quiz_da_superare = ?
        WHERE nome = ?`,
      [
        obiettivo.getDescrizione(),
        obiettivo.getGraficaBadge(),
        obiettivo.getQuizDaSuperare(),
        obiettivo.getNome(),
      ],
    );
  }

  public async delete(nome: string): Promise<boolean> {
    const [esito] = await this.db.query<ResultSetHeader>(
      "DELETE FROM obiettivo WHERE nome = ?",
      [nome],
    );
    return esito.affectedRows > 0;
  }
}
