import { FeedbackDao } from "../dao/FeedbackDao";
import { TutorialDao } from "../dao/TutorialDao";
import { Feedback } from "../entity/gestione_feedback/Feedback";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../errors/AppError";
import { FEEDBACK } from "../validation/regole";

/** Contenuto di un feedback in creazione o aggiornamento. */
export interface DatiFeedback {
  valutazione: number;
  commento: string;
}

/**
 * Gestione dei feedback sui tutorial.
 *
 * L'autore è sempre l'utente autenticato: il servizio riceve il suo id dal
 * chiamante e non accetta di operare per conto di terzi.
 */
export class FeedbackService {
  constructor(
    private readonly feedbackDao: FeedbackDao = new FeedbackDao(),
    private readonly tutorialDao: TutorialDao = new TutorialDao(),
  ) {}

  public async getFeedbackTutorial(tutorialId: number): Promise<Feedback[]> {
    return this.feedbackDao.findByTutorial(tutorialId);
  }

  public async getFeedbackUtente(utenteId: number): Promise<Feedback[]> {
    return this.feedbackDao.findByUtente(utenteId);
  }

  /**
   * Registra il feedback di un utente su un tutorial.
   *
   * @throws ValidationError se valutazione o commento non rispettano i vincoli.
   * @throws NotFoundError se il tutorial non esiste.
   * @throws ConflictError se l'utente ha già valutato quel tutorial.
   */
  public async creaFeedback(
    utenteId: number,
    tutorialId: number,
    dati: DatiFeedback,
  ): Promise<Feedback> {
    this.validaDati(dati);

    const tutorial = await this.tutorialDao.findById(tutorialId);
    if (!tutorial) {
      throw new NotFoundError("Tutorial non trovato.");
    }

    const esistente = await this.feedbackDao.find(utenteId, tutorialId);
    if (esistente) {
      throw new ConflictError(
        "Hai già lasciato un feedback per questo tutorial.",
      );
    }

    const feedback = new Feedback(
      dati.valutazione,
      dati.commento.trim(),
      utenteId,
      tutorialId,
    );
    await this.feedbackDao.create(feedback);
    return feedback;
  }

  /**
   * Aggiorna il proprio feedback su un tutorial.
   *
   * @throws NotFoundError se il feedback non esiste.
   * @throws ValidationError se i dati non rispettano i vincoli.
   */
  public async aggiornaFeedback(
    utenteId: number,
    tutorialId: number,
    dati: DatiFeedback,
  ): Promise<Feedback> {
    this.validaDati(dati);

    const feedback = await this.feedbackDao.find(utenteId, tutorialId);
    if (!feedback) {
      throw new NotFoundError("Feedback non trovato.");
    }

    feedback.setValutazione(dati.valutazione);
    feedback.setCommento(dati.commento.trim());
    await this.feedbackDao.update(feedback);
    return feedback;
  }

  /**
   * Elimina un feedback.
   *
   * @param richiedenteId Utente che chiede la cancellazione.
   * @param autoreId Autore del feedback da eliminare.
   * @param isAdmin True se il richiedente è amministratore: può moderare
   *   i feedback altrui.
   * @throws NotFoundError se il feedback non esiste o non è visibile al richiedente.
   */
  public async eliminaFeedback(
    richiedenteId: number,
    autoreId: number,
    tutorialId: number,
    isAdmin: boolean,
  ): Promise<void> {
    if (!isAdmin && richiedenteId !== autoreId) {
      // Si risponde 404 e non 403 per non rivelare l'esistenza del feedback.
      throw new NotFoundError("Feedback non trovato.");
    }

    const eliminato = await this.feedbackDao.delete(autoreId, tutorialId);
    if (!eliminato) {
      throw new NotFoundError("Feedback non trovato.");
    }
  }

  private validaDati(dati: DatiFeedback): void {
    const { valutazioneMin, valutazioneMax, commentoMin, commentoMax } =
      FEEDBACK;

    if (
      !Number.isInteger(dati.valutazione) ||
      dati.valutazione < valutazioneMin ||
      dati.valutazione > valutazioneMax
    ) {
      throw new ValidationError(
        `La valutazione deve essere un intero tra ${valutazioneMin} e ${valutazioneMax}.`,
      );
    }

    const commento = dati.commento?.trim() ?? "";
    if (commento.length < commentoMin || commento.length > commentoMax) {
      throw new ValidationError(
        `Il commento deve avere tra ${commentoMin} e ${commentoMax} caratteri.`,
      );
    }
  }
}
