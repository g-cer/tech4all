/** Assegnazione di un obiettivo a un utente in un dato istante. */
export class Conseguimento {
  /**
   * @param utenteId Utente che ha conseguito l'obiettivo.
   * @param obiettivoNome Obiettivo conseguito.
   * @param dataConseguimento Istante del conseguimento.
   */
  constructor(
    private readonly utenteId: number,
    private readonly obiettivoNome: string,
    private readonly dataConseguimento: Date,
  ) {}

  public getUtenteId(): number {
    return this.utenteId;
  }

  public getObiettivoNome(): string {
    return this.obiettivoNome;
  }

  public getDataConseguimento(): Date {
    return this.dataConseguimento;
  }
}
