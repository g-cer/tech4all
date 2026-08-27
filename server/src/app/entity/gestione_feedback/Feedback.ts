/**
 * Valutazione lasciata da un utente su un tutorial.
 *
 * La chiave primaria è la coppia (utenteId, tutorialId): un utente può
 * lasciare al più un feedback per tutorial.
 */
export class Feedback {
  /**
   * @param valutazione Punteggio da 1 a 5.
   * @param commento Testo del feedback.
   * @param utenteId Autore del feedback.
   * @param tutorialId Tutorial valutato.
   * @param dataCreazione Istante di inserimento, assegnato dal database.
   */
  constructor(
    private valutazione: number,
    private commento: string,
    private readonly utenteId: number,
    private readonly tutorialId: number,
    private readonly dataCreazione: Date | null = null,
  ) {}

  public getValutazione(): number {
    return this.valutazione;
  }

  public getCommento(): string {
    return this.commento;
  }

  public getUtenteId(): number {
    return this.utenteId;
  }

  public getTutorialId(): number {
    return this.tutorialId;
  }

  public getDataCreazione(): Date | null {
    return this.dataCreazione;
  }

  public setValutazione(value: number): void {
    this.valutazione = value;
  }

  public setCommento(value: string): void {
    this.commento = value;
  }
}
