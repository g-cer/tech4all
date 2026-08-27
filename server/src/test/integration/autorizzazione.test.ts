import request from "supertest";
import { Express } from "express";
import {
  cookieNonValido,
  cookieSessione,
  creaAppDiTest,
  creaServiziMock,
  ServiziMock,
} from "../helper/app";
import { Ruolo } from "../../app/entity/gestione_autenticazione/Ruolo";

/*
 * Verifica della matrice di controllo degli accessi: per ogni rotta protetta
 * si controlla che un anonimo riceva 401 e un utente non autorizzato 403.
 */

interface Caso {
  metodo: "get" | "post" | "put" | "delete";
  percorso: string;
  corpo?: object;
}

const SOLO_AMMINISTRATORE: Caso[] = [
  { metodo: "get", percorso: "/accounts" },
  { metodo: "delete", percorso: "/accounts/2" },
  { metodo: "delete", percorso: "/tutorials/1" },
  { metodo: "delete", percorso: "/quiz/1" },
  { metodo: "delete", percorso: "/tutorials/immagini/foto.png" },
  {
    metodo: "post",
    percorso: "/obiettivi",
    corpo: {
      nome: "Test",
      descrizione: "Descrizione valida.",
      graficaBadge: "Media/badge-1.png",
      quizDaSuperare: 1,
    },
  },
  { metodo: "delete", percorso: "/obiettivi/Test" },
];

const SOLO_AUTENTICATI: Caso[] = [
  { metodo: "get", percorso: "/accounts/me" },
  { metodo: "put", percorso: "/accounts/me", corpo: { nome: "Anna" } },
  { metodo: "delete", percorso: "/accounts/me" },
  { metodo: "get", percorso: "/accounts/me/badge" },
  { metodo: "get", percorso: "/feedback/me" },
  {
    metodo: "post",
    percorso: "/feedback/tutorial/1",
    corpo: { valutazione: 4, commento: "Un commento valido." },
  },
  { metodo: "delete", percorso: "/feedback/tutorial/1" },
  { metodo: "post", percorso: "/quiz/1/svolgimenti", corpo: { risposte: [] } },
];

const PUBBLICHE: Caso[] = [
  { metodo: "get", percorso: "/tutorials" },
  { metodo: "get", percorso: "/tutorials/categorie" },
  { metodo: "get", percorso: "/tutorials/1" },
  { metodo: "get", percorso: "/tutorials/ricerca?parolaChiave=email" },
  { metodo: "get", percorso: "/feedback/tutorial/1" },
  { metodo: "get", percorso: "/quiz/tutorial/1" },
  { metodo: "get", percorso: "/obiettivi" },
];

