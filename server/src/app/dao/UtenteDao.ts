import {
  Pool,
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";
import { Utente } from "../entity/gestione_autenticazione/Utente";
import { Ruolo } from "../entity/gestione_autenticazione/Ruolo";
import { getPool } from "../../db/pool";

interface RigaUtente extends RowDataPacket {
  id: number;
  email: string;
  password_hash: string;
  nome: string;
  cognome: string;
  ruolo: Ruolo;
  quiz_superati: number;
}

function toEntity(riga: RigaUtente): Utente {
  return new Utente(
    riga.id,
    riga.email,
    riga.password_hash,
    riga.nome,
    riga.cognome,
    riga.ruolo,
    riga.quiz_superati,
  );
}

/** Accesso alla tabella `utente`. */
export class UtenteDao {
  constructor(private readonly db: Pool = getPool()) {}

  public async findAll(): Promise<Utente[]> {
    const [righe] = await this.db.query<RigaUtente[]>(
      "SELECT * FROM utente ORDER BY cognome, nome",
    );
    return righe.map(toEntity);
  }

  public async findById(id: number): Promise<Utente | null> {
    const [righe] = await this.db.query<RigaUtente[]>(
      "SELECT * FROM utente WHERE id = ?",
      [id],
    );
    return righe.length > 0 ? toEntity(righe[0]) : null;
  }

  public async findByEmail(email: string): Promise<Utente | null> {
    const [righe] = await this.db.query<RigaUtente[]>(
      "SELECT * FROM utente WHERE email = ?",
      [email],
    );
    return righe.length > 0 ? toEntity(righe[0]) : null;
  }

  /**
   * Inserisce un nuovo utente.
   *
   * @returns L'utente persistito, completo dell'id assegnato dal database.
   */
  public async create(utente: Utente): Promise<Utente> {
    const [esito] = await this.db.query<ResultSetHeader>(
      `INSERT INTO utente (email, password_hash, nome, cognome, ruolo, quiz_superati)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        utente.getEmail(),
        utente.getPasswordHash(),
        utente.getNome(),
        utente.getCognome(),
        utente.getRuolo(),
        utente.getQuizSuperati(),
      ],
    );

    return new Utente(
      esito.insertId,
      utente.getEmail(),
      utente.getPasswordHash(),
      utente.getNome(),
      utente.getCognome(),
      utente.getRuolo(),
      utente.getQuizSuperati(),
    );
  }

  /** Aggiorna i dati anagrafici e le credenziali di un utente esistente. */
  public async update(utente: Utente): Promise<void> {
    await this.db.query(
      `UPDATE utente
          SET email = ?, password_hash = ?, nome = ?, cognome = ?, ruolo = ?
        WHERE id = ?`,
      [
        utente.getEmail(),
        utente.getPasswordHash(),
        utente.getNome(),
        utente.getCognome(),
        utente.getRuolo(),
        utente.getId(),
      ],
    );
  }

  /**
   * Aggiorna il contatore dei quiz superati.
   *
   * @param connection Connessione transazionale, quando l'aggiornamento fa
   *   parte di una transazione già aperta: usare il pool bloccherebbe la
   *   riga contro i lock della transazione stessa.
   */
  public async updateQuizSuperati(
    utenteId: number,
    quizSuperati: number,
    connection: Pool | PoolConnection = this.db,
  ): Promise<void> {
    await connection.query("UPDATE utente SET quiz_superati = ? WHERE id = ?", [
      quizSuperati,
      utenteId,
    ]);
  }

  /** Elimina l'utente; i dati collegati cadono per vincolo di integrità. */
  public async delete(id: number): Promise<boolean> {
    const [esito] = await this.db.query<ResultSetHeader>(
      "DELETE FROM utente WHERE id = ?",
      [id],
    );
    return esito.affectedRows > 0;
  }
}
