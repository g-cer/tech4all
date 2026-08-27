import { Utente } from "../entity/gestione_autenticazione/Utente";
import { Ruolo } from "../entity/gestione_autenticazione/Ruolo";
import { Tutorial } from "../entity/gestione_tutorial/Tutorial";
import { Categoria } from "../entity/gestione_tutorial/Categoria";
import { Feedback } from "../entity/gestione_feedback/Feedback";
import { Quiz } from "../entity/gestione_quiz/Quiz";
import { Obiettivo } from "../entity/gestione_obiettivi/Obiettivo";
import { Conseguimento } from "../entity/gestione_obiettivi/Conseguimento";

/*
 * Unico punto in cui le entità di dominio vengono serializzate verso
 * l'esterno. Nessuna rotta deve restituire direttamente un'entità: passando
 * di qui si garantisce che campi sensibili (hash della password) o
 * riservati (soluzioni di un quiz) non lascino mai il server per errore.
 */

export interface UtenteDTO {
  id: number;
  email: string;
  nome: string;
  cognome: string;
  ruolo: Ruolo;
  quizSuperati: number;
}

export function toUtenteDTO(utente: Utente): UtenteDTO {
  return {
    id: utente.getId() as number,
    email: utente.getEmail(),
    nome: utente.getNome(),
    cognome: utente.getCognome(),
    ruolo: utente.getRuolo(),
    quizSuperati: utente.getQuizSuperati(),
  };
}

export interface TutorialDTO {
  id: number;
  titolo: string;
  grafica: string;
  testo: string;
  categoria: Categoria;
  valutazione: number | null;
}

export function toTutorialDTO(tutorial: Tutorial): TutorialDTO {
  return {
    id: tutorial.getId() as number,
    titolo: tutorial.getTitolo(),
    grafica: tutorial.getGrafica(),
    testo: tutorial.getTesto(),
    categoria: tutorial.getCategoria(),
    valutazione: tutorial.getValutazione(),
  };
}

export interface FeedbackDTO {
  utenteId: number;
  tutorialId: number;
  valutazione: number;
  commento: string;
  dataCreazione: string | null;
}

export function toFeedbackDTO(feedback: Feedback): FeedbackDTO {
  const data = feedback.getDataCreazione();
  return {
    utenteId: feedback.getUtenteId(),
    tutorialId: feedback.getTutorialId(),
    valutazione: feedback.getValutazione(),
    commento: feedback.getCommento(),
    dataCreazione: data ? data.toISOString() : null,
  };
}

export interface RispostaDTO {
  id: number;
  testo: string;
}

export interface DomandaDTO {
  id: number;
  testo: string;
  risposte: RispostaDTO[];
}

export interface QuizDTO {
  id: number;
  tutorialId: number;
  domande: DomandaDTO[];
}

/**
 * Serializza un quiz **senza le soluzioni**: è la forma inviata a chi deve
 * ancora svolgerlo. La correzione avviene esclusivamente sul server.
 */
export function toQuizDTO(quiz: Quiz): QuizDTO {
  return {
    id: quiz.getId() as number,
    tutorialId: quiz.getTutorialId(),
    domande: quiz.getDomande().map((domanda) => ({
      id: domanda.getId() as number,
      testo: domanda.getTesto(),
      risposte: domanda.getRisposte().map((risposta) => ({
        id: risposta.getId() as number,
        testo: risposta.getTesto(),
      })),
    })),
  };
}

/** Soluzione di una domanda, restituita solo dopo la consegna del quiz. */
export interface SoluzioneDTO {
  domandaId: number;
  rispostaCorrettaId: number;
}

export interface EsitoQuizDTO {
  esito: boolean;
  risposteEsatte: number;
  totaleDomande: number;
  sogliaSuperamento: number;
  soluzioni: SoluzioneDTO[];
  obiettiviSbloccati: ObiettivoDTO[];
}

export interface ObiettivoDTO {
  nome: string;
  descrizione: string;
  graficaBadge: string;
  quizDaSuperare: number;
}

export function toObiettivoDTO(obiettivo: Obiettivo): ObiettivoDTO {
  return {
    nome: obiettivo.getNome(),
    descrizione: obiettivo.getDescrizione(),
    graficaBadge: obiettivo.getGraficaBadge(),
    quizDaSuperare: obiettivo.getQuizDaSuperare(),
  };
}

export interface BadgeDTO extends ObiettivoDTO {
  dataConseguimento: string;
}

export function toBadgeDTO(
  obiettivo: Obiettivo,
  conseguimento: Conseguimento,
): BadgeDTO {
  return {
    ...toObiettivoDTO(obiettivo),
    dataConseguimento: conseguimento.getDataConseguimento().toISOString(),
  };
}
