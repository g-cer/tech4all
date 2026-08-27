import { Categoria } from "./Categoria";

/**
 * Tutorial pubblicato sulla piattaforma.
 *
 * `valutazione` è la media dei feedback ricevuti: è mantenuta dal database
 * tramite trigger e va quindi trattata come sola lettura dal codice applicativo.
 */
export class Tutorial {
  /**
   * @param id Identificativo assegnato dal database; `undefined` prima della persistenza.
   * @param titolo Titolo del tutorial.
   * @param grafica Percorso relativo dell'immagine di copertina.
   * @param testo Contenuto HTML del tutorial, già sanificato.
   * @param categoria Categoria di appartenenza.
   * @param valutazione Media dei feedback (1-5), `null` se non ancora valutato.
   */
  constructor(
    private readonly id: number | undefined,
    private titolo: string,
    private grafica: string,
    private testo: string,
    private categoria: Categoria,
    private readonly valutazione: number | null = null,
  ) {}

  public getId(): number | undefined {
    return this.id;
  }

  public getTitolo(): string {
    return this.titolo;
  }

  public getGrafica(): string {
    return this.grafica;
  }

  public getTesto(): string {
    return this.testo;
  }

  public getCategoria(): Categoria {
    return this.categoria;
  }

  public getValutazione(): number | null {
    return this.valutazione;
  }

  public setTitolo(value: string): void {
    this.titolo = value;
  }

  public setGrafica(value: string): void {
    this.grafica = value;
  }

  public setTesto(value: string): void {
    this.testo = value;
  }

  public setCategoria(value: Categoria): void {
    this.categoria = value;
  }
}
