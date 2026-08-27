import { RequestHandler } from "express";
import { validationResult } from "express-validator";
import { ValidationError } from "../errors/AppError";

/**
 * Trasforma l'esito di `express-validator` in un `ValidationError`.
 * Va posto subito dopo le catene di validazione di una rotta.
 */
export const validate: RequestHandler = (req, _res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) {
    next();
    return;
  }

  const details = result.array().map((issue) => ({
    campo: issue.type === "field" ? issue.path : undefined,
    messaggio: issue.msg as string,
  }));

  next(new ValidationError("Dati della richiesta non validi.", details));
};

/**
 * Converte un parametro di rotta in intero positivo.
 *
 * @throws ValidationError se il valore non è un intero positivo.
 */
export function parseId(value: string, nome = "id"): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError(`Parametro '${nome}' non valido.`);
  }
  return parsed;
}
