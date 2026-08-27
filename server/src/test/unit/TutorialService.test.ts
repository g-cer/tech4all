import { TutorialService } from "../../app/services/TutorialService";
import { TutorialDao } from "../../app/dao/TutorialDao";
import { Categoria } from "../../app/entity/gestione_tutorial/Categoria";
import { NotFoundError, ValidationError } from "../../app/errors/AppError";
import { Mock, mockTutorialDao, unTutorial } from "../helper/dao";

describe("TutorialService", () => {
  let tutorialDao: Mock<TutorialDao>;
  let servizio: TutorialService;

  const datiValidi = {
    titolo: "Introduzione al computer",
    grafica: "uploads/copertine/r-123.webp",
    testo:
      "<p>Un contenuto sufficientemente lungo per superare la validazione.</p>",
    categoria: Categoria.TECNOLOGIA as string,
  };

  beforeEach(() => {
    tutorialDao = mockTutorialDao();
    servizio = new TutorialService(tutorialDao as unknown as TutorialDao);
  });

  describe("getTutorials", () => {
    it("restituisce l'intero catalogo senza filtro", async () => {
      tutorialDao.findAll.mockResolvedValue([unTutorial()]);
      await servizio.getTutorials();
      expect(tutorialDao.findAll).toHaveBeenCalled();
      expect(tutorialDao.findByCategoria).not.toHaveBeenCalled();
    });

    it("tratta la stringa vuota come assenza di filtro", async () => {
      tutorialDao.findAll.mockResolvedValue([]);
      await servizio.getTutorials("");
      expect(tutorialDao.findAll).toHaveBeenCalled();
    });

    it("filtra per categoria valida", async () => {
      tutorialDao.findByCategoria.mockResolvedValue([]);
      await servizio.getTutorials("Internet");
      expect(tutorialDao.findByCategoria).toHaveBeenCalledWith(
        Categoria.INTERNET,
      );
    });

    it("rifiuta una categoria inesistente", async () => {
      await expect(servizio.getTutorials("Inesistente")).rejects.toBeInstanceOf(
        ValidationError,
      );
    });
  });

  describe("getTutorial", () => {
    it("segnala un tutorial inesistente", async () => {
      tutorialDao.findById.mockResolvedValue(null);
      await expect(servizio.getTutorial(99)).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });
  });

  describe("cercaTutorial", () => {
    it("non interroga il database con una chiave vuota", async () => {
      await expect(servizio.cercaTutorial("   ")).resolves.toEqual([]);
      expect(tutorialDao.search).not.toHaveBeenCalled();
    });

    it("passa al database la chiave ripulita", async () => {
      tutorialDao.search.mockResolvedValue([]);
      await servizio.cercaTutorial("  email  ");
      expect(tutorialDao.search).toHaveBeenCalledWith("email");
    });
  });

  describe("creaTutorial", () => {
    beforeEach(() => {
      tutorialDao.create.mockImplementation(async (t) => t);
    });

    it("crea un tutorial valido", async () => {
      const tutorial = await servizio.creaTutorial(datiValidi);
      expect(tutorial.getTitolo()).toBe(datiValidi.titolo);
      expect(tutorialDao.create).toHaveBeenCalled();
    });

    it.each([
      ["titolo troppo corto", { titolo: "abc" }],
      ["titolo troppo lungo", { titolo: "a".repeat(101) }],
      ["testo troppo corto", { testo: "corto" }],
      ["categoria inesistente", { categoria: "Inesistente" }],
      ["immagine con estensione non ammessa", { grafica: "uploads/x.gif" }],
    ])("rifiuta un tutorial con %s", async (_etichetta, modifica) => {
      await expect(
        servizio.creaTutorial({ ...datiValidi, ...modifica }),
      ).rejects.toBeInstanceOf(ValidationError);
      expect(tutorialDao.create).not.toHaveBeenCalled();
    });

    it("rimuove gli script dal contenuto prima di salvarlo", async () => {
      const tutorial = await servizio.creaTutorial({
        ...datiValidi,
        testo:
          "<p>Contenuto legittimo del tutorial.</p><script>alert(1)</script>",
      });

      expect(tutorial.getTesto()).not.toContain("<script>");
      expect(tutorial.getTesto()).toContain("Contenuto legittimo");
    });

    it("rimuove gli attributi di evento dal contenuto", async () => {
      const tutorial = await servizio.creaTutorial({
        ...datiValidi,
        testo:
          '<p>Contenuto legittimo del tutorial.</p><img src="x" onerror="alert(1)">',
      });

      expect(tutorial.getTesto()).not.toContain("onerror");
    });
  });

  describe("aggiornaTutorial", () => {
    it("aggiorna un tutorial esistente", async () => {
      tutorialDao.findById.mockResolvedValue(unTutorial());

      const tutorial = await servizio.aggiornaTutorial(1, {
        ...datiValidi,
        titolo: "Titolo aggiornato",
        categoria: Categoria.SICUREZZA,
      });

      expect(tutorial.getTitolo()).toBe("Titolo aggiornato");
      expect(tutorial.getCategoria()).toBe(Categoria.SICUREZZA);
      expect(tutorialDao.update).toHaveBeenCalledWith(tutorial);
    });

    it("segnala un tutorial inesistente", async () => {
      tutorialDao.findById.mockResolvedValue(null);
      await expect(
        servizio.aggiornaTutorial(99, datiValidi),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("eliminaTutorial", () => {
    it("elimina un tutorial esistente", async () => {
      tutorialDao.delete.mockResolvedValue(true);
      await expect(servizio.eliminaTutorial(1)).resolves.toBeUndefined();
    });

    it("segnala un tutorial inesistente", async () => {
      tutorialDao.delete.mockResolvedValue(false);
      await expect(servizio.eliminaTutorial(99)).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });
  });
});
