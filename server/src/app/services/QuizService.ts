import { QuizDao } from "../dao/QuizDao";
import { SvolgimentoDao } from "../dao/SvolgimentoDao";
import { UtenteDao } from "../dao/UtenteDao";
import { TutorialDao } from "../dao/TutorialDao";
import { ObiettivoService } from "./ObiettivoService";
import { Quiz } from "../entity/gestione_quiz/Quiz";
import { Domanda } from "../entity/gestione_quiz/Domanda";
import { Risposta } from "../entity/gestione_quiz/Risposta";
import { Svolgimento } from "../entity/gestione_quiz/Svolgimento";
import { Obiettivo } from "../entity/gestione_obiettivi/Obiettivo";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../errors/AppError";
import { QUIZ } from "../validation/regole";
import { withTransaction } from "../../db/pool";

/** Domanda inviata dal client in creazione o aggiornamento di un quiz. */
export interface DatiDomanda {
  testo: string;
  risposte: { testo: string; corretta: boolean }[];
}

/** Risposta data dall'utente a una specifica domanda. */
export interface RispostaFornita {
  domandaId: number;
  rispostaId: number;
}

/** Esito della correzione di un quiz. */
export interface EsitoSvolgimento {
  esito: boolean;
  risposteEsatte: number;
  totaleDomande: number;
  soluzioni: { domandaId: number; rispostaCorrettaId: number }[];
  obiettiviSbloccati: Obiettivo[];
}

/**
 * Gestione dei quiz e della loro correzione.
 *
 * La correzione avviene esclusivamente qui: il client riceve il quiz privo
 * delle soluzioni e le ottiene solo dopo aver consegnato le proprie risposte.
 */
export class QuizService {
  constructor(
    private readonly quizDao: QuizDao = new QuizDao(),
    private readonly svolgimentoDao: SvolgimentoDao = new SvolgimentoDao(),
    private readonly utenteDao: UtenteDao = new UtenteDao(),
    private readonly tutorialDao: TutorialDao = new TutorialDao(),
    private readonly obiettivoService: ObiettivoService = new ObiettivoService(),
  ) {}

  /**
   * Quiz associato a un tutorial.
   *
   * @throws NotFoundError se il tutorial non ha un quiz.
   */
  public async getQuizPerTutorial(tutorialId: number): Promise<Quiz> {
    const quiz = await this.quizDao.findByTutorial(tutorialId);
    if (!quiz) {
      throw new NotFoundError("Nessun quiz associato a questo tutorial.");
    }
    return quiz;
  }

  /**
   * Crea il quiz di un tutorial. Quiz, domande e risposte sono inseriti in
   * un'unica transazione: un fallimento parziale non lascia quiz incompleti.
   *
   * @throws NotFoundError se il tutorial non esiste.
   * @throws ConflictError se il tutorial ha già un quiz.
   * @throws ValidationError se le domande non rispettano i vincoli di dominio.
   */
  public async creaQuiz(
    tutorialId: number,
    domande: DatiDomanda[],
  ): Promise<Quiz> {
    const tutorial = await this.tutorialDao.findById(tutorialId);
    if (!tutorial) {
      throw new NotFoundError("Tutorial non trovato.");
    }

    const esistente = await this.quizDao.findByTutorial(tutorialId);
    if (esistente) {
      throw new ConflictError("Questo tutorial ha già un quiz associato.");
    }

    const quiz = new Quiz(tutorialId, this.costruisciDomande(domande));
    await withTransaction((connection) =>
      this.quizDao.create(quiz, connection),
    );
    return quiz;
  }

  /**
   * Sostituisce integralmente le domande di un quiz esistente.
   *
   * Gli svolgimenti pregressi restano validi: si riferiscono al quiz, non
   * alle singole domande, e vengono ricalcolati al prossimo tentativo.
   *
   * @throws NotFoundError se il quiz non esiste.
   * @throws ValidationError se le domande non rispettano i vincoli di dominio.
   */
  public async aggiornaQuiz(
    quizId: number,
    domande: DatiDomanda[],
  ): Promise<Quiz> {
    const quiz = await this.quizDao.findById(quizId);
    if (!quiz) {
      throw new NotFoundError("Quiz non trovato.");
    }

    const nuoveDomande = this.costruisciDomande(domande);
    await withTransaction((connection) =>
      this.quizDao.replaceDomande(quizId, nuoveDomande, connection),
    );
    quiz.setDomande(nuoveDomande);
    return quiz;
  }

  /**
   * @throws NotFoundError se il quiz non esiste.
   */
  public async eliminaQuiz(quizId: number): Promise<void> {
    const eliminato = await this.quizDao.delete(quizId);
    if (!eliminato) {
      throw new NotFoundError("Quiz non trovato.");
    }
  }

