import { Ruolo } from "./Ruolo";

/**
 * Utente registrato alla piattaforma.
 *
 * La password non è mai conservata in chiaro: `passwordHash` contiene
 * l'hash bcrypt prodotto in fase di registrazione.
 */
export class Utente {
  /**
   * @param id Identificativo assegnato dal database; `undefined` prima della persistenza.
   * @param email Indirizzo email, univoco nel sistema.
   * @param passwordHash Hash bcrypt della password.
   * @param nome Nome dell'utente.
   * @param cognome Cognome dell'utente.
   * @param ruolo Ruolo assegnato, che determina i permessi.
   * @param quizSuperati Numero di quiz distinti superati, usato per i badge.
   */
  constructor(
    private readonly id: number | undefined,
    private email: string,
    private passwordHash: string,
    private nome: string,
    private cognome: string,
    private ruolo: Ruolo,
    private quizSuperati: number = 0,
  ) {}

  public getId(): number | undefined {
    return this.id;
  }

  public getEmail(): string {
    return this.email;
  }

  public getPasswordHash(): string {
    return this.passwordHash;
  }

  public getNome(): string {
    return this.nome;
  }

  public getCognome(): string {
    return this.cognome;
  }

  public getRuolo(): Ruolo {
    return this.ruolo;
  }

  public getQuizSuperati(): number {
    return this.quizSuperati;
  }

  /** True se l'utente ha privilegi amministrativi. */
  public isAdmin(): boolean {
    return this.ruolo === Ruolo.ADMIN;
  }

  public setEmail(value: string): void {
    this.email = value;
  }

  public setPasswordHash(value: string): void {
    this.passwordHash = value;
  }

  public setNome(value: string): void {
    this.nome = value;
  }

  public setCognome(value: string): void {
    this.cognome = value;
  }

  public setRuolo(value: Ruolo): void {
    this.ruolo = value;
  }

  public setQuizSuperati(value: number): void {
    this.quizSuperati = value;
  }
}
