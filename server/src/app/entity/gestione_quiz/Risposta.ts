/** Singola opzione di risposta a una domanda di quiz. */
export class Risposta {
  /**
   * @param testo Testo dell'opzione.
   * @param corretta True se è l'opzione corretta.
   * @param domandaId Domanda di appartenenza; `undefined` prima della persistenza.
   * @param id Identificativo assegnato dal database.
   */
  constructor(
    private testo: string,
    private corretta: boolean,
    private domandaId?: number,
    private id?: number,
  ) {}

  public getId(): number | undefined {
    return this.id;
  }

  public getDomandaId(): number | undefined {
    return this.domandaId;
  }

  public getTesto(): string {
    return this.testo;
  }

  public isCorretta(): boolean {
    return this.corretta;
  }

  public setId(value: number): void {
    this.id = value;
  }

  public setDomandaId(value: number): void {
    this.domandaId = value;
  }

  public setTesto(value: string): void {
    this.testo = value;
  }

  public setCorretta(value: boolean): void {
    this.corretta = value;
  }
}
