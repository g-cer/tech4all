import bcrypt from "bcrypt";
import { AutenticazioneService } from "../../app/services/AutenticazioneService";
import { Ruolo } from "../../app/entity/gestione_autenticazione/Ruolo";
import {
  ConflictError,
  UnauthorizedError,
  ValidationError,
} from "../../app/errors/AppError";
import { Mock, mockUtenteDao, unUtente } from "../helper/dao";
import { UtenteDao } from "../../app/dao/UtenteDao";

describe("AutenticazioneService", () => {
  let utenteDao: Mock<UtenteDao>;
  let servizio: AutenticazioneService;

  beforeEach(() => {
    utenteDao = mockUtenteDao();
    servizio = new AutenticazioneService(utenteDao as unknown as UtenteDao);
  });

  const datiValidi = {
    email: "nuovo@example.com",
    password: "Password1@",
    nome: "Anna",
    cognome: "Bianchi",
  };

  describe("registra", () => {
    it("rifiuta una password che non rispetta la politica", async () => {
      await expect(
        servizio.registra({ ...datiValidi, password: "debole" }),
      ).rejects.toBeInstanceOf(ValidationError);
      expect(utenteDao.create).not.toHaveBeenCalled();
    });

    it("rifiuta un'email già registrata", async () => {
      utenteDao.findByEmail.mockResolvedValue(unUtente());

      await expect(servizio.registra(datiValidi)).rejects.toBeInstanceOf(
        ConflictError,
      );
      expect(utenteDao.create).not.toHaveBeenCalled();
    });

    it("memorizza la password come hash bcrypt e mai in chiaro", async () => {
      utenteDao.findByEmail.mockResolvedValue(null);
      utenteDao.create.mockImplementation(async (utente) => utente);

      await servizio.registra(datiValidi);

      const salvato = utenteDao.create.mock.calls[0][0];
      const hash = salvato.getPasswordHash();
      expect(hash).not.toBe(datiValidi.password);
      expect(hash.startsWith("$2")).toBe(true);
      await expect(bcrypt.compare(datiValidi.password, hash)).resolves.toBe(
        true,
      );
    });

    it("assegna il ruolo utente ai nuovi iscritti", async () => {
      utenteDao.findByEmail.mockResolvedValue(null);
      utenteDao.create.mockImplementation(async (utente) => utente);

      await servizio.registra(datiValidi);

      expect(utenteDao.create.mock.calls[0][0].getRuolo()).toBe(Ruolo.UTENTE);
    });
  });

  describe("login", () => {
    it("riconosce le credenziali corrette", async () => {
      const passwordHash = await bcrypt.hash("Password1@", 4);
      const atteso = unUtente({ passwordHash });
      utenteDao.findByEmail.mockResolvedValue(atteso);

      const utente = await servizio.login(
        "mario.rossi@example.com",
        "Password1@",
      );

      expect(utente).toBe(atteso);
    });

    it("rifiuta una password errata", async () => {
      const passwordHash = await bcrypt.hash("Password1@", 4);
      utenteDao.findByEmail.mockResolvedValue(unUtente({ passwordHash }));

      await expect(
        servizio.login("mario.rossi@example.com", "Sbagliata1@"),
      ).rejects.toBeInstanceOf(UnauthorizedError);
    });

    it("non permette di distinguere un'email inesistente da una password errata", async () => {
      const passwordHash = await bcrypt.hash("Password1@", 4);

      utenteDao.findByEmail.mockResolvedValue(null);
      const inesistente = await servizio
        .login("nessuno@example.com", "Password1@")
        .catch((e: Error) => e.message);

      utenteDao.findByEmail.mockResolvedValue(unUtente({ passwordHash }));
      const passwordErrata = await servizio
        .login("mario.rossi@example.com", "Sbagliata1@")
        .catch((e: Error) => e.message);

      expect(inesistente).toBe(passwordErrata);
    });
  });

  describe("emailEsiste", () => {
    it("segnala un'email già registrata", async () => {
      utenteDao.findByEmail.mockResolvedValue(unUtente());
      await expect(
        servizio.emailEsiste("mario.rossi@example.com"),
      ).resolves.toBe(true);
    });

    it("segnala un'email libera", async () => {
      utenteDao.findByEmail.mockResolvedValue(null);
      await expect(servizio.emailEsiste("libera@example.com")).resolves.toBe(
        false,
      );
    });
  });
});
