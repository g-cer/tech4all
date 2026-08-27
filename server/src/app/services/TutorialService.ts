import { TutorialDao } from "../dao/TutorialDao";
import { Tutorial } from "../entity/gestione_tutorial/Tutorial";
import {
  CATEGORIE,
  Categoria,
  isCategoria,
} from "../entity/gestione_tutorial/Categoria";
import { NotFoundError, ValidationError } from "../errors/AppError";
import { TUTORIAL } from "../validation/regole";
import { sanificaHtmlTutorial } from "../validation/sanitize";

/** Dati di creazione o aggiornamento di un tutorial. */
export interface DatiTutorial {
  titolo: string;
  grafica: string;
  testo: string;
  categoria: string;
}

/** Creazione, aggiornamento e consultazione del catalogo dei tutorial. */
export class TutorialService {
  constructor(private readonly tutorialDao: TutorialDao = new TutorialDao()) {}

  /**
   * Catalogo dei tutorial, opzionalmente ristretto a una categoria.
   *
   * @throws ValidationError se la categoria indicata non esiste.
   */
  public async getTutorials(categoria?: string): Promise<Tutorial[]> {
    if (categoria === undefined || categoria === "") {
      return this.tutorialDao.findAll();
    }
    return this.tutorialDao.findByCategoria(this.validaCategoria(categoria));
  }

  /**
   * @throws NotFoundError se il tutorial non esiste.
   */
  public async getTutorial(id: number): Promise<Tutorial> {
    const tutorial = await this.tutorialDao.findById(id);
    if (!tutorial) {
      throw new NotFoundError("Tutorial non trovato.");
    }
    return tutorial;
  }

  /** Ricerca per parola chiave su titolo, testo e categoria. */
  public async cercaTutorial(parolaChiave: string): Promise<Tutorial[]> {
    const chiave = parolaChiave.trim();
    if (chiave.length === 0) {
      return [];
    }
    return this.tutorialDao.search(chiave);
  }

  /**
   * Crea un tutorial. Il corpo HTML viene sanificato prima della persistenza.
   *
   * @throws ValidationError se uno dei campi non rispetta i vincoli di dominio.
   */
  public async creaTutorial(dati: DatiTutorial): Promise<Tutorial> {
    const categoria = this.validaCategoria(dati.categoria);
    this.validaContenuto(dati);

    return this.tutorialDao.create(
      new Tutorial(
        undefined,
        dati.titolo.trim(),
        dati.grafica,
        sanificaHtmlTutorial(dati.testo),
        categoria,
      ),
    );
  }

  /**
   * Aggiorna un tutorial esistente.
   *
   * @throws NotFoundError se il tutorial non esiste.
   * @throws ValidationError se uno dei campi non rispetta i vincoli di dominio.
   */
  public async aggiornaTutorial(
    id: number,
    dati: DatiTutorial,
  ): Promise<Tutorial> {
    const tutorial = await this.getTutorial(id);
    const categoria = this.validaCategoria(dati.categoria);
    this.validaContenuto(dati);

    tutorial.setTitolo(dati.titolo.trim());
    tutorial.setGrafica(dati.grafica);
    tutorial.setTesto(sanificaHtmlTutorial(dati.testo));
    tutorial.setCategoria(categoria);

    await this.tutorialDao.update(tutorial);
    return tutorial;
  }

  /**
   * @throws NotFoundError se il tutorial non esiste.
   */
  public async eliminaTutorial(id: number): Promise<void> {
    const eliminato = await this.tutorialDao.delete(id);
    if (!eliminato) {
      throw new NotFoundError("Tutorial non trovato.");
    }
  }

  private validaCategoria(valore: string): Categoria {
    if (!isCategoria(valore)) {
      throw new ValidationError(
        `Categoria non valida. Valori ammessi: ${CATEGORIE.join(", ")}.`,
      );
    }
    return valore;
  }

  private validaContenuto(dati: DatiTutorial): void {
    const titolo = dati.titolo?.trim() ?? "";
    if (
      titolo.length < TUTORIAL.titoloMin ||
      titolo.length > TUTORIAL.titoloMax
    ) {
      throw new ValidationError(
        `Il titolo deve avere tra ${TUTORIAL.titoloMin} e ${TUTORIAL.titoloMax} caratteri.`,
      );
    }

    if (!TUTORIAL.graficaRegex.test(dati.grafica ?? "")) {
      throw new ValidationError(
        "Formato immagine non valido. Sono ammessi png, jpg, jpeg e webp.",
      );
    }

    const testo = dati.testo ?? "";
    if (testo.length < TUTORIAL.testoMin || testo.length > TUTORIAL.testoMax) {
      throw new ValidationError(
        `Il testo deve avere tra ${TUTORIAL.testoMin} e ${TUTORIAL.testoMax} caratteri.`,
      );
    }
  }
}
