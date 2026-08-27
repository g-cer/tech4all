/** Ruoli previsti dal sistema. Corrisponde alla colonna `utente.ruolo`. */
export enum Ruolo {
  UTENTE = "utente",
  ADMIN = "admin",
}

/** Verifica che un valore proveniente dall'esterno sia un ruolo valido. */
export function isRuolo(value: unknown): value is Ruolo {
  return value === Ruolo.UTENTE || value === Ruolo.ADMIN;
}
