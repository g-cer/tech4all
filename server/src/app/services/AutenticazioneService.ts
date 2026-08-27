import bcrypt from "bcrypt";
import { UtenteDao } from "../dao/UtenteDao";
import { Utente } from "../entity/gestione_autenticazione/Utente";
import { Ruolo } from "../entity/gestione_autenticazione/Ruolo";
import {
  ConflictError,
  UnauthorizedError,
  ValidationError,
} from "../errors/AppError";
import { MESSAGGIO_PASSWORD, UTENTE } from "../validation/regole";
import { env } from "../../config/env";

/** Dati necessari a registrare un nuovo utente. */
export interface DatiRegistrazione {
  email: string;
  password: string;
  nome: string;
  cognome: string;
}

/**
 * Registrazione e riconoscimento degli utenti.
 *
 * Il servizio non emette né valida token: se ne occupa il middleware di
 * autenticazione. Qui si verificano soltanto le credenziali.
 */
export class AutenticazioneService {
  constructor(private readonly utenteDao: UtenteDao = new UtenteDao()) {}

  /**
   * Registra un nuovo utente con ruolo `utente`.
   *
   * @throws ValidationError se la password non rispetta la politica prevista.
   * @throws ConflictError se l'email è già associata a un account.
   */
  public async registra(dati: DatiRegistrazione): Promise<Utente> {
    if (!UTENTE.passwordRegex.test(dati.password)) {
      throw new ValidationError(MESSAGGIO_PASSWORD);
    }

    const esistente = await this.utenteDao.findByEmail(dati.email);
    if (esistente) {
      throw new ConflictError("Email già in uso.");
    }

    const passwordHash = await bcrypt.hash(dati.password, env.bcryptRounds);
    return this.utenteDao.create(
      new Utente(
        undefined,
        dati.email,
        passwordHash,
        dati.nome,
        dati.cognome,
        Ruolo.UTENTE,
        0,
      ),
    );
  }

  /**
   * Verifica le credenziali di accesso.
   *
   * Email inesistente e password errata producono lo stesso errore: distinguerli
   * permetterebbe di enumerare gli account registrati.
   *
   * @throws UnauthorizedError se le credenziali non sono valide.
   */
  public async login(email: string, password: string): Promise<Utente> {
    const utente = await this.utenteDao.findByEmail(email);
    const passwordCorretta =
      utente !== null &&
      (await bcrypt.compare(password, utente.getPasswordHash()));

    if (!utente || !passwordCorretta) {
      throw new UnauthorizedError("Email o password non corretti.");
    }

    return utente;
  }

  /** True se l'email è già registrata. Usata per il controllo in tempo reale del form. */
  public async emailEsiste(email: string): Promise<boolean> {
    return (await this.utenteDao.findByEmail(email)) !== null;
  }
}
