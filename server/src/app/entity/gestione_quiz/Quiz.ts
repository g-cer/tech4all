import { Domanda } from "./Domanda";

/** Quiz di verifica associato a un tutorial (relazione uno a uno). */
export class Quiz {
  /**
   * @param tutorialId Tutorial a cui il quiz è associato.
   * @param domande Domande che compongono il quiz.
   * @param id Identificativo assegnato dal database.
   */
  constructor(
    private readonly tutorialId: number,
    private domande: Domanda[],
    private id?: number,
  ) {}

  public getId(): number | undefined {
    return this.id;
  }

  public getTutorialId(): number {
    return this.tutorialId;
  }

  public getDomande(): Domanda[] {
    return this.domande;
  }

  public setId(value: number): void {
    this.id = value;
  }

  public setDomande(value: Domanda[]): void {
    this.domande = value;
  }
}