  /**
   * Corregge le risposte di un utente, registra lo svolgimento e assegna
   * gli eventuali badge sbloccati.
   *
   * Il conteggio dei quiz superati è ricavato dagli svolgimenti registrati,
   * non incrementato a mano: resta corretto anche se lo stesso quiz viene
   * ripetuto più volte.
   *
   * @throws NotFoundError se il quiz o l'utente non esistono.
   * @throws ValidationError se il quiz non contiene domande.
   */
  public async eseguiQuiz(
    quizId: number,
    utenteId: number,
    risposteFornite: RispostaFornita[],
  ): Promise<EsitoSvolgimento> {
    const quiz = await this.quizDao.findById(quizId);
    if (!quiz) {
      throw new NotFoundError("Quiz non trovato.");
    }

    const utente = await this.utenteDao.findById(utenteId);
    if (!utente) {
      throw new NotFoundError("Utente non trovato.");
    }

    const domande = quiz.getDomande();
    if (domande.length === 0) {
      throw new ValidationError("Il quiz non contiene domande.");
    }

    // Le risposte sono associate per identificativo e non per posizione:
    // l'ordine con cui il client le invia è irrilevante.
    const sceltePerDomanda = new Map(
      risposteFornite.map((r) => [r.domandaId, r.rispostaId]),
    );

    const soluzioni: EsitoSvolgimento["soluzioni"] = [];
    let risposteEsatte = 0;

    for (const domanda of domande) {
      const corretta = domanda.getRispostaCorretta();
      if (!corretta) {
        continue;
      }
      const domandaId = domanda.getId() as number;
      soluzioni.push({
        domandaId,
        rispostaCorrettaId: corretta.getId() as number,
      });
      if (sceltePerDomanda.get(domandaId) === corretta.getId()) {
        risposteEsatte += 1;
      }
    }

    const esito = risposteEsatte / domande.length >= QUIZ.sogliaSuperamento;

    const obiettiviSbloccati = await withTransaction(async (connection) => {
      const precedente = await this.svolgimentoDao.find(quizId, utenteId);

      // Un quiz già superato non viene declassato da un tentativo peggiore.
      if (!precedente?.getEsito()) {
        await this.svolgimentoDao.save(
          new Svolgimento(quizId, utenteId, esito, new Date(), risposteEsatte),
          connection,
        );
      }

      const quizSuperati = await this.svolgimentoDao.contaQuizSuperati(
        utenteId,
        connection,
      );
      if (quizSuperati !== utente.getQuizSuperati()) {
        await this.utenteDao.updateQuizSuperati(
          utenteId,
          quizSuperati,
          connection,
        );
        utente.setQuizSuperati(quizSuperati);
      }

      return this.obiettivoService.valutaConseguimenti(
        utenteId,
        quizSuperati,
        connection,
      );
    });

    return {
      esito,
      risposteEsatte,
      totaleDomande: domande.length,
      soluzioni,
      obiettiviSbloccati,
    };
  }

  /**
   * Valida le domande ricevute e le trasforma in entità di dominio.
   *
   * @throws ValidationError alla prima violazione riscontrata.
   */
  private costruisciDomande(domande: DatiDomanda[]): Domanda[] {
    if (!Array.isArray(domande) || domande.length < QUIZ.domandeMin) {
      throw new ValidationError(
        `Il quiz deve contenere almeno ${QUIZ.domandeMin} domanda.`,
      );
    }

    return domande.map((domanda) => {
      const testo = domanda.testo?.trim() ?? "";
      if (testo.length < QUIZ.domandaMin || testo.length > QUIZ.domandaMax) {
        throw new ValidationError(
          `La domanda deve avere tra ${QUIZ.domandaMin} e ${QUIZ.domandaMax} caratteri.`,
        );
      }

      const risposte = domanda.risposte ?? [];
      if (
        risposte.length < QUIZ.risposteMin ||
        risposte.length > QUIZ.risposteMax
      ) {
        throw new ValidationError(
          `Ogni domanda deve avere tra ${QUIZ.risposteMin} e ${QUIZ.risposteMax} risposte.`,
        );
      }

      if (risposte.filter((r) => r.corretta).length !== 1) {
        throw new ValidationError(
          "Ogni domanda deve avere esattamente una risposta corretta.",
        );
      }

      return new Domanda(
        testo,
        risposte.map((risposta) => {
          const testoRisposta = risposta.testo?.trim() ?? "";
          if (
            testoRisposta.length < QUIZ.rispostaMin ||
            testoRisposta.length > QUIZ.rispostaMax
          ) {
            throw new ValidationError(
              `Ogni risposta deve avere tra ${QUIZ.rispostaMin} e ${QUIZ.rispostaMax} caratteri.`,
            );
          }
          return new Risposta(testoRisposta, risposta.corretta === true);
        }),
      );
    });
  }
}
