/*
 * Forma dei dati scambiati con l'API.
 *
 * Rispecchia i DTO definiti in `server/src/app/dto`. È l'unico punto in cui
 * il client dichiara la struttura delle risposte: nessun modulo importa
 * direttamente le entità del back-end.
 */

export type Ruolo = "utente" | "admin";

export type Categoria =
  "Internet" | "Social Media" | "Tecnologia" | "Sicurezza";

export interface Utente {
  id: number;
  email: string;
  nome: string;
  cognome: string;
  ruolo: Ruolo;
  quizSuperati: number;
}

export interface Tutorial {
  id: number;
  titolo: string;
  grafica: string;
  testo: string;
  categoria: Categoria;
  valutazione: number | null;
}

export interface Feedback {
  utenteId: number;
  tutorialId: number;
  valutazione: number;
  commento: string;
  dataCreazione: string | null;
}

export interface Risposta {
  id: number;
  testo: string;
}

export interface Domanda {
  id: number;
  testo: string;
  risposte: Risposta[];
}

/** Quiz come lo riceve chi deve svolgerlo: privo delle soluzioni. */
export interface Quiz {
  id: number;
  tutorialId: number;
  domande: Domanda[];
}

export interface Obiettivo {
  nome: string;
  descrizione: string;
  graficaBadge: string;
  quizDaSuperare: number;
}

export interface Badge extends Obiettivo {
  dataConseguimento: string;
}

export interface Soluzione {
  domandaId: number;
  rispostaCorrettaId: number;
}

/** Correzione restituita dal server dopo la consegna di un quiz. */
export interface EsitoQuiz {
  esito: boolean;
  risposteEsatte: number;
  totaleDomande: number;
  sogliaSuperamento: number;
  soluzioni: Soluzione[];
  obiettiviSbloccati: Obiettivo[];
}

/** Risposta scelta dall'utente per una domanda. */
export interface RispostaFornita {
  domandaId: number;
  rispostaId: number;
}

/** Domanda inviata dall'amministratore in creazione o modifica di un quiz. */
export interface DomandaInInvio {
  testo: string;
  risposte: { testo: string; corretta: boolean }[];
}
