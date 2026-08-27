import { RequestHandler, Response } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../../config/env";
import { Utente } from "../entity/gestione_autenticazione/Utente";
import { Ruolo, isRuolo } from "../entity/gestione_autenticazione/Ruolo";
import { ForbiddenError, UnauthorizedError } from "../errors/AppError";
import { UtenteAutenticato } from "../../types/express";

/** Payload applicativo del token di sessione. */
interface PayloadToken {
  sub: string;
  ruolo: Ruolo;
}

/** Firma un token di sessione per l'utente indicato. */
export function firmaToken(utente: Utente): string {
  const payload: PayloadToken = {
    sub: String(utente.getId()),
    ruolo: utente.getRuolo(),
  };
  const options: SignOptions = {
    expiresIn: env.jwt.expiresIn as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, env.jwt.secret, options);
}

/**
 * Deposita il token in un cookie `httpOnly`: il JavaScript di pagina non può
 * leggerlo, il che elimina l'esfiltrazione del token tramite XSS.
 */
export function impostaCookieSessione(res: Response, token: string): void {
  res.cookie(env.jwt.cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProduction,
    path: "/",
  });
}

/** Invalida la sessione lato client rimuovendo il cookie. */
export function rimuoviCookieSessione(res: Response): void {
  res.clearCookie(env.jwt.cookieName, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProduction,
    path: "/",
  });
}

function estraiIdentita(token: string): UtenteAutenticato {
  let payload: unknown;
  try {
    payload = jwt.verify(token, env.jwt.secret);
  } catch {
    throw new UnauthorizedError("Sessione non valida o scaduta.");
  }

  if (typeof payload !== "object" || payload === null) {
    throw new UnauthorizedError("Sessione non valida o scaduta.");
  }

  const { sub, ruolo } = payload as Partial<PayloadToken>;
  const id = Number(sub);
  if (!Number.isInteger(id) || id <= 0 || !isRuolo(ruolo)) {
    throw new UnauthorizedError("Sessione non valida o scaduta.");
  }

  return { id, ruolo };
}

/**
 * Legge il token dal cookie di sessione, senza rifiutare la richiesta se
 * assente. Serve alle rotte pubbliche che cambiano comportamento a seconda
 * che il chiamante sia autenticato o meno.
 */
export const attachUtente: RequestHandler = (req, _res, next) => {
  const token = req.cookies?.[env.jwt.cookieName];
  if (typeof token === "string" && token.length > 0) {
    try {
      req.utente = estraiIdentita(token);
    } catch {
      // Token illeggibile su rotta pubblica: si prosegue come anonimi.
    }
  }
  next();
};

/** Richiede un utente autenticato; risponde 401 altrimenti. */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const token = req.cookies?.[env.jwt.cookieName];
  if (typeof token !== "string" || token.length === 0) {
    next(new UnauthorizedError());
    return;
  }

  try {
    req.utente = estraiIdentita(token);
    next();
  } catch (error) {
    next(error);
  }
};

/** Richiede un utente autenticato con ruolo amministratore. */
export const requireAdmin: RequestHandler = (req, res, next) => {
  requireAuth(req, res, (error?: unknown) => {
    if (error) {
      next(error);
      return;
    }
    if (req.utente?.ruolo !== Ruolo.ADMIN) {
      next(new ForbiddenError("Operazione riservata agli amministratori."));
      return;
    }
    next();
  });
};

/**
 * Identità dell'utente autenticato sulla richiesta corrente.
 *
 * @throws UnauthorizedError se invocata su una rotta non protetta da `requireAuth`.
 */
export function utenteCorrente(req: {
  utente?: UtenteAutenticato;
}): UtenteAutenticato {
  if (!req.utente) {
    throw new UnauthorizedError();
  }
  return req.utente;
}
