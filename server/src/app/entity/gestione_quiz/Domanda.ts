import { Risposta } from "./Risposta";

/** Domanda a scelta multipla appartenente a un quiz. */
export class Domanda {
  /**
   * @param testo Testo della domanda.
   * @param risposte Opzioni di risposta, esattamente una delle quali corretta.
   * @param quizId Quiz di appartenenza; `undefined` prima della persistenza.
   * @param id Identificativo assegnato dal database.
   */
  constructor(
    private testo: string,
    private risposte: Risposta[],
    private quizId?: number,
    private id?: number,
  ) {}

  public getId(): number | undefined {
    return this.id;
  }

  public getQuizId(): number | undefined {
    return this.quizId;
  }

  public getTesto(): string {
    return this.testo;
  }

  public getRisposte(): Risposta[] {
    return this.risposte;
  }

  /** Opzione corretta della domanda, se presente. */
  public getRispostaCorretta(): Risposta | undefined {
    return this.risposte.find((risposta) => risposta.isCorretta());
  }

  public setId(value: number): void {
    this.id = value;
  }

  public setQuizId(value: number): void {
    this.quizId = value;
  }

  public setTesto(value: string): void {
    this.testo = value;
  }

  public setRisposte(value: Risposta[]): void {
    this.risposte = value;
  }
}
