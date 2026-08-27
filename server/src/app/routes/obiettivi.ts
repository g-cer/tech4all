import { Router } from "express";
import { body } from "express-validator";
import { ObiettivoService } from "../services/ObiettivoService";
import { asyncHandler } from "../middleware/asyncHandler";
import { validate } from "../middleware/validate";
import { requireAdmin } from "../middleware/auth";
import { toObiettivoDTO } from "../dto";
import { OBIETTIVO } from "../validation/regole";

const validatoriObiettivo = [
  body("descrizione").isString().trim().isLength({
    min: OBIETTIVO.descrizioneMin,
    max: OBIETTIVO.descrizioneMax,
  }),
  body("graficaBadge").isString().trim().notEmpty(),
  body("quizDaSuperare").isInt({ min: 1 }).toInt(),
];

/**
 * Rotte degli obiettivi.
 *
 * L'elenco è pubblico (serve a mostrare i traguardi raggiungibili);
 * la loro definizione è riservata agli amministratori.
 */
export function creaObiettiviRouter(
  obiettivoService: ObiettivoService,
): Router {
  const router = Router();

  router.get(
    "/",
    asyncHandler(async (_req, res) => {
      const obiettivi = await obiettivoService.getObiettivi();
      res.status(200).json(obiettivi.map(toObiettivoDTO));
    }),
  );

  router.post(
    "/",
    requireAdmin,
    body("nome")
      .isString()
      .trim()
      .isLength({ min: OBIETTIVO.nomeMin, max: OBIETTIVO.nomeMax }),
    ...validatoriObiettivo,
    validate,
    asyncHandler(async (req, res) => {
      const obiettivo = await obiettivoService.creaObiettivo({
        nome: req.body.nome,
        descrizione: req.body.descrizione,
        graficaBadge: req.body.graficaBadge,
        quizDaSuperare: req.body.quizDaSuperare,
      });
      res.status(201).json(toObiettivoDTO(obiettivo));
    }),
  );

  router.put(
    "/:nome",
    requireAdmin,
    ...validatoriObiettivo,
    validate,
    asyncHandler(async (req, res) => {
      const obiettivo = await obiettivoService.aggiornaObiettivo(
        req.params.nome,
        {
          descrizione: req.body.descrizione,
          graficaBadge: req.body.graficaBadge,
          quizDaSuperare: req.body.quizDaSuperare,
        },
      );
      res.status(200).json(toObiettivoDTO(obiettivo));
    }),
  );

  router.delete(
    "/:nome",
    requireAdmin,
    asyncHandler(async (req, res) => {
      await obiettivoService.eliminaObiettivo(req.params.nome);
      res.status(204).send();
    }),
  );

  return router;
}
