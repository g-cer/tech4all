import bcrypt from "bcrypt";
import { AccountService } from "../../app/services/AccountService";
import { UtenteDao } from "../../app/dao/UtenteDao";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../../app/errors/AppError";
import { Mock, mockUtenteDao, unUtente } from "../helper/dao";

describe("AccountService", () => {
  let utenteDao: Mock<UtenteDao>;
  let servizio: AccountService;

  beforeEach(() => {
    utenteDao = mockUtenteDao();
    servizio = new AccountService(utenteDao as unknown as UtenteDao);
  });

  describe("getUtente", () => {
    it("restituisce l'utente richiesto", async () => {
      const atteso = unUtente();
      utenteDao.findById.mockResolvedValue(atteso);
      await expect(servizio.getUtente(1)).resolves.toBe(atteso);
    });

    it("segnala un utente inesistente", async () => {
      utenteDao.findById.mockResolvedValue(null);
      await expect(servizio.getUtente(99)).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });
  });

  describe("aggiornaProfilo", () => {
    beforeEach(() => {
      utenteDao.findById.mockResolvedValue(unUtente());
    });

    it("aggiorna nome e cognome", async () => {
      const utente = await servizio.aggiornaProfilo(1, {
        nome: "Maria",
        cognome: "Verdi",
      });

      expect(utente.getNome()).toBe("Maria");
      expect(utente.getCognome()).toBe("Verdi");
      expect(utenteDao.update).toHaveBeenCalledWith(utente);
    });

    it("lascia invariati i campi non indicati", async () => {
      const utente = await servizio.aggiornaProfilo(1, { nome: "Maria" });
      expect(utente.getCognome()).toBe("Rossi");
    });

    it("rifiuta un'email già assegnata a un altro account", async () => {
      utenteDao.findByEmail.mockResolvedValue(unUtente({ id: 2 }));

      await expect(
        servizio.aggiornaProfilo(1, { email: "occupata@example.com" }),
      ).rejects.toBeInstanceOf(ConflictError);
      expect(utenteDao.update).not.toHaveBeenCalled();
    });

    it("accetta l'email invariata senza controlli di unicità", async () => {
      await servizio.aggiornaProfilo(1, { email: "mario.rossi@example.com" });
      expect(utenteDao.findByEmail).not.toHaveBeenCalled();
    });

    it("richiede la password attuale per cambiarla", async () => {
      await expect(
        servizio.aggiornaProfilo(1, { nuovaPassword: "NuovaPass1@" }),
      ).rejects.toBeInstanceOf(ValidationError);
    });

    it("rifiuta una password attuale errata", async () => {
      const passwordHash = await bcrypt.hash("Password1@", 4);
      utenteDao.findById.mockResolvedValue(unUtente({ passwordHash }));

      await expect(
        servizio.aggiornaProfilo(1, {
          passwordAttuale: "Sbagliata1@",
          nuovaPassword: "NuovaPass1@",
        }),
      ).rejects.toBeInstanceOf(UnauthorizedError);
    });

    it("rifiuta una nuova password che non rispetta la politica", async () => {
      const passwordHash = await bcrypt.hash("Password1@", 4);
      utenteDao.findById.mockResolvedValue(unUtente({ passwordHash }));

      await expect(
        servizio.aggiornaProfilo(1, {
          passwordAttuale: "Password1@",
          nuovaPassword: "debole",
        }),
      ).rejects.toBeInstanceOf(ValidationError);
    });

    it("salva la nuova password come hash", async () => {
      const passwordHash = await bcrypt.hash("Password1@", 4);
      utenteDao.findById.mockResolvedValue(unUtente({ passwordHash }));

      const utente = await servizio.aggiornaProfilo(1, {
        passwordAttuale: "Password1@",
        nuovaPassword: "NuovaPass1@",
      });

      await expect(
        bcrypt.compare("NuovaPass1@", utente.getPasswordHash()),
      ).resolves.toBe(true);
    });
  });

  describe("eliminaUtente", () => {
    it("elimina un account esistente", async () => {
      utenteDao.delete.mockResolvedValue(true);
      await expect(servizio.eliminaUtente(1)).resolves.toBeUndefined();
    });

    it("segnala un account inesistente", async () => {
      utenteDao.delete.mockResolvedValue(false);
      await expect(servizio.eliminaUtente(99)).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });
  });

  describe("getUtenti", () => {
    it("restituisce l'elenco completo", async () => {
      const utenti = [unUtente({ id: 1 }), unUtente({ id: 2 })];
      utenteDao.findAll.mockResolvedValue(utenti);
      await expect(servizio.getUtenti()).resolves.toBe(utenti);
    });
  });
});
