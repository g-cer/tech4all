import request from "supertest";
import { Express } from "express";
import { RequestHandler } from "express";

/*
 * Multer e sharp sono sostituiti da doppi: qui interessa il comportamento
 * delle rotte (autorizzazione, obbligatorietà della copertina, riuso della
 * copertina esistente in aggiornamento), non l'elaborazione delle immagini,
 * verificata separatamente in `unit/upload.test.ts`.
 */
let fileSimulato: Express.Multer.File | undefined;

jest.mock("../../app/middleware/upload", () => ({
  uploadCopertina: ((req, _res, next) => {
    req.file = fileSimulato;
    next();
  }) as RequestHandler,
  uploadContenuto: ((req, _res, next) => {
    req.file = fileSimulato;
    next();
  }) as RequestHandler,
  normalizzaCopertina: jest
    .fn()
    .mockResolvedValue("uploads/copertine/r-nuova.webp"),
  percorsoContenuto: jest.fn().mockReturnValue("uploads/quill/immagine.png"),
  eliminaImmagineContenuto: jest.fn().mockResolvedValue(true),
}));

import {
  cookieSessione,
  creaAppDiTest,
  creaServiziMock,
  ServiziMock,
} from "../helper/app";
import { unTutorial } from "../helper/dao";
import { Ruolo } from "../../app/entity/gestione_autenticazione/Ruolo";
import { eliminaImmagineContenuto } from "../../app/middleware/upload";

const copertina = {
  filename: "123-abcd.webp",
  path: "uploads/copertine/123-abcd.webp",
  originalname: "copertina.webp",
} as Express.Multer.File;

describe("Rotte di gestione dei tutorial", () => {
  let servizi: ServiziMock;
  let app: Express;

  beforeEach(() => {
    fileSimulato = undefined;
    servizi = creaServiziMock();
    app = creaAppDiTest(servizi);
    servizi.tutorial.creaTutorial.mockResolvedValue(unTutorial());
    servizi.tutorial.aggiornaTutorial.mockResolvedValue(unTutorial());
    servizi.tutorial.getTutorial.mockResolvedValue(unTutorial());
    servizi.tutorial.eliminaTutorial.mockResolvedValue(undefined);
  });

  describe("POST /tutorials", () => {
    it("crea il tutorial normalizzando la copertina caricata", async () => {
      fileSimulato = copertina;

      await request(app)
        .post("/tutorials")
        .set("Cookie", cookieSessione(Ruolo.ADMIN))
        .send({
          titolo: "Titolo di prova valido",
          categoria: "Internet",
          testo: "x".repeat(50),
        })
        .expect(201);

      expect(servizi.tutorial.creaTutorial).toHaveBeenCalledWith(
        expect.objectContaining({ grafica: "uploads/copertine/r-nuova.webp" }),
      );
    });

    it("rifiuta la creazione senza copertina", async () => {
      await request(app)
        .post("/tutorials")
        .set("Cookie", cookieSessione(Ruolo.ADMIN))
        .send({ titolo: "Titolo di prova valido", categoria: "Internet" })
        .expect(400);

      expect(servizi.tutorial.creaTutorial).not.toHaveBeenCalled();
    });
  });

  describe("PUT /tutorials/:id", () => {
    it("sostituisce la copertina quando ne viene caricata una nuova", async () => {
      fileSimulato = copertina;

      await request(app)
        .put("/tutorials/1")
        .set("Cookie", cookieSessione(Ruolo.ADMIN))
        .send({
          titolo: "Titolo aggiornato valido",
          categoria: "Sicurezza",
          testo: "y".repeat(50),
        })
        .expect(200);

      expect(servizi.tutorial.aggiornaTutorial).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ grafica: "uploads/copertine/r-nuova.webp" }),
      );
    });

    it("conserva la copertina esistente se non ne viene caricata una", async () => {
      await request(app)
        .put("/tutorials/1")
        .set("Cookie", cookieSessione(Ruolo.ADMIN))
        .send({
          titolo: "Titolo aggiornato valido",
          categoria: "Sicurezza",
          testo: "y".repeat(50),
        })
        .expect(200);

      expect(servizi.tutorial.aggiornaTutorial).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ grafica: "uploads/seed/computer.webp" }),
      );
    });

    it("rifiuta un identificativo non numerico", async () => {
      await request(app)
        .put("/tutorials/abc")
        .set("Cookie", cookieSessione(Ruolo.ADMIN))
        .send({ titolo: "x", categoria: "Internet", testo: "y" })
        .expect(400);
    });
  });

  describe("POST /tutorials/immagini", () => {
    it("restituisce il percorso dell'immagine caricata", async () => {
      fileSimulato = copertina;

      const res = await request(app)
        .post("/tutorials/immagini")
        .set("Cookie", cookieSessione(Ruolo.ADMIN))
        .expect(201);

      expect(res.body).toEqual({ percorso: "uploads/quill/immagine.png" });
    });

    it("rifiuta una richiesta senza file", async () => {
      await request(app)
        .post("/tutorials/immagini")
        .set("Cookie", cookieSessione(Ruolo.ADMIN))
        .expect(400);
    });
  });

  describe("DELETE /tutorials/immagini/:nomeFile", () => {
    it("delega l'eliminazione al gestore dei file", async () => {
      await request(app)
        .delete("/tutorials/immagini/immagine.png")
        .set("Cookie", cookieSessione(Ruolo.ADMIN))
        .expect(204);

      expect(eliminaImmagineContenuto).toHaveBeenCalledWith("immagine.png");
    });
  });

  describe("DELETE /tutorials/:id", () => {
    it("elimina il tutorial indicato", async () => {
      await request(app)
        .delete("/tutorials/7")
        .set("Cookie", cookieSessione(Ruolo.ADMIN))
        .expect(204);

      expect(servizi.tutorial.eliminaTutorial).toHaveBeenCalledWith(7);
    });
  });
});
