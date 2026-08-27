import { Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { Tutorial } from "../entity/gestione_tutorial/Tutorial";
import { Categoria } from "../entity/gestione_tutorial/Categoria";
import { getPool } from "../../db/pool";

interface RigaTutorial extends RowDataPacket {
  id: number;
  titolo: string;
  grafica: string;
  testo: string;
  categoria: Categoria;
  valutazione: string | number | null;
}

function toEntity(riga: RigaTutorial): Tutorial {
  return new Tutorial(
    riga.id,
    riga.titolo,
    riga.grafica,
    riga.testo,
    riga.categoria,
    riga.valutazione === null ? null : Number(riga.valutazione),
  );
}

/** Accesso alla tabella `tutorial`. */
export class TutorialDao {
  constructor(private readonly db: Pool = getPool()) {}

  public async findAll(): Promise<Tutorial[]> {
    const [righe] = await this.db.query<RigaTutorial[]>(
      "SELECT * FROM tutorial ORDER BY id DESC",
    );
    return righe.map(toEntity);
  }

  public async findById(id: number): Promise<Tutorial | null> {
    const [righe] = await this.db.query<RigaTutorial[]>(
      "SELECT * FROM tutorial WHERE id = ?",
      [id],
    );
    return righe.length > 0 ? toEntity(righe[0]) : null;
  }

  public async findByCategoria(categoria: Categoria): Promise<Tutorial[]> {
    const [righe] = await this.db.query<RigaTutorial[]>(
      "SELECT * FROM tutorial WHERE categoria = ? ORDER BY id DESC",
      [categoria],
    );
    return righe.map(toEntity);
  }

  /** Cerca per parola chiave su titolo, testo e categoria. */
  public async search(parolaChiave: string): Promise<Tutorial[]> {
    const pattern = `%${parolaChiave}%`;
    const [righe] = await this.db.query<RigaTutorial[]>(
      `SELECT * FROM tutorial
        WHERE titolo LIKE ? OR testo LIKE ? OR categoria LIKE ?
        ORDER BY id DESC`,
      [pattern, pattern, pattern],
    );
    return righe.map(toEntity);
  }

  /**
   * Inserisce un nuovo tutorial.
   *
   * @returns Il tutorial persistito, completo dell'id assegnato dal database.
   */
  public async create(tutorial: Tutorial): Promise<Tutorial> {
    const [esito] = await this.db.query<ResultSetHeader>(
      `INSERT INTO tutorial (titolo, grafica, testo, categoria)
       VALUES (?, ?, ?, ?)`,
      [
        tutorial.getTitolo(),
        tutorial.getGrafica(),
        tutorial.getTesto(),
        tutorial.getCategoria(),
      ],
    );

    return new Tutorial(
      esito.insertId,
      tutorial.getTitolo(),
      tutorial.getGrafica(),
      tutorial.getTesto(),
      tutorial.getCategoria(),
      null,
    );
  }

  /**
   * Aggiorna un tutorial esistente. La colonna `valutazione` non viene
   * toccata: è mantenuta dai trigger sulla tabella `feedback`.
   */
  public async update(tutorial: Tutorial): Promise<void> {
    await this.db.query(
      `UPDATE tutorial
          SET titolo = ?, grafica = ?, testo = ?, categoria = ?
        WHERE id = ?`,
      [
        tutorial.getTitolo(),
        tutorial.getGrafica(),
        tutorial.getTesto(),
        tutorial.getCategoria(),
        tutorial.getId(),
      ],
    );
  }

  /** Elimina il tutorial; quiz e feedback collegati cadono in cascata. */
  public async delete(id: number): Promise<boolean> {
    const [esito] = await this.db.query<ResultSetHeader>(
      "DELETE FROM tutorial WHERE id = ?",
      [id],
    );
    return esito.affectedRows > 0;
  }
}
