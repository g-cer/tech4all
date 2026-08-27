import { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Adatta un handler asincrono a Express 4, che non intercetta le promise
 * rifiutate: senza questo wrapper un `throw` dentro un handler `async`
 * resterebbe non gestito invece di raggiungere l'`errorHandler`.
 */
export function asyncHandler(
  handler: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}
