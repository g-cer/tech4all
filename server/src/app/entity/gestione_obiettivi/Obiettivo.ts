/**
 * Obiettivo raggiungibile dagli utenti superando un certo numero di quiz.
 * Al raggiungimento viene assegnato il badge associato.
 */
export class Obiettivo {
  /**
   * @param nome Nome dell'obiettivo, chiave primaria.
   * @param descrizione Descrizione mostrata all'utente.
   * @param graficaBadge Percorso relativo dell'immagine del badge.
   * @param quizDaSuperare Numero di quiz da superare per conseguirlo.
   */
  constructor(
    private readonly nome: string,
    private descrizione: string,
    private graficaBadge: string,
    private quizDaSuperare: number,
  ) {}

  public getNome(): string {
    return this.nome;
  }

  public getDescrizione(): string {
    return this.descrizione;
  }

  public getGraficaBadge(): string {
    return this.graficaBadge;
  }

  public getQuizDaSuperare(): number {
    return this.quizDaSuperare;
  }

  public setDescrizione(value: string): void {
    this.descrizione = value;
  }

  public setGraficaBadge(value: string): void {
    this.graficaBadge = value;
  }

  public setQuizDaSuperare(value: number): void {
    this.quizDaSuperare = value;
  }
}
