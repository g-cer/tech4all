import { QuizService } from "../../app/services/QuizService";
import { QuizDao } from "../../app/dao/QuizDao";
import { SvolgimentoDao } from "../../app/dao/SvolgimentoDao";
import { UtenteDao } from "../../app/dao/UtenteDao";
import { TutorialDao } from "../../app/dao/TutorialDao";
import { ObiettivoService } from "../../app/services/ObiettivoService";
import { Svolgimento } from "../../app/entity/gestione_quiz/Svolgimento";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../../app/errors/AppError";
import {
  Mock,
  mockQuizDao,
  mockSvolgimentoDao,
  mockTutorialDao,
  mockUtenteDao,
  risposteCorrette,
  unObiettivo,
  unQuiz,
  unTutorial,
  unUtente,
} from "../helper/dao";

describe("QuizService", () => {
  let quizDao: Mock<QuizDao>;
  let svolgimentoDao: Mock<SvolgimentoDao>;
  let utenteDao: Mock<UtenteDao>;
  let tutorialDao: Mock<TutorialDao>;
  let obiettivoService: { valutaConseguimenti: jest.Mock };
  let servizio: QuizService;

  const domandaValida = {
    testo: "Che cosa è un browser?",
    risposte: [
      { testo: "Un programma per navigare in rete", corretta: true },
      { testo: "Un tipo di stampante", corretta: false },
      { testo: "Una periferica di rete", corretta: false },
    ],
  };

  beforeEach(() => {
    quizDao = mockQuizDao();
    svolgimentoDao = mockSvolgimentoDao();
    utenteDao = mockUtenteDao();
    tutorialDao = mockTutorialDao();
    obiettivoService = { valutaConseguimenti: jest.fn().mockResolvedValue([]) };

    servizio = new QuizService(
      quizDao as unknown as QuizDao,
      svolgimentoDao as unknown as SvolgimentoDao,
      utenteDao as unknown as UtenteDao,
      tutorialDao as unknown as TutorialDao,
      obiettivoService as unknown as ObiettivoService,
    );
  });

  describe("creaQuiz", () => {
    beforeEach(() => {
      tutorialDao.findById.mockResolvedValue(unTutorial());
      quizDao.findByTutorial.mockResolvedValue(null);
    });

    it("crea un quiz valido", async () => {
      const quiz = await servizio.creaQuiz(1, [domandaValida]);
      expect(quiz.getDomande()).toHaveLength(1);
      expect(quizDao.create).toHaveBeenCalled();
    });

    it("segnala un tutorial inesistente", async () => {
      tutorialDao.findById.mockResolvedValue(null);
      await expect(
        servizio.creaQuiz(99, [domandaValida]),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("impedisce due quiz sullo stesso tutorial", async () => {
      quizDao.findByTutorial.mockResolvedValue(unQuiz());
      await expect(
        servizio.creaQuiz(1, [domandaValida]),
      ).rejects.toBeInstanceOf(ConflictError);
    });

    it("rifiuta un quiz senza domande", async () => {
      await expect(servizio.creaQuiz(1, [])).rejects.toBeInstanceOf(
        ValidationError,
      );
    });

    it.each([
      ["domanda troppo corta", { ...domandaValida, testo: "a" }],
      ["domanda troppo lunga", { ...domandaValida, testo: "a".repeat(256) }],
      [
        "risposta troppo corta",
        {
          ...domandaValida,
          risposte: [
            { testo: "a", corretta: true },
            { testo: "Risposta valida", corretta: false },
          ],
        },
      ],
      [
        "una sola risposta",
        { ...domandaValida, risposte: [{ testo: "Unica", corretta: true }] },
      ],
      [
        "nessuna risposta corretta",
        {
          ...domandaValida,
          risposte: [
            { testo: "Prima risposta", corretta: false },
            { testo: "Seconda risposta", corretta: false },
          ],
        },
      ],
      [
        "due risposte corrette",
        {
          ...domandaValida,
          risposte: [
            { testo: "Prima risposta", corretta: true },
            { testo: "Seconda risposta", corretta: true },
          ],
        },
      ],
    ])("rifiuta un quiz con %s", async (_etichetta, domanda) => {
      await expect(servizio.creaQuiz(1, [domanda])).rejects.toBeInstanceOf(
        ValidationError,
      );
      expect(quizDao.create).not.toHaveBeenCalled();
    });
  });

  describe("aggiornaQuiz", () => {
    it("sostituisce le domande di un quiz esistente", async () => {
      quizDao.findById.mockResolvedValue(unQuiz());

      const quiz = await servizio.aggiornaQuiz(1, [domandaValida]);

      expect(quiz.getDomande()).toHaveLength(1);
      expect(quizDao.replaceDomande).toHaveBeenCalled();
    });

    it("segnala un quiz inesistente", async () => {
      quizDao.findById.mockResolvedValue(null);
      await expect(
        servizio.aggiornaQuiz(99, [domandaValida]),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("eliminaQuiz", () => {
    it("elimina un quiz esistente", async () => {
      quizDao.delete.mockResolvedValue(true);
      await expect(servizio.eliminaQuiz(1)).resolves.toBeUndefined();
    });

    it("segnala un quiz inesistente", async () => {
      quizDao.delete.mockResolvedValue(false);
      await expect(servizio.eliminaQuiz(99)).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });
  });

  describe("getQuizPerTutorial", () => {
    it("segnala un tutorial privo di quiz", async () => {
      quizDao.findByTutorial.mockResolvedValue(null);
      await expect(servizio.getQuizPerTutorial(1)).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });
  });

  describe("eseguiQuiz", () => {
    const quiz = unQuiz(5);

    beforeEach(() => {
      quizDao.findById.mockResolvedValue(quiz);
      utenteDao.findById.mockResolvedValue(unUtente());
      svolgimentoDao.find.mockResolvedValue(null);
      svolgimentoDao.contaQuizSuperati.mockResolvedValue(1);
    });

    it("supera il quiz con tutte le risposte corrette", async () => {
      const esito = await servizio.eseguiQuiz(1, 1, risposteCorrette(quiz));

      expect(esito.esito).toBe(true);
      expect(esito.risposteEsatte).toBe(5);
      expect(esito.totaleDomande).toBe(5);
    });

    it("non supera il quiz sotto la soglia del 70%", async () => {
      const risposte = risposteCorrette(quiz).slice(0, 3);
      const esito = await servizio.eseguiQuiz(1, 1, risposte);

      expect(esito.risposteEsatte).toBe(3);
      expect(esito.esito).toBe(false);
    });

    it("supera il quiz esattamente alla soglia", async () => {
      const quizDieci = unQuiz(10);
      quizDao.findById.mockResolvedValue(quizDieci);

      const esito = await servizio.eseguiQuiz(
        1,
        1,
        risposteCorrette(quizDieci).slice(0, 7),
      );

      expect(esito.risposteEsatte).toBe(7);
      expect(esito.esito).toBe(true);
    });

    it("associa le risposte per identificativo e non per posizione", async () => {
      const invertite = [...risposteCorrette(quiz)].reverse();
      const esito = await servizio.eseguiQuiz(1, 1, invertite);

      expect(esito.risposteEsatte).toBe(5);
      expect(esito.esito).toBe(true);
    });

    it("ignora le risposte riferite a domande di altri quiz", async () => {
      const esito = await servizio.eseguiQuiz(1, 1, [
        { domandaId: 999, rispostaId: 10 },
      ]);

      expect(esito.risposteEsatte).toBe(0);
    });

    it("restituisce le soluzioni solo dopo la consegna", async () => {
      const esito = await servizio.eseguiQuiz(1, 1, []);

      expect(esito.soluzioni).toHaveLength(5);
      expect(esito.soluzioni[0]).toEqual({
        domandaId: 1,
        rispostaCorrettaId: 10,
      });
    });

    it("non declassa un quiz già superato con un tentativo peggiore", async () => {
      svolgimentoDao.find.mockResolvedValue(
        new Svolgimento(1, 1, true, new Date(), 5),
      );

      await servizio.eseguiQuiz(1, 1, []);

      expect(svolgimentoDao.save).not.toHaveBeenCalled();
    });

    it("registra un nuovo tentativo se il quiz non era stato superato", async () => {
      svolgimentoDao.find.mockResolvedValue(
        new Svolgimento(1, 1, false, new Date(), 1),
      );

      await servizio.eseguiQuiz(1, 1, risposteCorrette(quiz));

      expect(svolgimentoDao.save).toHaveBeenCalled();
    });

    it("ricava i quiz superati dagli svolgimenti registrati", async () => {
      svolgimentoDao.contaQuizSuperati.mockResolvedValue(3);

      await servizio.eseguiQuiz(1, 1, risposteCorrette(quiz));

      expect(utenteDao.updateQuizSuperati).toHaveBeenCalledWith(
        1,
        3,
        expect.anything(),
      );
    });

    it("non riscrive il contatore quando è già aggiornato", async () => {
      utenteDao.findById.mockResolvedValue(unUtente({ quizSuperati: 1 }));
      svolgimentoDao.contaQuizSuperati.mockResolvedValue(1);

      await servizio.eseguiQuiz(1, 1, risposteCorrette(quiz));

      expect(utenteDao.updateQuizSuperati).not.toHaveBeenCalled();
    });

    it("riporta gli obiettivi sbloccati dal tentativo", async () => {
      obiettivoService.valutaConseguimenti.mockResolvedValue([unObiettivo()]);

      const esito = await servizio.eseguiQuiz(1, 1, risposteCorrette(quiz));

      expect(esito.obiettiviSbloccati.map((o) => o.getNome())).toEqual([
        "Principiante",
      ]);
    });

    it("segnala un quiz inesistente", async () => {
      quizDao.findById.mockResolvedValue(null);
      await expect(servizio.eseguiQuiz(99, 1, [])).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });

    it("segnala un utente inesistente", async () => {
      utenteDao.findById.mockResolvedValue(null);
      await expect(servizio.eseguiQuiz(1, 99, [])).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });

    it("segnala un quiz privo di domande", async () => {
      quizDao.findById.mockResolvedValue(unQuiz(0));
      await expect(servizio.eseguiQuiz(1, 1, [])).rejects.toBeInstanceOf(
        ValidationError,
      );
    });
  });
});
