import bcrypt from "bcrypt";
import { UtenteDao } from "../dao/UtenteDao";
import { Utente } from "../entity/gestione_autenticazione/Utente";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../errors/AppError";
import { MESSAGGIO_PASSWORD, UTENTE } from "../validation/regole";
import { env } from "../../config/env";

/** Modifiche applicabili al proprio profilo. I campi assenti restano invariati. */
export interface DatiAggiornamentoProfilo {
  nome?: string;
  cognome?: string;
  email?: string;
  passwordAttuale?: string;
  nuovaPassword?: string;
}

/** Gestione dei dati anagrafici e del ciclo di vita degli account. */
export class AccountService {
  constructor(private readonly utenteDao: UtenteDao = new UtenteDao()) {}

  /**
   * @throws NotFoundError se l'utente non esiste.
   */
  public async getUtente(id: number): Promise<Utente> {
    const utente = await this.utenteDao.findById(id);
    if (!utente) {
      throw new NotFoundError("Utente non trovato.");
    }
    return utente;
  }

  /** Elenco completo degli utenti registrati. Riservato agli amministratori. */
  public async getUtenti(): Promise<Utente[]> {
    return this.utenteDao.findAll();
  }

  /**
   * Aggiorna il profilo dell'utente indicato.
   *
   * Il cambio password richiede quella attuale: senza questa verifica una
   * sessione rubata permetterebbe di prendere possesso dell'account.
   *
   * @throws NotFoundError se l'utente non esiste.
   * @throws ValidationError se la nuova password non rispetta la politica.
   * @throws UnauthorizedError se la password attuale non è corretta.
   * @throws ConflictError se la nuova email è già in uso.
   */
  public async aggiornaProfilo(
    id: number,
    dati: DatiAggiornamentoProfilo,
  ): Promise<Utente> {
    const utente = await this.getUtente(id);

    if (dati.email && dati.email !== utente.getEmail()) {
      const occupata = await this.utenteDao.findByEmail(dati.email);
      if (occupata) {
        throw new ConflictError("Email già in uso.");
      }
      utente.setEmail(dati.email);
    }

    if (dati.nome) {
      utente.setNome(dati.nome);
    }
    if (dati.cognome) {
      utente.setCognome(dati.cognome);
    }

    if (dati.nuovaPassword) {
      if (!dati.passwordAttuale) {
        throw new ValidationError(
          "Per cambiare la password è necessario indicare quella attuale.",
        );
      }
      const corretta = await bcrypt.compare(
        dati.passwordAttuale,
        utente.getPasswordHash(),
      );
      if (!corretta) {
        throw new UnauthorizedError("Password attuale non corretta.");
      }
      if (!UTENTE.passwordRegex.test(dati.nuovaPassword)) {
        throw new ValidationError(MESSAGGIO_PASSWORD);
      }
      utente.setPasswordHash(
        await bcrypt.hash(dati.nuovaPassword, env.bcryptRounds),
      );
    }

    await this.utenteDao.update(utente);
    return utente;
  }

  /**
   * Elimina definitivamente un account. Feedback, svolgimenti e conseguimenti
   * associati vengono rimossi dal database per vincolo di integrità.
   *
   * @throws NotFoundError se l'utente non esiste.
   */
  public async eliminaUtente(id: number): Promise<void> {
    const eliminato = await this.utenteDao.delete(id);
    if (!eliminato) {
      throw new NotFoundError("Utente non trovato.");
    }
  }
}
