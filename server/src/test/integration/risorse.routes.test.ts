import request from "supertest";
import { Express } from "express";
import {
  cookieSessione,
  creaAppDiTest,
  creaServiziMock,
  ServiziMock,
} from "../helper/app";
import { unFeedback, unObiettivo, unQuiz, unTutorial } from "../helper/dao";
import { Ruolo } from "../../app/entity/gestione_autenticazione/Ruolo";
import { NotFoundError, ValidationError } from "../../app/errors/AppError";

describe("Rotte delle risorse", () => {
  let servizi: ServiziMock;
  let app: Express;

  beforeEach(() => {
    servizi = creaServiziMock();
    app = creaAppDiTest(servizi);
  });

  describe("GET /quiz/tutorial/:tutorialId", () => {
    it("non espone quale risposta sia corretta", async () => {
      servizi.quiz.getQuizPerTutorial.mockResolvedValue(unQuiz(3));

      const res = await request(app).get("/quiz/tutorial/1").expect(200);

      expect(JSON.stringify(res.body)).not.toContain('"corretta"');
      for (const domanda of res.body.domande) {
        for (const risposta of domanda.risposte) {
          expect(Object.keys(risposta).sort()).toEqual(["id", "testo"]);
        }
      }
    });

    it("segnala un tutorial privo di quiz", async () => {
      servizi.quiz.getQuizPerTutorial.mockRejectedValue(
        new NotFoundError("Nessun quiz associato a questo tutorial."),
      );

      await request(app).get("/quiz/tutorial/9").expect(404);
    });

    it("rifiuta un identificativo non numerico", async () => {
      await request(app).get("/quiz/tutorial/abc").expect(400);
      expect(servizi.quiz.getQuizPerTutorial).not.toHaveBeenCalled();
    });
  });

  describe("POST /quiz/:id/svolgimenti", () => {
    beforeEach(() => {
      servizi.quiz.eseguiQuiz.mockResolvedValue({
        esito: true,
        risposteEsatte: 3,
        totaleDomande: 3,
        soluzioni: [{ domandaId: 1, rispostaCorrettaId: 10 }],
        obiettiviSbloccati: [unObiettivo()],
      });
    });

    it("restituisce esito, soluzioni e badge sbloccati", async () => {
      const res = await request(app)
        .post("/quiz/1/svolgimenti")
        .set("Cookie", cookieSessione())
        .send({ risposte: [{ domandaId: 1, rispostaId: 10 }] })
        .expect(200);

      expect(res.body).toMatchObject({
        esito: true,
        risposteEsatte: 3,
        totaleDomande: 3,
        sogliaSuperamento: 0.7,
      });
      expect(res.body.soluzioni).toHaveLength(1);
      expect(res.body.obiettiviSbloccati[0].nome).toBe("Principiante");
    });

    it("rifiuta risposte prive di identificativi", async () => {
      await request(app)
        .post("/quiz/1/svolgimenti")
        .set("Cookie", cookieSessione())
        .send({ risposte: [{ domandaId: "x" }] })
        .expect(400);

      expect(servizi.quiz.eseguiQuiz).not.toHaveBeenCalled();
    });

    it("accetta una consegna senza risposte", async () => {
      await request(app)
        .post("/quiz/1/svolgimenti")
        .set("Cookie", cookieSessione())
        .send({ risposte: [] })
        .expect(200);
    });
  });

  describe("POST /quiz/tutorial/:tutorialId", () => {
    it("rifiuta un quiz senza domande", async () => {
      await request(app)
        .post("/quiz/tutorial/1")
        .set("Cookie", cookieSessione(Ruolo.ADMIN))
        .send({ domande: [] })
        .expect(400);

      expect(servizi.quiz.creaQuiz).not.toHaveBeenCalled();
    });

    it("crea un quiz valido", async () => {
      servizi.quiz.creaQuiz.mockResolvedValue(unQuiz(1));

      await request(app)
        .post("/quiz/tutorial/1")
        .set("Cookie", cookieSessione(Ruolo.ADMIN))
        .send({
          domande: [
            {
              testo: "Che cosa è un browser?",
              risposte: [
                { testo: "Un programma per navigare", corretta: true },
                { testo: "Una stampante", corretta: false },
              ],
            },
          ],
        })
        .expect(201);

      expect(servizi.quiz.creaQuiz).toHaveBeenCalledWith(1, expect.any(Array));
    });
  });

  describe("GET /tutorials", () => {
    it("serializza i tutorial nella forma attesa dal client", async () => {
      servizi.tutorial.getTutorials.mockResolvedValue([unTutorial()]);

      const res = await request(app).get("/tutorials").expect(200);

      expect(Object.keys(res.body[0]).sort()).toEqual([
        "categoria",
        "grafica",
        "id",
        "testo",
        "titolo",
        "valutazione",
      ]);
    });

    it("inoltra il filtro per categoria al servizio", async () => {
      servizi.tutorial.getTutorials.mockResolvedValue([]);

      await request(app).get("/tutorials?categoria=Internet").expect(200);

      expect(servizi.tutorial.getTutorials).toHaveBeenCalledWith("Internet");
    });

    it("traduce una categoria non valida in 400", async () => {
      servizi.tutorial.getTutorials.mockRejectedValue(
        new ValidationError("Categoria non valida."),
      );

      await request(app).get("/tutorials?categoria=Inesistente").expect(400);
    });
  });

  describe("GET /tutorials/categorie", () => {
    it("pubblica l'elenco delle categorie ammesse", async () => {
      const res = await request(app).get("/tutorials/categorie").expect(200);
      expect(res.body).toEqual([
        "Internet",
        "Social Media",
        "Tecnologia",
        "Sicurezza",
      ]);
    });
  });

  describe("POST /tutorials", () => {
    it("richiede l'immagine di copertina", async () => {
      await request(app)
        .post("/tutorials")
        .set("Cookie", cookieSessione(Ruolo.ADMIN))
        .field("titolo", "Titolo di prova valido")
        .field("categoria", "Internet")
        .field("testo", "x".repeat(50))
        .expect(400);

      expect(servizi.tutorial.creaTutorial).not.toHaveBeenCalled();
    });
  });

  describe("Feedback", () => {
    it("serializza i feedback nella forma attesa dal client", async () => {
      servizi.feedback.getFeedbackTutorial.mockResolvedValue([unFeedback()]);

      const res = await request(app).get("/feedback/tutorial/1").expect(200);

      expect(Object.keys(res.body[0]).sort()).toEqual([
        "commento",
        "dataCreazione",
        "tutorialId",
        "utenteId",
        "valutazione",
      ]);
    });

    it.each([
      ["valutazione fuori scala", { valutazione: 9 }],
      ["valutazione non intera", { valutazione: 2.5 }],
      ["commento troppo corto", { commento: "a" }],
      ["commento troppo lungo", { commento: "a".repeat(501) }],
    ])("rifiuta un feedback con %s", async (_etichetta, modifica) => {
      await request(app)
        .post("/feedback/tutorial/1")
        .set("Cookie", cookieSessione())
        .send({ valutazione: 4, commento: "Commento valido.", ...modifica })
        .expect(400);

      expect(servizi.feedback.creaFeedback).not.toHaveBeenCalled();
    });

    it("aggiorna il proprio feedback", async () => {
      servizi.feedback.aggiornaFeedback.mockResolvedValue(unFeedback());

      await request(app)
        .put("/feedback/tutorial/1")
        .set("Cookie", cookieSessione(Ruolo.UTENTE, 4))
        .send({ valutazione: 3, commento: "Commento aggiornato." })
        .expect(200);

      expect(servizi.feedback.aggiornaFeedback).toHaveBeenCalledWith(
        4,
        1,
        expect.objectContaining({ valutazione: 3 }),
      );
    });
  });

  describe("Obiettivi", () => {
    it("serializza gli obiettivi nella forma attesa dal client", async () => {
      servizi.obiettivo.getObiettivi.mockResolvedValue([unObiettivo()]);

      const res = await request(app).get("/obiettivi").expect(200);

      expect(Object.keys(res.body[0]).sort()).toEqual([
        "descrizione",
        "graficaBadge",
        "nome",
        "quizDaSuperare",
      ]);
    });

    it.each([
      ["descrizione troppo corta", { descrizione: "a" }],
      ["badge assente", { graficaBadge: "" }],
      ["soglia nulla", { quizDaSuperare: 0 }],
    ])("rifiuta un obiettivo con %s", async (_etichetta, modifica) => {
      await request(app)
        .post("/obiettivi")
        .set("Cookie", cookieSessione(Ruolo.ADMIN))
        .send({
          nome: "Test",
          descrizione: "Descrizione valida.",
          graficaBadge: "Media/badge-1.png",
          quizDaSuperare: 1,
          ...modifica,
        })
        .expect(400);

      expect(servizi.obiettivo.creaObiettivo).not.toHaveBeenCalled();
    });

    it("restituisce i badge conseguiti con la data", async () => {
      servizi.obiettivo.getBadgeUtente.mockResolvedValue([
        {
          obiettivo: unObiettivo(),
          conseguimento: {
            getDataConseguimento: () => new Date("2024-12-09T10:00:00Z"),
          },
        },
      ]);

      const res = await request(app)
        .get("/accounts/me/badge")
        .set("Cookie", cookieSessione())
        .expect(200);

      expect(res.body[0]).toMatchObject({
        nome: "Principiante",
        dataConseguimento: "2024-12-09T10:00:00.000Z",
      });
    });
  });

  describe("GET /salute", () => {
    it("risponde allo stato del servizio", async () => {
      await request(app).get("/salute").expect(200, { stato: "ok" });
    });
  });
});
