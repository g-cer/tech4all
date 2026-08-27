import { Pool, PoolConnection } from "mysql2/promise";
import { ObiettivoDao } from "../dao/ObiettivoDao";
import { ConseguimentoDao } from "../dao/ConseguimentoDao";
import { Obiettivo } from "../entity/gestione_obiettivi/Obiettivo";
import { Conseguimento } from "../entity/gestione_obiettivi/Conseguimento";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../errors/AppError";
import { OBIETTIVO } from "../validation/regole";

/** Dati di creazione o aggiornamento di un obiettivo. */
export interface DatiObiettivo {
  nome: string;
  descrizione: string;
  graficaBadge: string;
  quizDaSuperare: number;
}

/** Obiettivo conseguito da un utente, con la data di assegnazione. */
export interface Badge {
  obiettivo: Obiettivo;
  conseguimento: Conseguimento;
}

/**
 * Gestione degli obiettivi e dell'assegnazione dei badge.
 *
 * Gli obiettivi sono dati di configurazione amministrati dagli amministratori;
 * i conseguimenti sono derivati automaticamente dal numero di quiz superati.
 */
export class ObiettivoService {
  constructor(
    private readonly obiettivoDao: ObiettivoDao = new ObiettivoDao(),
    private readonly conseguimentoDao: ConseguimentoDao = new ConseguimentoDao(),
  ) {}

  public async getObiettivi(): Promise<Obiettivo[]> {
    return this.obiettivoDao.findAll();
  }

  /** Badge già conseguiti dall'utente, in ordine di conseguimento. */
  public async getBadgeUtente(utenteId: number): Promise<Badge[]> {
    const [obiettivi, conseguimenti] = await Promise.all([
      this.obiettivoDao.findAll(),
      this.conseguimentoDao.findByUtente(utenteId),
    ]);

    const perNome = new Map(obiettivi.map((o) => [o.getNome(), o]));
    const badge: Badge[] = [];
    for (const conseguimento of conseguimenti) {
      const obiettivo = perNome.get(conseguimento.getObiettivoNome());
      if (obiettivo) {
        badge.push({ obiettivo, conseguimento });
      }
    }
    return badge;
  }

  /**
   * Assegna all'utente tutti gli obiettivi la cui soglia è stata raggiunta.
   * L'operazione è idempotente: gli obiettivi già conseguiti non vengono
   * riassegnati né restituiti.
   *
   * @param utenteId Utente da valutare.
   * @param quizSuperati Numero di quiz superati dall'utente.
   * @param connection Connessione transazionale, se l'assegnazione fa parte
   *   di un'operazione più ampia.
   * @returns Gli obiettivi sbloccati con questa chiamata.
   */
  public async valutaConseguimenti(
    utenteId: number,
    quizSuperati: number,
    connection?: Pool | PoolConnection,
  ): Promise<Obiettivo[]> {
    const [obiettivi, conseguiti] = await Promise.all([
      this.obiettivoDao.findAll(),
      this.conseguimentoDao.findByUtente(utenteId),
    ]);

    const giaConseguiti = new Set(conseguiti.map((c) => c.getObiettivoNome()));
    const daAssegnare = obiettivi.filter(
      (obiettivo) =>
        quizSuperati >= obiettivo.getQuizDaSuperare() &&
        !giaConseguiti.has(obiettivo.getNome()),
    );

    const adesso = new Date();
    for (const obiettivo of daAssegnare) {
      await this.conseguimentoDao.assegna(
        new Conseguimento(utenteId, obiettivo.getNome(), adesso),
        connection,
      );
    }

    return daAssegnare;
  }

  /**
   * @throws ValidationError se i dati non rispettano i vincoli di dominio.
   * @throws ConflictError se esiste già un obiettivo con lo stesso nome.
   */
  public async creaObiettivo(dati: DatiObiettivo): Promise<Obiettivo> {
    this.validaDati(dati);

    const esistente = await this.obiettivoDao.findByNome(dati.nome);
    if (esistente) {
      throw new ConflictError("Esiste già un obiettivo con questo nome.");
    }

    const obiettivo = new Obiettivo(
      dati.nome.trim(),
      dati.descrizione.trim(),
      dati.graficaBadge,
      dati.quizDaSuperare,
    );
    await this.obiettivoDao.create(obiettivo);
    return obiettivo;
  }

  /**
   * @throws NotFoundError se l'obiettivo non esiste.
   * @throws ValidationError se i dati non rispettano i vincoli di dominio.
   */
  public async aggiornaObiettivo(
    nome: string,
    dati: Omit<DatiObiettivo, "nome">,
  ): Promise<Obiettivo> {
    const obiettivo = await this.obiettivoDao.findByNome(nome);
    if (!obiettivo) {
      throw new NotFoundError("Obiettivo non trovato.");
    }

    this.validaDati({ ...dati, nome });

    obiettivo.setDescrizione(dati.descrizione.trim());
    obiettivo.setGraficaBadge(dati.graficaBadge);
    obiettivo.setQuizDaSuperare(dati.quizDaSuperare);
    await this.obiettivoDao.update(obiettivo);
    return obiettivo;
  }

  /**
   * @throws NotFoundError se l'obiettivo non esiste.
   */
  public async eliminaObiettivo(nome: string): Promise<void> {
    const eliminato = await this.obiettivoDao.delete(nome);
    if (!eliminato) {
      throw new NotFoundError("Obiettivo non trovato.");
    }
  }

  private validaDati(dati: DatiObiettivo): void {
    const nome = dati.nome?.trim() ?? "";
    if (nome.length < OBIETTIVO.nomeMin || nome.length > OBIETTIVO.nomeMax) {
      throw new ValidationError(
        `Il nome deve avere tra ${OBIETTIVO.nomeMin} e ${OBIETTIVO.nomeMax} caratteri.`,
      );
    }

    const descrizione = dati.descrizione?.trim() ?? "";
    if (
      descrizione.length < OBIETTIVO.descrizioneMin ||
      descrizione.length > OBIETTIVO.descrizioneMax
    ) {
      throw new ValidationError(
        `La descrizione deve avere tra ${OBIETTIVO.descrizioneMin} e ${OBIETTIVO.descrizioneMax} caratteri.`,
      );
    }

    if (!Number.isInteger(dati.quizDaSuperare) || dati.quizDaSuperare < 1) {
      throw new ValidationError(
        "Il numero di quiz da superare deve essere un intero positivo.",
      );
    }

    if (!dati.graficaBadge || dati.graficaBadge.trim().length === 0) {
      throw new ValidationError("L'immagine del badge è obbligatoria.");
    }
  }
}
