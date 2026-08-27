import { ErrorRequestHandler, RequestHandler } from "express";
import { AppError, NotFoundError } from "../errors/AppError";
import { env } from "../../config/env";

/** Risposta di errore uniforme per tutte le rotte. */
interface ErrorBody {
  message: string;
  code: string;
  details?: unknown;
}

/** Intercetta le rotte inesistenti e le inoltra all'errorHandler. */
export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(
    new NotFoundError(`Rotta non trovata: ${req.method} ${req.originalUrl}`),
  );
};

/**
 * Gestore centralizzato degli errori: unico punto in cui un errore diventa
 * una risposta HTTP. Gli errori non previsti non espongono dettagli interni.
 */
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    const body: ErrorBody = { message: error.message, code: error.code };
    if (error.details !== undefined) {
      body.details = error.details;
    }
    res.status(error.status).json(body);
    return;
  }

  if (!env.isTest) {
    console.error("Errore non gestito:", error);
  }

  res.status(500).json({
    message: "Errore interno del server. Riprova più tardi.",
    code: "INTERNAL_ERROR",
  } satisfies ErrorBody);
};
