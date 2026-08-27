import { Router } from "express";
import { TutorialService } from "../services/TutorialService";
import { asyncHandler } from "../middleware/asyncHandler";
import { parseId } from "../middleware/validate";
import { requireAdmin } from "../middleware/auth";
import {
  eliminaImmagineContenuto,
  normalizzaCopertina,
  percorsoContenuto,
  uploadContenuto,
  uploadCopertina,
} from "../middleware/upload";
import { toTutorialDTO } from "../dto";
import { CATEGORIE } from "../entity/gestione_tutorial/Categoria";
import { ValidationError } from "../errors/AppError";

/**
 * Rotte del catalogo dei tutorial.
 *
 * La consultazione è pubblica; creazione, modifica ed eliminazione sono
 * riservate agli amministratori.
 */
export function creaTutorialsRouter(tutorialService: TutorialService): Router {
  const router = Router();

  /** Categorie ammesse: evita al client di replicarne l'elenco. */
  router.get("/categorie", (_req, res) => {
    res.status(200).json(CATEGORIE);
  });

  router.get(
    "/ricerca",
    asyncHandler(async (req, res) => {
      const tutorials = await tutorialService.cercaTutorial(
        String(req.query.parolaChiave ?? ""),
      );
      res.status(200).json(tutorials.map(toTutorialDTO));
    }),
  );

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const categoria =
        typeof req.query.categoria === "string"
          ? req.query.categoria
          : undefined;
      const tutorials = await tutorialService.getTutorials(categoria);
      res.status(200).json(tutorials.map(toTutorialDTO));
    }),
  );

  router.get(
    "/:id",
    asyncHandler(async (req, res) => {
      const tutorial = await tutorialService.getTutorial(
        parseId(req.params.id),
      );
      res.status(200).json(toTutorialDTO(tutorial));
    }),
  );

  router.post(
    "/",
    requireAdmin,
    uploadCopertina,
    asyncHandler(async (req, res) => {
      if (!req.file) {
        throw new ValidationError("L'immagine di copertina è obbligatoria.");
      }
      const grafica = await normalizzaCopertina(req.file);
      const tutorial = await tutorialService.creaTutorial({
        titolo: req.body.titolo,
        grafica,
        testo: req.body.testo,
        categoria: req.body.categoria,
      });
      res.status(201).json(toTutorialDTO(tutorial));
    }),
  );

  router.put(
    "/:id",
    requireAdmin,
    uploadCopertina,
    asyncHandler(async (req, res) => {
      const id = parseId(req.params.id);
      const esistente = await tutorialService.getTutorial(id);
      const grafica = req.file
        ? await normalizzaCopertina(req.file)
        : esistente.getGrafica();

      const tutorial = await tutorialService.aggiornaTutorial(id, {
        titolo: req.body.titolo,
        grafica,
        testo: req.body.testo,
        categoria: req.body.categoria,
      });
      res.status(200).json(toTutorialDTO(tutorial));
    }),
  );

  router.delete(
    "/:id",
    requireAdmin,
    asyncHandler(async (req, res) => {
      await tutorialService.eliminaTutorial(parseId(req.params.id));
      res.status(204).send();
    }),
  );

  /** Carica un'immagine da inserire nel corpo di un tutorial. */
  router.post(
    "/immagini",
    requireAdmin,
    uploadContenuto,
    asyncHandler(async (req, res) => {
      if (!req.file) {
        throw new ValidationError("Nessun file caricato.");
      }
      res.status(201).json({ percorso: percorsoContenuto(req.file) });
    }),
  );

  router.delete(
    "/immagini/:nomeFile",
    requireAdmin,
    asyncHandler(async (req, res) => {
      await eliminaImmagineContenuto(req.params.nomeFile);
      res.status(204).send();
    }),
  );

  return router;
}
