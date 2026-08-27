import { Router } from "express";
import { body } from "express-validator";
import { AccountService } from "../services/AccountService";
import { ObiettivoService } from "../services/ObiettivoService";
import { asyncHandler } from "../middleware/asyncHandler";
import { parseId, validate } from "../middleware/validate";
import {
  requireAdmin,
  requireAuth,
  rimuoviCookieSessione,
  utenteCorrente,
} from "../middleware/auth";
import { toBadgeDTO, toUtenteDTO } from "../dto";
import { UTENTE } from "../validation/regole";

/**
 * Rotte di gestione degli account.
 *
 * `/me` opera sempre sull'utente della sessione: nessun identificativo
 * arriva dal corpo della richiesta, quindi non è possibile agire per conto
 * di un altro utente.
 */
export function creaAccountsRouter(
  accountService: AccountService,
  obiettivoService: ObiettivoService,
): Router {
  const router = Router();

  router.get(
    "/me",
    requireAuth,
    asyncHandler(async (req, res) => {
      const utente = await accountService.getUtente(utenteCorrente(req).id);
      res.status(200).json(toUtenteDTO(utente));
    }),
  );

  router.put(
    "/me",
    requireAuth,
    body("email").optional().isEmail().normalizeEmail(),
    body("nome")
      .optional()
      .trim()
      .isLength({ min: UTENTE.nomeMin, max: UTENTE.nomeMax })
      .matches(UTENTE.nomeRegex),
    body("cognome")
      .optional()
      .trim()
      .isLength({ min: UTENTE.nomeMin, max: UTENTE.nomeMax })
      .matches(UTENTE.nomeRegex),
    body("passwordAttuale").optional().isString(),
    body("nuovaPassword").optional().isString(),
    validate,
    asyncHandler(async (req, res) => {
      const utente = await accountService.aggiornaProfilo(
        utenteCorrente(req).id,
        {
          nome: req.body.nome,
          cognome: req.body.cognome,
          email: req.body.email,
          passwordAttuale: req.body.passwordAttuale,
          nuovaPassword: req.body.nuovaPassword,
        },
      );
      res.status(200).json(toUtenteDTO(utente));
    }),
  );

  router.delete(
    "/me",
    requireAuth,
    asyncHandler(async (req, res) => {
      await accountService.eliminaUtente(utenteCorrente(req).id);
      rimuoviCookieSessione(res);
      res.status(204).send();
    }),
  );

  /** Badge conseguiti dall'utente della sessione. */
  router.get(
    "/me/badge",
    requireAuth,
    asyncHandler(async (req, res) => {
      const badge = await obiettivoService.getBadgeUtente(
        utenteCorrente(req).id,
      );
      res
        .status(200)
        .json(badge.map((b) => toBadgeDTO(b.obiettivo, b.conseguimento)));
    }),
  );

  router.get(
    "/",
    requireAdmin,
    asyncHandler(async (_req, res) => {
      const utenti = await accountService.getUtenti();
      res.status(200).json(utenti.map(toUtenteDTO));
    }),
  );

  router.delete(
    "/:id",
    requireAdmin,
    asyncHandler(async (req, res) => {
      await accountService.eliminaUtente(parseId(req.params.id));
      res.status(204).send();
    }),
  );

  return router;
}
