import { UtenteDao } from "../../app/dao/UtenteDao";
import { TutorialDao } from "../../app/dao/TutorialDao";
import { FeedbackDao } from "../../app/dao/FeedbackDao";
import { QuizDao } from "../../app/dao/QuizDao";
import { SvolgimentoDao } from "../../app/dao/SvolgimentoDao";
import { ObiettivoDao } from "../../app/dao/ObiettivoDao";
import { ConseguimentoDao } from "../../app/dao/ConseguimentoDao";
import { Utente } from "../../app/entity/gestione_autenticazione/Utente";
import { Ruolo } from "../../app/entity/gestione_autenticazione/Ruolo";
import { Tutorial } from "../../app/entity/gestione_tutorial/Tutorial";
import { Categoria } from "../../app/entity/gestione_tutorial/Categoria";
import { Feedback } from "../../app/entity/gestione_feedback/Feedback";
import { Quiz } from "../../app/entity/gestione_quiz/Quiz";
import { Domanda } from "../../app/entity/gestione_quiz/Domanda";
import { Risposta } from "../../app/entity/gestione_quiz/Risposta";
import { Obiettivo } from "../../app/entity/gestione_obiettivi/Obiettivo";

/*
 * Mock dei DAO e costruttori di entità usati dalle suite.
 *
 * I service ricevono i DAO dal costruttore, quindi qui bastano oggetti
 * conformi all'interfaccia: nessun test ha bisogno di raggiungere campi
 * privati o di disattivare il type checking.
 */

/** Tutti i metodi di `T` sostituiti da mock Jest. */
export type Mock<T> = { [K in keyof T]: jest.Mock };

export function mockUtenteDao(): Mock<UtenteDao> {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateQuizSuperati: jest.fn(),
    delete: jest.fn(),
  } as unknown as Mock<UtenteDao>;
}

export function mockTutorialDao(): Mock<TutorialDao> {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByCategoria: jest.fn(),
    search: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  } as unknown as Mock<TutorialDao>;
}

export function mockFeedbackDao(): Mock<FeedbackDao> {
  return {
    findByTutorial: jest.fn(),
    findByUtente: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  } as unknown as Mock<FeedbackDao>;
}

export function mockQuizDao(): Mock<QuizDao> {
  return {
    findById: jest.fn(),
    findByTutorial: jest.fn(),
    create: jest.fn(),
    replaceDomande: jest.fn(),
    delete: jest.fn(),
  } as unknown as Mock<QuizDao>;
}

export function mockSvolgimentoDao(): Mock<SvolgimentoDao> {
  return {
    find: jest.fn(),
    findByUtente: jest.fn(),
    save: jest.fn(),
    contaQuizSuperati: jest.fn(),
  } as unknown as Mock<SvolgimentoDao>;
}

export function mockObiettivoDao(): Mock<ObiettivoDao> {
  return {
    findAll: jest.fn(),
    findByNome: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  } as unknown as Mock<ObiettivoDao>;
}

export function mockConseguimentoDao(): Mock<ConseguimentoDao> {
  return {
    findByUtente: jest.fn(),
    assegna: jest.fn(),
  } as unknown as Mock<ConseguimentoDao>;
}

/** Utente di prova; i campi non indicati assumono valori plausibili. */
export function unUtente(
  modifiche: Partial<{
    id: number;
    email: string;
    passwordHash: string;
    nome: string;
    cognome: string;
    ruolo: Ruolo;
    quizSuperati: number;
  }> = {},
): Utente {
  return new Utente(
    modifiche.id ?? 1,
    modifiche.email ?? "mario.rossi@example.com",
    modifiche.passwordHash ?? "$2b$10$hashfittizio",
    modifiche.nome ?? "Mario",
    modifiche.cognome ?? "Rossi",
    modifiche.ruolo ?? Ruolo.UTENTE,
    modifiche.quizSuperati ?? 0,
  );
}

export function unTutorial(
  modifiche: Partial<{
    id: number;
    titolo: string;
    grafica: string;
    testo: string;
    categoria: Categoria;
    valutazione: number | null;
  }> = {},
): Tutorial {
  return new Tutorial(
    modifiche.id ?? 1,
    modifiche.titolo ?? "Introduzione al computer",
    modifiche.grafica ?? "uploads/seed/computer.webp",
    modifiche.testo ??
      "<p>Contenuto del tutorial di prova, sufficientemente lungo.</p>",
    modifiche.categoria ?? Categoria.TECNOLOGIA,
    modifiche.valutazione ?? null,
  );
}

export function unFeedback(
  modifiche: Partial<{
    valutazione: number;
    commento: string;
    utenteId: number;
    tutorialId: number;
  }> = {},
): Feedback {
  return new Feedback(
    modifiche.valutazione ?? 4,
    modifiche.commento ?? "Tutorial chiaro e ben spiegato.",
    modifiche.utenteId ?? 1,
    modifiche.tutorialId ?? 1,
  );
}

/**
 * Quiz di prova con `numeroDomande` domande da tre risposte ciascuna.
 * Gli identificativi sono deterministici: domanda `i` ha id `i`, e la sua
 * risposta corretta ha id `i * 10`.
 */
export function unQuiz(numeroDomande = 5, quizId = 1, tutorialId = 1): Quiz {
  const domande: Domanda[] = [];
  for (let i = 1; i <= numeroDomande; i += 1) {
    domande.push(
      new Domanda(
        `Domanda numero ${i}?`,
        [
          new Risposta("Prima opzione", false, i, i * 10 + 1),
          new Risposta("Seconda opzione", true, i, i * 10),
          new Risposta("Terza opzione", false, i, i * 10 + 2),
        ],
        quizId,
        i,
      ),
    );
  }
  return new Quiz(tutorialId, domande, quizId);
}

/** Risposte tutte corrette per il quiz prodotto da `unQuiz`. */
export function risposteCorrette(
  quiz: Quiz,
): { domandaId: number; rispostaId: number }[] {
  return quiz.getDomande().map((domanda) => ({
    domandaId: domanda.getId() as number,
    rispostaId: domanda.getRispostaCorretta()?.getId() as number,
  }));
}

export function unObiettivo(
  nome = "Principiante",
  quizDaSuperare = 1,
): Obiettivo {
  return new Obiettivo(
    nome,
    "Descrizione dell'obiettivo di prova.",
    "Media/badge-1.png",
    quizDaSuperare,
  );
}