describe("Controllo degli accessi", () => {
  let servizi: ServiziMock;
  let app: Express;

  beforeEach(() => {
    servizi = creaServiziMock();
    app = creaAppDiTest(servizi);

    // I servizi rispondono sempre positivamente: un eventuale 401/403 può
    // provenire solo dai middleware, che sono l'oggetto di questa suite.
    servizi.account.getUtenti.mockResolvedValue([]);
    servizi.account.getUtente.mockResolvedValue({
      getId: () => 1,
      getEmail: () => "a@example.com",
      getNome: () => "Anna",
      getCognome: () => "Bianchi",
      getRuolo: () => Ruolo.UTENTE,
      getQuizSuperati: () => 0,
    });
    servizi.account.eliminaUtente.mockResolvedValue(undefined);
    servizi.account.aggiornaProfilo.mockResolvedValue({
      getId: () => 1,
      getEmail: () => "a@example.com",
      getNome: () => "Anna",
      getCognome: () => "Bianchi",
      getRuolo: () => Ruolo.UTENTE,
      getQuizSuperati: () => 0,
    });
    servizi.obiettivo.getBadgeUtente.mockResolvedValue([]);
    servizi.obiettivo.getObiettivi.mockResolvedValue([]);
    servizi.obiettivo.creaObiettivo.mockResolvedValue({
      getNome: () => "Test",
      getDescrizione: () => "Descrizione valida.",
      getGraficaBadge: () => "Media/badge-1.png",
      getQuizDaSuperare: () => 1,
    });
    servizi.obiettivo.eliminaObiettivo.mockResolvedValue(undefined);
    servizi.tutorial.getTutorials.mockResolvedValue([]);
    servizi.tutorial.cercaTutorial.mockResolvedValue([]);
    servizi.tutorial.eliminaTutorial.mockResolvedValue(undefined);
    servizi.tutorial.getTutorial.mockResolvedValue({
      getId: () => 1,
      getTitolo: () => "Titolo",
      getGrafica: () => "uploads/seed/computer.webp",
      getTesto: () => "<p>Testo</p>",
      getCategoria: () => "Internet",
      getValutazione: () => null,
    });
    servizi.feedback.getFeedbackTutorial.mockResolvedValue([]);
    servizi.feedback.getFeedbackUtente.mockResolvedValue([]);
    servizi.feedback.creaFeedback.mockResolvedValue({
      getUtenteId: () => 1,
      getTutorialId: () => 1,
      getValutazione: () => 4,
      getCommento: () => "Un commento valido.",
      getDataCreazione: () => null,
    });
    servizi.feedback.eliminaFeedback.mockResolvedValue(undefined);
    servizi.quiz.eliminaQuiz.mockResolvedValue(undefined);
    servizi.quiz.getQuizPerTutorial.mockResolvedValue({
      getId: () => 1,
      getTutorialId: () => 1,
      getDomande: () => [],
    });
    servizi.quiz.eseguiQuiz.mockResolvedValue({
      esito: true,
      risposteEsatte: 0,
      totaleDomande: 0,
      soluzioni: [],
      obiettiviSbloccati: [],
    });
  });

  const invia = (caso: Caso, cookie?: string) => {
    const req = request(app)[caso.metodo](caso.percorso);
    if (cookie) {
      req.set("Cookie", cookie);
    }
    return caso.corpo ? req.send(caso.corpo) : req;
  };

  describe.each(SOLO_AMMINISTRATORE)(
    "$metodo $percorso (riservata agli amministratori)",
    (caso) => {
      it("rifiuta un anonimo con 401", async () => {
        await expect(invia(caso).expect(401)).resolves.toBeDefined();
      });

      it("rifiuta un utente non amministratore con 403", async () => {
        await invia(caso, cookieSessione(Ruolo.UTENTE)).expect(403);
      });

      it("accetta un amministratore", async () => {
        const res = await invia(caso, cookieSessione(Ruolo.ADMIN));
        expect(res.status).toBeLessThan(400);
      });
    },
  );

  describe.each(SOLO_AUTENTICATI)(
    "$metodo $percorso (riservata agli autenticati)",
    (caso) => {
      it("rifiuta un anonimo con 401", async () => {
        await invia(caso).expect(401);
      });

      it("accetta un utente autenticato", async () => {
        const res = await invia(caso, cookieSessione(Ruolo.UTENTE));
        expect(res.status).toBeLessThan(400);
      });
    },
  );

  describe.each(PUBBLICHE)("$metodo $percorso (pubblica)", (caso) => {
    it("è accessibile senza sessione", async () => {
      const res = await invia(caso);
      expect(res.status).toBeLessThan(400);
    });
  });

  describe("token non valido", () => {
    it("è trattato come assenza di sessione sulle rotte protette", async () => {
      await request(app)
        .get("/accounts/me")
        .set("Cookie", cookieNonValido())
        .expect(401);
    });

    it("non impedisce l'accesso alle rotte pubbliche", async () => {
      await request(app)
        .get("/tutorials")
        .set("Cookie", cookieNonValido())
        .expect(200);
    });
  });

  describe("proprietà delle risorse", () => {
    it("il feedback creato è attribuito all'utente della sessione, non al corpo", async () => {
      await request(app)
        .post("/feedback/tutorial/7")
        .set("Cookie", cookieSessione(Ruolo.UTENTE, 42))
        .send({
          valutazione: 4,
          commento: "Un commento valido.",
          utenteId: 999,
        })
        .expect(201);

      expect(servizi.feedback.creaFeedback).toHaveBeenCalledWith(
        42,
        7,
        expect.objectContaining({ valutazione: 4 }),
      );
    });

    it("lo svolgimento è attribuito all'utente della sessione", async () => {
      await request(app)
        .post("/quiz/3/svolgimenti")
        .set("Cookie", cookieSessione(Ruolo.UTENTE, 42))
        .send({ risposte: [], utenteId: 999 })
        .expect(200);

      expect(servizi.quiz.eseguiQuiz).toHaveBeenCalledWith(3, 42, []);
    });

    it("un amministratore può moderare il feedback altrui", async () => {
      await request(app)
        .delete("/feedback/tutorial/1/utente/5")
        .set("Cookie", cookieSessione(Ruolo.ADMIN, 9))
        .expect(204);

      expect(servizi.feedback.eliminaFeedback).toHaveBeenCalledWith(
        9,
        5,
        1,
        true,
      );
    });

    it("un utente non riceve i privilegi di moderazione", async () => {
      await request(app)
        .delete("/feedback/tutorial/1/utente/5")
        .set("Cookie", cookieSessione(Ruolo.UTENTE, 9))
        .expect(204);

      expect(servizi.feedback.eliminaFeedback).toHaveBeenCalledWith(
        9,
        5,
        1,
        false,
      );
    });
  });
});
