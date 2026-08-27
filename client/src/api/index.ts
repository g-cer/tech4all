import { http, richiesta } from "./http";
import {
  Badge,
  Categoria,
  DomandaInInvio,
  EsitoQuiz,
  Feedback,
  Obiettivo,
  Quiz,
  RispostaFornita,
  Tutorial,
  Utente,
} from "@/types";

/*
 * Facciata unica verso l'API (pattern Facade).
 *
 * Le pagine chiamano `api.<sottosistema>.<operazione>` e non conoscono né
 * gli URL né il formato del trasporto: cambiare una rotta del back-end si
 * riflette solo su questo file.
 */

const autenticazione = {
  registra: (dati: {
    email: string;
    password: string;
    nome: string;
    cognome: string;
  }): Promise<Utente> =>
    richiesta(async () => (await http.post("/auth/registrazione", dati)).data),

  login: (email: string, password: string): Promise<Utente> =>
    richiesta(
      async () => (await http.post("/auth/login", { email, password })).data,
    ),

  logout: (): Promise<void> =>
    richiesta(async () => {
      await http.post("/auth/logout");
    }),

  /** Profilo della sessione corrente, o `null` se non autenticati. */
  sessione: async (): Promise<Utente | null> => {
    try {
      return (await http.get("/auth/me")).data;
    } catch {
      return null;
    }
  },

  emailDisponibile: (email: string): Promise<boolean> =>
    richiesta(
      async () =>
        (await http.get("/auth/email-disponibile", { params: { email } })).data
          .disponibile,
    ),
};

const account = {
  profilo: (): Promise<Utente> =>
    richiesta(async () => (await http.get("/accounts/me")).data),

  aggiornaProfilo: (dati: {
    nome?: string;
    cognome?: string;
    email?: string;
    passwordAttuale?: string;
    nuovaPassword?: string;
  }): Promise<Utente> =>
    richiesta(async () => (await http.put("/accounts/me", dati)).data),

  eliminaProfilo: (): Promise<void> =>
    richiesta(async () => {
      await http.delete("/accounts/me");
    }),

  badge: (): Promise<Badge[]> =>
    richiesta(async () => (await http.get("/accounts/me/badge")).data),

  /** Elenco degli utenti registrati. Riservato agli amministratori. */
  utenti: (): Promise<Utente[]> =>
    richiesta(async () => (await http.get("/accounts")).data),

  eliminaUtente: (id: number): Promise<void> =>
    richiesta(async () => {
      await http.delete(`/accounts/${id}`);
    }),
};

const tutorial = {
  elenco: (categoria?: Categoria | ""): Promise<Tutorial[]> =>
    richiesta(
      async () =>
        (
          await http.get("/tutorials", {
            params: categoria ? { categoria } : {},
          })
        ).data,
    ),

  dettaglio: (id: number): Promise<Tutorial> =>
    richiesta(async () => (await http.get(`/tutorials/${id}`)).data),

  categorie: (): Promise<Categoria[]> =>
    richiesta(async () => (await http.get("/tutorials/categorie")).data),

  cerca: (parolaChiave: string): Promise<Tutorial[]> =>
    richiesta(
      async () =>
        (await http.get("/tutorials/ricerca", { params: { parolaChiave } }))
          .data,
    ),

  crea: (dati: FormData): Promise<Tutorial> =>
    richiesta(async () => (await http.post("/tutorials", dati)).data),

  aggiorna: (id: number, dati: FormData): Promise<Tutorial> =>
    richiesta(async () => (await http.put(`/tutorials/${id}`, dati)).data),

  elimina: (id: number): Promise<void> =>
    richiesta(async () => {
      await http.delete(`/tutorials/${id}`);
    }),

  /** Carica un'immagine da inserire nel corpo di un tutorial. */
  caricaImmagine: (file: File): Promise<string> =>
    richiesta(async () => {
      const dati = new FormData();
      dati.append("immagine", file);
      return (await http.post("/tutorials/immagini", dati)).data.percorso;
    }),

  eliminaImmagine: (nomeFile: string): Promise<void> =>
    richiesta(async () => {
      await http.delete(`/tutorials/immagini/${encodeURIComponent(nomeFile)}`);
    }),
};

const quiz = {
  /** Quiz di un tutorial, oppure `null` se non ne esiste uno. */
  perTutorial: async (tutorialId: number): Promise<Quiz | null> => {
    try {
      return (await http.get(`/quiz/tutorial/${tutorialId}`)).data;
    } catch {
      return null;
    }
  },

  crea: (tutorialId: number, domande: DomandaInInvio[]): Promise<Quiz> =>
    richiesta(
      async () =>
        (await http.post(`/quiz/tutorial/${tutorialId}`, { domande })).data,
    ),

  aggiorna: (quizId: number, domande: DomandaInInvio[]): Promise<Quiz> =>
    richiesta(
      async () => (await http.put(`/quiz/${quizId}`, { domande })).data,
    ),

  elimina: (quizId: number): Promise<void> =>
    richiesta(async () => {
      await http.delete(`/quiz/${quizId}`);
    }),

  /** Consegna le risposte e ottiene la correzione dal server. */
  consegna: (quizId: number, risposte: RispostaFornita[]): Promise<EsitoQuiz> =>
    richiesta(
      async () =>
        (await http.post(`/quiz/${quizId}/svolgimenti`, { risposte })).data,
    ),
};

const feedback = {
  perTutorial: (tutorialId: number): Promise<Feedback[]> =>
    richiesta(
      async () => (await http.get(`/feedback/tutorial/${tutorialId}`)).data,
    ),

  propri: (): Promise<Feedback[]> =>
    richiesta(async () => (await http.get("/feedback/me")).data),

  crea: (
    tutorialId: number,
    valutazione: number,
    commento: string,
  ): Promise<Feedback> =>
    richiesta(
      async () =>
        (
          await http.post(`/feedback/tutorial/${tutorialId}`, {
            valutazione,
            commento,
          })
        ).data,
    ),

  aggiorna: (
    tutorialId: number,
    valutazione: number,
    commento: string,
  ): Promise<Feedback> =>
    richiesta(
      async () =>
        (
          await http.put(`/feedback/tutorial/${tutorialId}`, {
            valutazione,
            commento,
          })
        ).data,
    ),

  elimina: (tutorialId: number, utenteId?: number): Promise<void> =>
    richiesta(async () => {
      const percorso =
        utenteId === undefined
          ? `/feedback/tutorial/${tutorialId}`
          : `/feedback/tutorial/${tutorialId}/utente/${utenteId}`;
      await http.delete(percorso);
    }),
};

const obiettivi = {
  elenco: (): Promise<Obiettivo[]> =>
    richiesta(async () => (await http.get("/obiettivi")).data),

  crea: (dati: Obiettivo): Promise<Obiettivo> =>
    richiesta(async () => (await http.post("/obiettivi", dati)).data),

  aggiorna: (nome: string, dati: Omit<Obiettivo, "nome">): Promise<Obiettivo> =>
    richiesta(
      async () =>
        (await http.put(`/obiettivi/${encodeURIComponent(nome)}`, dati)).data,
    ),

  elimina: (nome: string): Promise<void> =>
    richiesta(async () => {
      await http.delete(`/obiettivi/${encodeURIComponent(nome)}`);
    }),
};

export const api = {
  autenticazione,
  account,
  tutorial,
  quiz,
  feedback,
  obiettivi,
};

export { ApiError, urlMedia } from "./http";
