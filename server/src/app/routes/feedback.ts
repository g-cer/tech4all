import { Router } from "express";
import { body } from "express-validator";
import { FeedbackService } from "../services/FeedbackService";
import { asyncHandler } from "../middleware/asyncHandler";
import { parseId, validate } from "../middleware/validate";
import { requireAuth, utenteCorrente } from "../middleware/auth";
import { toFeedbackDTO } from "../dto";
import { Ruolo } from "../entity/gestione_autenticazione/Ruolo";
import { FEEDBACK } from "../validation/regole";

const validatoriFeedback = [
  body("valutazione")
    .isInt({ min: FEEDBACK.valutazioneMin, max: FEEDBACK.valutazioneMax })
    .withMessage(
      `La valutazione deve essere un intero tra ${FEEDBACK.valutazioneMin} e ${FEEDBACK.valutazioneMax}.`,
    )
    .toInt(),
  body("commento")
    .isString()
    .trim()
    .isLength({ min: FEEDBACK.commentoMin, max: FEEDBACK.commentoMax })
    .withMessage(
      `Il commento deve avere tra ${FEEDBACK.commentoMin} e ${FEEDBACK.commentoMax} caratteri.`,
    ),
];

/**
 * Rotte dei feedback.
 *
 * L'autore è sempre l'utente della sessione. Un amministratore può
 * eliminare i feedback altrui a fini di moderazione.
 */
export function creaFeedbackRouter(feedbackService: FeedbackService): Router {
  const router = Router();

  router.get(
    "/tutorial/:tutorialId",
    asyncHandler(async (req, res) => {
      const feedback = await feedbackService.getFeedbackTutorial(
        parseId(req.params.tutorialId, "tutorialId"),
      );
      res.status(200).json(feedback.map(toFeedbackDTO));
    }),
  );

  router.get(
    "/me",
    requireAuth,
    asyncHandler(async (req, res) => {
      const feedback = await feedbackService.getFeedbackUtente(
        utenteCorrente(req).id,
      );
      res.status(200).json(feedback.map(toFeedbackDTO));
    }),
  );

  router.post(
    "/tutorial/:tutorialId",
    requireAuth,
    ...validatoriFeedback,
    validate,
    asyncHandler(async (req, res) => {
      const feedback = await feedbackService.creaFeedback(
        utenteCorrente(req).id,
        parseId(req.params.tutorialId, "tutorialId"),
        { valutazione: req.body.valutazione, commento: req.body.commento },
      );
      res.status(201).json(toFeedbackDTO(feedback));
    }),
  );

  router.put(
    "/tutorial/:tutorialId",
    requireAuth,
    ...validatoriFeedback,
    validate,
    asyncHandler(async (req, res) => {
      const feedback = await feedbackService.aggiornaFeedback(
        utenteCorrente(req).id,
        parseId(req.params.tutorialId, "tutorialId"),
        { valutazione: req.body.valutazione, commento: req.body.commento },
      );
      res.status(200).json(toFeedbackDTO(feedback));
    }),
  );

  /** Elimina il proprio feedback su un tutorial. */
  router.delete(
    "/tutorial/:tutorialId",
    requireAuth,
    asyncHandler(async (req, res) => {
      const richiedente = utenteCorrente(req);
      await feedbackService.eliminaFeedback(
        richiedente.id,
        richiedente.id,
        parseId(req.params.tutorialId, "tutorialId"),
        false,
      );
      res.status(204).send();
    }),
  );

  /** Moderazione: elimina il feedback di un altro utente. */
  router.delete(
    "/tutorial/:tutorialId/utente/:utenteId",
    requireAuth,
    asyncHandler(async (req, res) => {
      const richiedente = utenteCorrente(req);
      await feedbackService.eliminaFeedback(
        richiedente.id,
        parseId(req.params.utenteId, "utenteId"),
        parseId(req.params.tutorialId, "tutorialId"),
        richiedente.ruolo === Ruolo.ADMIN,
      );
      res.status(204).send();
    }),
  );

  return router;
}
