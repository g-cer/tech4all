/**
 * Errore applicativo con uno status HTTP associato.
 *
 * I service lanciano sottoclassi di `AppError`; l'`errorHandler` le traduce
 * nella risposta HTTP. Qualsiasi altro errore è considerato imprevisto e
 * produce un 500 senza esporre dettagli interni al client.
 */
export abstract class AppError extends Error {
  /** Status HTTP con cui rispondere. */
  public abstract readonly status: number;
  /** Codice stabile, pensato per essere interpretato dal client. */
  public abstract readonly code: string;
  /** Dettagli opzionali (es. elenco dei campi non validi). */
  public readonly details?: unknown;

  protected constructor(message: string, details?: unknown) {
    super(message);
    this.name = new.target.name;
    this.details = details;
    Error.captureStackTrace?.(this, new.target);
  }
}

/** 400 — input sintatticamente o semanticamente non valido. */
export class ValidationError extends AppError {
  public readonly status = 400;
  public readonly code = "VALIDATION_ERROR";

  constructor(message: string, details?: unknown) {
    super(message, details);
  }
}

/** 401 — credenziali assenti o non valide. */
export class UnauthorizedError extends AppError {
  public readonly status = 401;
  public readonly code = "UNAUTHORIZED";

  constructor(message = "Autenticazione richiesta.") {
    super(message);
  }
}

/** 403 — utente autenticato ma non autorizzato all'operazione. */
export class ForbiddenError extends AppError {
  public readonly status = 403;
  public readonly code = "FORBIDDEN";

  constructor(message = "Operazione non consentita.") {
    super(message);
  }
}

/** 404 — risorsa inesistente. */
export class NotFoundError extends AppError {
  public readonly status = 404;
  public readonly code = "NOT_FOUND";

  constructor(message = "Risorsa non trovata.") {
    super(message);
  }
}

/** 409 — l'operazione confligge con lo stato attuale delle risorse. */
export class ConflictError extends AppError {
  public readonly status = 409;
  public readonly code = "CONFLICT";

  constructor(message: string) {
    super(message);
  }
}
