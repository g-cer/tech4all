import {
  AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../../app/errors/AppError";

describe("Errori applicativi", () => {
  it.each([
    [new ValidationError("dati non validi"), 400, "VALIDATION_ERROR"],
    [new UnauthorizedError(), 401, "UNAUTHORIZED"],
    [new ForbiddenError(), 403, "FORBIDDEN"],
    [new NotFoundError(), 404, "NOT_FOUND"],
    [new ConflictError("conflitto"), 409, "CONFLICT"],
  ])("%p espone status e codice attesi", (errore, status, code) => {
    expect(errore.status).toBe(status);
    expect(errore.code).toBe(code);
    expect(errore).toBeInstanceOf(AppError);
    expect(errore).toBeInstanceOf(Error);
  });

  it("usa messaggi predefiniti sensati", () => {
    expect(new UnauthorizedError().message).toBe("Autenticazione richiesta.");
    expect(new ForbiddenError().message).toBe("Operazione non consentita.");
    expect(new NotFoundError().message).toBe("Risorsa non trovata.");
  });

  it("accetta messaggi specifici al posto di quelli predefiniti", () => {
    expect(new UnauthorizedError("sessione scaduta").message).toBe(
      "sessione scaduta",
    );
    expect(new ForbiddenError("solo amministratori").message).toBe(
      "solo amministratori",
    );
    expect(new NotFoundError("quiz assente").message).toBe("quiz assente");
  });

  it("conserva i dettagli di validazione quando forniti", () => {
    const dettagli = [{ campo: "email", messaggio: "non valida" }];
    expect(new ValidationError("errore", dettagli).details).toBe(dettagli);
    expect(new ValidationError("errore").details).toBeUndefined();
  });

  it("assegna a `name` il nome della classe concreta", () => {
    expect(new NotFoundError().name).toBe("NotFoundError");
    expect(new ConflictError("x").name).toBe("ConflictError");
  });
});
