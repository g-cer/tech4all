import {
  Pool,
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";
import { Quiz } from "../entity/gestione_quiz/Quiz";
import { Domanda } from "../entity/gestione_quiz/Domanda";
import { Risposta } from "../entity/gestione_quiz/Risposta";
import { getPool } from "../../db/pool";

/**
 * Riga del join quiz-domanda-risposta. Domande e risposte non hanno ciclo di
 * vita autonomo (cadono in cascata con il quiz), perciò l'intero aggregato è
 * gestito da un unico DAO e caricato con una sola query.
 */
interface RigaQuiz extends RowDataPacket {
  quiz_id: number;
  tutorial_id: number;
  domanda_id: number | null;
  domanda_testo: string | null;
  risposta_id: number | null;
  risposta_testo: string | null;
  corretta: number | null;
}

const SELECT_AGGREGATO = `
  SELECT q.id            AS quiz_id,
         q.tutorial_id   AS tutorial_id,
         d.id            AS domanda_id,
         d.domanda       AS domanda_testo,
         r.id            AS risposta_id,
         r.risposta      AS risposta_testo,
         r.corretta      AS corretta
    FROM quiz q
    LEFT JOIN domanda  d ON d.quiz_id = q.id
    LEFT JOIN risposta r ON r.domanda_id = d.id`;

function assembla(righe: RigaQuiz[]): Quiz | null {
  if (righe.length === 0) {
    return null;
  }

  const domande = new Map<number, Domanda>();
  for (const riga of righe) {
    if (riga.domanda_id === null) {
      continue;
    }

    let domanda = domande.get(riga.domanda_id);
    if (!domanda) {
      domanda = new Domanda(
        riga.domanda_testo ?? "",
        [],
        riga.quiz_id,
        riga.domanda_id,
      );
      domande.set(riga.domanda_id, domanda);
    }

    if (riga.risposta_id !== null) {
      domanda
        .getRisposte()
        .push(
          new Risposta(
            riga.risposta_testo ?? "",
            riga.corretta === 1,
            riga.domanda_id,
            riga.risposta_id,
          ),
        );
    }
  }

  return new Quiz(
    righe[0].tutorial_id,
    [...domande.values()],
    righe[0].quiz_id,
  );
}

/** Accesso all'aggregato quiz (quiz, domande, risposte). */
export class QuizDao {
  constructor(private readonly db: Pool = getPool()) {}

  public async findById(id: number): Promise<Quiz | null> {
    const [righe] = await this.db.query<RigaQuiz[]>(
      `${SELECT_AGGREGATO} WHERE q.id = ? ORDER BY d.id, r.id`,
      [id],
    );
    return assembla(righe);
  }

  public async findByTutorial(tutorialId: number): Promise<Quiz | null> {
    const [righe] = await this.db.query<RigaQuiz[]>(
      `${SELECT_AGGREGATO} WHERE q.tutorial_id = ? ORDER BY d.id, r.id`,
      [tutorialId],
    );
    return assembla(righe);
  }

  /**
   * Inserisce quiz, domande e risposte.
   *
   * @param quiz Aggregato da persistere.
   * @param connection Connessione transazionale fornita dal chiamante: la
   *   creazione coinvolge più tabelle e deve essere atomica.
   * @returns L'id assegnato al quiz.
   */
  public async create(quiz: Quiz, connection: PoolConnection): Promise<number> {
    const [esitoQuiz] = await connection.query<ResultSetHeader>(
      "INSERT INTO quiz (tutorial_id) VALUES (?)",
      [quiz.getTutorialId()],
    );
    const quizId = esitoQuiz.insertId;

    for (const domanda of quiz.getDomande()) {
      const [esitoDomanda] = await connection.query<ResultSetHeader>(
        "INSERT INTO domanda (quiz_id, domanda) VALUES (?, ?)",
        [quizId, domanda.getTesto()],
      );
      const domandaId = esitoDomanda.insertId;
      domanda.setId(domandaId);
      domanda.setQuizId(quizId);

      for (const risposta of domanda.getRisposte()) {
        const [esitoRisposta] = await connection.query<ResultSetHeader>(
          "INSERT INTO risposta (domanda_id, risposta, corretta) VALUES (?, ?, ?)",
          [domandaId, risposta.getTesto(), risposta.isCorretta()],
        );
        risposta.setId(esitoRisposta.insertId);
        risposta.setDomandaId(domandaId);
      }
    }

    quiz.setId(quizId);
    return quizId;
  }

  /**
   * Sostituisce integralmente le domande di un quiz esistente.
   * Le vecchie domande vengono eliminate: le risposte cadono in cascata.
   */
  public async replaceDomande(
    quizId: number,
    domande: Domanda[],
    connection: PoolConnection,
  ): Promise<void> {
    await connection.query("DELETE FROM domanda WHERE quiz_id = ?", [quizId]);

    for (const domanda of domande) {
      const [esitoDomanda] = await connection.query<ResultSetHeader>(
        "INSERT INTO domanda (quiz_id, domanda) VALUES (?, ?)",
        [quizId, domanda.getTesto()],
      );
      const domandaId = esitoDomanda.insertId;
      domanda.setId(domandaId);
      domanda.setQuizId(quizId);

      for (const risposta of domanda.getRisposte()) {
        const [esitoRisposta] = await connection.query<ResultSetHeader>(
          "INSERT INTO risposta (domanda_id, risposta, corretta) VALUES (?, ?, ?)",
          [domandaId, risposta.getTesto(), risposta.isCorretta()],
        );
        risposta.setId(esitoRisposta.insertId);
        risposta.setDomandaId(domandaId);
      }
    }
  }

  /** Elimina il quiz; domande, risposte e svolgimenti cadono in cascata. */
  public async delete(id: number): Promise<boolean> {
    const [esito] = await this.db.query<ResultSetHeader>(
      "DELETE FROM quiz WHERE id = ?",
      [id],
    );
    return esito.affectedRows > 0;
  }
}
