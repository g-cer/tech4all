import { Router } from "express";
import { body } from "express-validator";
import { QuizService } from "../services/QuizService";
import { asyncHandler } from "../middleware/asyncHandler";
import { parseId, validate } from "../middleware/validate";
import { requireAdmin, requireAuth, utenteCorrente } from "../middleware/auth";
import { toObiettivoDTO, toQuizDTO } from "../dto";
import { QUIZ } from "../validation/regole";

const validatoriDomande = [
  body("domande").isArray({ min: QUIZ.domandeMin }),
  body("domande.*.testo").isString().trim().notEmpty(),
  body("domande.*.risposte").isArray({
    min: QUIZ.risposteMin,
    max: QUIZ.risposteMax,
  }),
  body("domande.*.risposte.*.testo").isString().trim().notEmpty(),
  body("domande.*.risposte.*.corretta").isBoolean(),
];

/**
 * Rotte dei quiz.
 *
 * Il quiz restituito in lettura non contiene le soluzioni: la correzione è
 * un'operazione del server, richiesta con `POST /quiz/:id/svolgimenti`.
 */
export function creaQuizRouter(quizService: QuizService): Router {
  const router = Router();

  router.get(
    "/tutorial/:tutorialId",
    asyncHandler(async (req, res) => {
      const quiz = await quizService.getQuizPerTutorial(
        parseId(req.params.tutorialId, "tutorialId"),
      );
      res.status(200).json(toQuizDTO(quiz));
    }),
  );

  router.post(
    "/tutorial/:tutorialId",
    requireAdmin,
    ...validatoriDomande,
    validate,
    asyncHandler(async (req, res) => {
      const quiz = await quizService.creaQuiz(
        parseId(req.params.tutorialId, "tutorialId"),
        req.body.domande,
      );
      res.status(201).json(toQuizDTO(quiz));
    }),
  );

  router.put(
    "/:id",
    requireAdmin,
    ...validatoriDomande,
    validate,
    asyncHandler(async (req, res) => {
      const quiz = await quizService.aggiornaQuiz(
        parseId(req.params.id),
        req.body.domande,
      );
      res.status(200).json(toQuizDTO(quiz));
    }),
  );

  router.delete(
    "/:id",
    requireAdmin,
    asyncHandler(async (req, res) => {
      await quizService.eliminaQuiz(parseId(req.params.id));
      res.status(204).send();
    }),
  );

  /** Consegna le risposte di un quiz e ne riceve la correzione. */
  router.post(
    "/:id/svolgimenti",
    requireAuth,
    body("risposte").isArray(),
    body("risposte.*.domandaId").isInt({ min: 1 }).toInt(),
    body("risposte.*.rispostaId").isInt({ min: 1 }).toInt(),
    validate,
    asyncHandler(async (req, res) => {
      const esito = await quizService.eseguiQuiz(
        parseId(req.params.id),
        utenteCorrente(req).id,
        req.body.risposte,
      );
      res.status(200).json({
        esito: esito.esito,
        risposteEsatte: esito.risposteEsatte,
        totaleDomande: esito.totaleDomande,
        sogliaSuperamento: QUIZ.sogliaSuperamento,
        soluzioni: esito.soluzioni,
        obiettiviSbloccati: esito.obiettiviSbloccati.map(toObiettivoDTO),
      });
    }),
  );

  return router;
}
