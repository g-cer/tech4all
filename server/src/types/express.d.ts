import { Ruolo } from "../app/entity/gestione_autenticazione/Ruolo";

/** Identità dell'utente autenticato, ricavata dal token di sessione. */
export interface UtenteAutenticato {
  id: number;
  ruolo: Ruolo;
}

declare global {
  namespace Express {
    interface Request {
      /** Popolata da `requireAuth`; assente sulle rotte pubbliche. */
      utente?: UtenteAutenticato;
    }
  }
}
