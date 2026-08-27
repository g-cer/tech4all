import { ObiettivoService } from "../../app/services/ObiettivoService";
import { ObiettivoDao } from "../../app/dao/ObiettivoDao";
import { ConseguimentoDao } from "../../app/dao/ConseguimentoDao";
import { Conseguimento } from "../../app/entity/gestione_obiettivi/Conseguimento";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../../app/errors/AppError";
import {
  Mock,
  mockConseguimentoDao,
  mockObiettivoDao,
  unObiettivo,
} from "../helper/dao";

describe("ObiettivoService", () => {
  let obiettivoDao: Mock<ObiettivoDao>;
  let conseguimentoDao: Mock<ConseguimentoDao>;
  let servizio: ObiettivoService;

  const datiValidi = {
    nome: "Principiante",
    descrizione: "Hai superato il tuo primo quiz.",
    graficaBadge: "Media/badge-1.png",
    quizDaSuperare: 1,
  };

  const catalogo = [
    unObiettivo("Principiante", 1),
    unObiettivo("Intermedio", 3),
    unObiettivo("Esperto", 5),
  ];

  beforeEach(() => {
    obiettivoDao = mockObiettivoDao();
    conseguimentoDao = mockConseguimentoDao();
    servizio = new ObiettivoService(
      obiettivoDao as unknown as ObiettivoDao,
      conseguimentoDao as unknown as ConseguimentoDao,
    );
  });

  describe("valutaConseguimenti", () => {
    beforeEach(() => {
      obiettivoDao.findAll.mockResolvedValue(catalogo);
      conseguimentoDao.findByUtente.mockResolvedValue([]);
    });

    it("non assegna nulla sotto la prima soglia", async () => {
      await expect(servizio.valutaConseguimenti(1, 0)).resolves.toEqual([]);
      expect(conseguimentoDao.assegna).not.toHaveBeenCalled();
    });

    it("assegna gli obiettivi raggiunti", async () => {
      const sbloccati = await servizio.valutaConseguimenti(1, 3);

      expect(sbloccati.map((o) => o.getNome())).toEqual([
        "Principiante",
        "Intermedio",
      ]);
      expect(conseguimentoDao.assegna).toHaveBeenCalledTimes(2);
    });

    it("non riassegna gli obiettivi già conseguiti", async () => {
      conseguimentoDao.findByUtente.mockResolvedValue([
        new Conseguimento(1, "Principiante", new Date()),
      ]);

      const sbloccati = await servizio.valutaConseguimenti(1, 3);

      expect(sbloccati.map((o) => o.getNome())).toEqual(["Intermedio"]);
      expect(conseguimentoDao.assegna).toHaveBeenCalledTimes(1);
    });

    it("è idempotente se non ci sono nuovi traguardi", async () => {
      conseguimentoDao.findByUtente.mockResolvedValue([
        new Conseguimento(1, "Principiante", new Date()),
      ]);

      await expect(servizio.valutaConseguimenti(1, 1)).resolves.toEqual([]);
      expect(conseguimentoDao.assegna).not.toHaveBeenCalled();
    });

    it("propaga la connessione transazionale al DAO", async () => {
      const connessione = { query: jest.fn() };

      await servizio.valutaConseguimenti(1, 1, connessione as never);

      expect(conseguimentoDao.assegna).toHaveBeenCalledWith(
        expect.any(Conseguimento),
        connessione,
      );
    });
  });

  describe("getBadgeUtente", () => {
    it("abbina ogni conseguimento al suo obiettivo", async () => {
      obiettivoDao.findAll.mockResolvedValue(catalogo);
      conseguimentoDao.findByUtente.mockResolvedValue([
        new Conseguimento(1, "Principiante", new Date()),
      ]);

      const badge = await servizio.getBadgeUtente(1);

      expect(badge).toHaveLength(1);
      expect(badge[0].obiettivo.getNome()).toBe("Principiante");
    });

    it("ignora i conseguimenti il cui obiettivo non esiste più", async () => {
      obiettivoDao.findAll.mockResolvedValue(catalogo);
      conseguimentoDao.findByUtente.mockResolvedValue([
        new Conseguimento(1, "Obiettivo rimosso", new Date()),
      ]);

      await expect(servizio.getBadgeUtente(1)).resolves.toEqual([]);
    });
  });

  describe("creaObiettivo", () => {
    beforeEach(() => {
      obiettivoDao.findByNome.mockResolvedValue(null);
    });

    it("crea un obiettivo valido", async () => {
      const obiettivo = await servizio.creaObiettivo(datiValidi);
      expect(obiettivo.getNome()).toBe("Principiante");
      expect(obiettivoDao.create).toHaveBeenCalled();
    });

    it("rifiuta un nome già usato", async () => {
      obiettivoDao.findByNome.mockResolvedValue(unObiettivo());
      await expect(servizio.creaObiettivo(datiValidi)).rejects.toBeInstanceOf(
        ConflictError,
      );
    });

    it.each([
      ["nome troppo corto", { nome: "a" }],
      ["descrizione troppo corta", { descrizione: "a" }],
      ["soglia nulla", { quizDaSuperare: 0 }],
      ["soglia non intera", { quizDaSuperare: 1.5 }],
      ["badge assente", { graficaBadge: "  " }],
    ])("rifiuta un obiettivo con %s", async (_etichetta, modifica) => {
      await expect(
        servizio.creaObiettivo({ ...datiValidi, ...modifica }),
      ).rejects.toBeInstanceOf(ValidationError);
      expect(obiettivoDao.create).not.toHaveBeenCalled();
    });
  });

  describe("aggiornaObiettivo", () => {
    it("aggiorna un obiettivo esistente", async () => {
      obiettivoDao.findByNome.mockResolvedValue(unObiettivo());

      const obiettivo = await servizio.aggiornaObiettivo("Principiante", {
        descrizione: "Nuova descrizione dell'obiettivo.",
        graficaBadge: "Media/badge-2.jpg",
        quizDaSuperare: 2,
      });

      expect(obiettivo.getQuizDaSuperare()).toBe(2);
      expect(obiettivoDao.update).toHaveBeenCalledWith(obiettivo);
    });

    it("segnala un obiettivo inesistente", async () => {
      obiettivoDao.findByNome.mockResolvedValue(null);
      await expect(
        servizio.aggiornaObiettivo("Assente", {
          descrizione: "Descrizione valida.",
          graficaBadge: "Media/badge-1.png",
          quizDaSuperare: 1,
        }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("eliminaObiettivo", () => {
    it("elimina un obiettivo esistente", async () => {
      obiettivoDao.delete.mockResolvedValue(true);
      await expect(
        servizio.eliminaObiettivo("Principiante"),
      ).resolves.toBeUndefined();
    });

    it("segnala un obiettivo inesistente", async () => {
      obiettivoDao.delete.mockResolvedValue(false);
      await expect(servizio.eliminaObiettivo("Assente")).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });
  });

  describe("getObiettivi", () => {
    it("restituisce il catalogo", async () => {
      obiettivoDao.findAll.mockResolvedValue(catalogo);
      await expect(servizio.getObiettivi()).resolves.toBe(catalogo);
    });
  });
});
