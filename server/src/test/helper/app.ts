import { Express } from "express";
import { creaApp, Servizi } from "../../app";
import { firmaToken } from "../../app/middleware/auth";
import { Ruolo } from "../../app/entity/gestione_autenticazione/Ruolo";
import { env } from "../../config/env";
import { unUtente } from "./dao";

/** Servizi applicativi con tutti i metodi sostituiti da mock Jest. */
export interface ServiziMock {
  autenticazione: { [K in keyof Servizi["autenticazione"]]: jest.Mock };
  account: { [K in keyof Servizi["account"]]: jest.Mock };
  tutorial: { [K in keyof Servizi["tutorial"]]: jest.Mock };
  quiz: { [K in keyof Servizi["quiz"]]: jest.Mock };
  feedback: { [K in keyof Servizi["feedback"]]: jest.Mock };
  obiettivo: { [K in keyof Servizi["obiettivo"]]: jest.Mock };
}

function mockDi(...metodi: string[]): Record<string, jest.Mock> {
  return Object.fromEntries(metodi.map((m) => [m, jest.fn()]));
}

/** Crea servizi interamente simulati, adatti ai test delle rotte. */
export function creaServiziMock(): ServiziMock {
  return {
    autenticazione: mockDi("registra", "login", "emailEsiste"),
    account: mockDi(
      "getUtente",
      "getUtenti",
      "aggiornaProfilo",
      "eliminaUtente",
    ),
    tutorial: mockDi(
      "getTutorials",
      "getTutorial",
      "cercaTutorial",
      "creaTutorial",
      "aggiornaTutorial",
      "eliminaTutorial",
    ),
    quiz: mockDi(
      "getQuizPerTutorial",
      "creaQuiz",
      "aggiornaQuiz",
      "eliminaQuiz",
      "eseguiQuiz",
    ),
    feedback: mockDi(
      "getFeedbackTutorial",
      "getFeedbackUtente",
      "creaFeedback",
      "aggiornaFeedback",
      "eliminaFeedback",
    ),
    obiettivo: mockDi(
      "getObiettivi",
      "getBadgeUtente",
      "creaObiettivo",
      "aggiornaObiettivo",
      "eliminaObiettivo",
      "valutaConseguimenti",
    ),
  } as unknown as ServiziMock;
}

/** Applicazione Express collegata ai servizi simulati indicati. */
export function creaAppDiTest(servizi: ServiziMock): Express {
  return creaApp(servizi as unknown as Servizi);
}

/**
 * Header `Cookie` con una sessione valida per il ruolo richiesto.
 * Il token è firmato con la stessa funzione usata in produzione, così i
 * test esercitano il middleware reale e non una sua scorciatoia.
 */
export function cookieSessione(ruolo: Ruolo = Ruolo.UTENTE, id = 1): string {
  const token = firmaToken(unUtente({ id, ruolo }));
  return `${env.jwt.cookieName}=${token}`;
}

/** Header `Cookie` con un token non firmato dal server. */
export function cookieNonValido(): string {
  return `${env.jwt.cookieName}=token.non.valido`;
}
