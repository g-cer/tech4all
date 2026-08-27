/**
 * Esito dello svolgimento di un quiz da parte di un utente.
 *
 * La chiave primaria è la coppia (utenteId, quizId): viene conservato
 * soltanto l'ultimo tentativo, e un quiz superato non viene più aggiornato.
 */
export class Svolgimento {
  /**
   * @param quizId Quiz svolto.
   * @param utenteId Utente che lo ha svolto.
   * @param esito True se il quiz è stato superato.
   * @param dataConseguimento Data del tentativo.
   * @param risposteEsatte Numero di risposte corrette date.
   */
  constructor(
    private readonly quizId: number,
    private readonly utenteId: number,
    private esito: boolean,
    private dataConseguimento: Date,
    private risposteEsatte: number,
  ) {}

  public getQuizId(): number {
    return this.quizId;
  }

  public getUtenteId(): number {
    return this.utenteId;
  }

  public getEsito(): boolean {
    return this.esito;
  }

  public getDataConseguimento(): Date {
    return this.dataConseguimento;
  }

  public getRisposteEsatte(): number {
    return this.risposteEsatte;
  }

  public setEsito(value: boolean): void {
    this.esito = value;
  }

  public setDataConseguimento(value: Date): void {
    this.dataConseguimento = value;
  }

  public setRisposteEsatte(value: number): void {
    this.risposteEsatte = value;
  }
}
