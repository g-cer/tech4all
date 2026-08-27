import { FeedbackService } from "../../app/services/FeedbackService";
import { FeedbackDao } from "../../app/dao/FeedbackDao";
import { TutorialDao } from "../../app/dao/TutorialDao";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../../app/errors/AppError";
import {
  Mock,
  mockFeedbackDao,
  mockTutorialDao,
  unFeedback,
  unTutorial,
} from "../helper/dao";

describe("FeedbackService", () => {
  let feedbackDao: Mock<FeedbackDao>;
  let tutorialDao: Mock<TutorialDao>;
  let servizio: FeedbackService;

  const datiValidi = { valutazione: 4, commento: "Tutorial chiaro e utile." };

  beforeEach(() => {
    feedbackDao = mockFeedbackDao();
    tutorialDao = mockTutorialDao();
    servizio = new FeedbackService(
      feedbackDao as unknown as FeedbackDao,
      tutorialDao as unknown as TutorialDao,
    );
  });

  describe("creaFeedback", () => {
    beforeEach(() => {
      tutorialDao.findById.mockResolvedValue(unTutorial());
      feedbackDao.find.mockResolvedValue(null);
    });

    it("registra un feedback valido", async () => {
      const feedback = await servizio.creaFeedback(1, 1, datiValidi);

      expect(feedback.getUtenteId()).toBe(1);
      expect(feedback.getTutorialId()).toBe(1);
      expect(feedbackDao.create).toHaveBeenCalledWith(feedback);
    });

    it("attribuisce il feedback all'utente indicato dal chiamante", async () => {
      const feedback = await servizio.creaFeedback(42, 7, datiValidi);
      expect(feedback.getUtenteId()).toBe(42);
      expect(feedback.getTutorialId()).toBe(7);
    });

    it.each([
      ["valutazione sotto il minimo", { valutazione: 0 }],
      ["valutazione sopra il massimo", { valutazione: 6 }],
      ["valutazione non intera", { valutazione: 3.5 }],
      ["commento troppo corto", { commento: "a" }],
      ["commento troppo lungo", { commento: "a".repeat(501) }],
    ])("rifiuta un feedback con %s", async (_etichetta, modifica) => {
      await expect(
        servizio.creaFeedback(1, 1, { ...datiValidi, ...modifica }),
      ).rejects.toBeInstanceOf(ValidationError);
      expect(feedbackDao.create).not.toHaveBeenCalled();
    });

    it("segnala un tutorial inesistente", async () => {
      tutorialDao.findById.mockResolvedValue(null);
      await expect(
        servizio.creaFeedback(1, 99, datiValidi),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("impedisce due feedback dello stesso utente sullo stesso tutorial", async () => {
      feedbackDao.find.mockResolvedValue(unFeedback());
      await expect(
        servizio.creaFeedback(1, 1, datiValidi),
      ).rejects.toBeInstanceOf(ConflictError);
    });
  });

  describe("aggiornaFeedback", () => {
    it("aggiorna un feedback esistente", async () => {
      feedbackDao.find.mockResolvedValue(unFeedback());

      const feedback = await servizio.aggiornaFeedback(1, 1, {
        valutazione: 2,
        commento: "Ho cambiato idea dopo un secondo passaggio.",
      });

      expect(feedback.getValutazione()).toBe(2);
      expect(feedbackDao.update).toHaveBeenCalledWith(feedback);
    });

    it("segnala un feedback inesistente", async () => {
      feedbackDao.find.mockResolvedValue(null);
      await expect(
        servizio.aggiornaFeedback(1, 1, datiValidi),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("eliminaFeedback", () => {
    it("permette a un utente di eliminare il proprio feedback", async () => {
      feedbackDao.delete.mockResolvedValue(true);
      await expect(
        servizio.eliminaFeedback(1, 1, 1, false),
      ).resolves.toBeUndefined();
      expect(feedbackDao.delete).toHaveBeenCalledWith(1, 1);
    });

    it("impedisce a un utente di eliminare il feedback altrui", async () => {
      await expect(
        servizio.eliminaFeedback(1, 2, 1, false),
      ).rejects.toBeInstanceOf(NotFoundError);
      expect(feedbackDao.delete).not.toHaveBeenCalled();
    });

    it("permette a un amministratore di moderare il feedback altrui", async () => {
      feedbackDao.delete.mockResolvedValue(true);
      await expect(
        servizio.eliminaFeedback(99, 2, 1, true),
      ).resolves.toBeUndefined();
      expect(feedbackDao.delete).toHaveBeenCalledWith(2, 1);
    });

    it("segnala un feedback inesistente", async () => {
      feedbackDao.delete.mockResolvedValue(false);
      await expect(
        servizio.eliminaFeedback(1, 1, 1, false),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("lettura", () => {
    it("restituisce i feedback di un tutorial", async () => {
      const attesi = [unFeedback()];
      feedbackDao.findByTutorial.mockResolvedValue(attesi);
      await expect(servizio.getFeedbackTutorial(1)).resolves.toBe(attesi);
    });

    it("restituisce i feedback di un utente", async () => {
      const attesi = [unFeedback()];
      feedbackDao.findByUtente.mockResolvedValue(attesi);
      await expect(servizio.getFeedbackUtente(1)).resolves.toBe(attesi);
    });
  });
});
