import { Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { Feedback } from "../entity/gestione_feedback/Feedback";
import { getPool } from "../../db/pool";

interface RigaFeedback extends RowDataPacket {
  valutazione: number;
  commento: string;
  utente_id: number;
  tutorial_id: number;
  data_creazione: Date | null;
}

function toEntity(riga: RigaFeedback): Feedback {
  return new Feedback(
    riga.valutazione,
    riga.commento,
    riga.utente_id,
    riga.tutorial_id,
    riga.data_creazione,
  );
}

/** Accesso alla tabella `feedback`. */
export class FeedbackDao {
  constructor(private readonly db: Pool = getPool()) {}

  public async findByTutorial(tutorialId: number): Promise<Feedback[]> {
    const [righe] = await this.db.query<RigaFeedback[]>(
      "SELECT * FROM feedback WHERE tutorial_id = ? ORDER BY data_creazione DESC",
      [tutorialId],
    );
    return righe.map(toEntity);
  }

  public async findByUtente(utenteId: number): Promise<Feedback[]> {
    const [righe] = await this.db.query<RigaFeedback[]>(
      "SELECT * FROM feedback WHERE utente_id = ? ORDER BY data_creazione DESC",
      [utenteId],
    );
    return righe.map(toEntity);
  }

  public async find(
    utenteId: number,
    tutorialId: number,
  ): Promise<Feedback | null> {
    const [righe] = await this.db.query<RigaFeedback[]>(
      "SELECT * FROM feedback WHERE utente_id = ? AND tutorial_id = ?",
      [utenteId, tutorialId],
    );
    return righe.length > 0 ? toEntity(righe[0]) : null;
  }

  public async create(feedback: Feedback): Promise<void> {
    await this.db.query(
      `INSERT INTO feedback (valutazione, commento, utente_id, tutorial_id)
       VALUES (?, ?, ?, ?)`,
      [
        feedback.getValutazione(),
        feedback.getCommento(),
        feedback.getUtenteId(),
        feedback.getTutorialId(),
      ],
    );
  }

  public async update(feedback: Feedback): Promise<void> {
    await this.db.query(
      `UPDATE feedback
          SET valutazione = ?, commento = ?
        WHERE utente_id = ? AND tutorial_id = ?`,
      [
        feedback.getValutazione(),
        feedback.getCommento(),
        feedback.getUtenteId(),
        feedback.getTutorialId(),
      ],
    );
  }

  public async delete(utenteId: number, tutorialId: number): Promise<boolean> {
    const [esito] = await this.db.query<ResultSetHeader>(
      "DELETE FROM feedback WHERE utente_id = ? AND tutorial_id = ?",
      [utenteId, tutorialId],
    );
    return esito.affectedRows > 0;
  }
}
