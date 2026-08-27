import { Router } from "express";
import { body } from "express-validator";
import { AutenticazioneService } from "../services/AutenticazioneService";
import { asyncHandler } from "../middleware/asyncHandler";
import { validate } from "../middleware/validate";
import {
  firmaToken,
  impostaCookieSessione,
  rimuoviCookieSessione,
  requireAuth,
  utenteCorrente,
} from "../middleware/auth";
import { AccountService } from "../services/AccountService";
import { toUtenteDTO } from "../dto";
import { MESSAGGIO_PASSWORD, UTENTE } from "../validation/regole";

/**
 * Rotte di autenticazione.
 *
 * @param autenticazioneService Servizio di autenticazione.
 * @param accountService Servizio account, usato da `GET /auth/me`.
 */
export function creaAuthRouter(
  autenticazioneService: AutenticazioneService,
  accountService: AccountService,
): Router {
  const router = Router();

  router.post(
    "/registrazione",
    body("email")
      .isEmail()
      .withMessage("Formato email non valido.")
      .isLength({ min: UTENTE.emailMin, max: UTENTE.emailMax })
      .withMessage("Lunghezza email non valida.")
      .normalizeEmail(),
    body("password")
      .isString()
      .bail()
      .notEmpty()
      .withMessage(MESSAGGIO_PASSWORD),
    body("nome")
      .trim()
      .isLength({ min: UTENTE.nomeMin, max: UTENTE.nomeMax })
      .withMessage("Lunghezza del nome non valida.")
      .matches(UTENTE.nomeRegex)
      .withMessage("Il nome contiene caratteri non ammessi."),
    body("cognome")
      .trim()
      .isLength({ min: UTENTE.nomeMin, max: UTENTE.nomeMax })
      .withMessage("Lunghezza del cognome non valida.")
      .matches(UTENTE.nomeRegex)
      .withMessage("Il cognome contiene caratteri non ammessi."),
    validate,
    asyncHandler(async (req, res) => {
      const utente = await autenticazioneService.registra({
        email: req.body.email,
        password: req.body.password,
        nome: req.body.nome,
        cognome: req.body.cognome,
      });
      res.status(201).json(toUtenteDTO(utente));
    }),
  );

  router.post(
    "/login",
    body("email")
      .isString()
      .bail()
      .notEmpty()
      .withMessage("Email obbligatoria."),
    body("password")
      .isString()
      .bail()
      .notEmpty()
      .withMessage("Password obbligatoria."),
    validate,
    asyncHandler(async (req, res) => {
      const utente = await autenticazioneService.login(
        req.body.email,
        req.body.password,
      );
      impostaCookieSessione(res, firmaToken(utente));
      res.status(200).json(toUtenteDTO(utente));
    }),
  );

  router.post("/logout", (_req, res) => {
    rimuoviCookieSessione(res);
    res.status(204).send();
  });

  /** Profilo dell'utente della sessione corrente. */
  router.get(
    "/me",
    requireAuth,
    asyncHandler(async (req, res) => {
      const { id } = utenteCorrente(req);
      const utente = await accountService.getUtente(id);
      res.status(200).json(toUtenteDTO(utente));
    }),
  );

  /** Disponibilità di un'email, per la validazione in tempo reale del form. */
  router.get(
    "/email-disponibile",
    asyncHandler(async (req, res) => {
      const email = String(req.query.email ?? "");
      const esiste =
        email.length > 0 && (await autenticazioneService.emailEsiste(email));
      res.status(200).json({ disponibile: !esiste });
    }),
  );

  return router;
}
