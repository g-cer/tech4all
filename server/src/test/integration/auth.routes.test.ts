import request from "supertest";
import { Express } from "express";
import {
  cookieSessione,
  creaAppDiTest,
  creaServiziMock,
  ServiziMock,
} from "../helper/app";
import { unUtente } from "../helper/dao";
import { Ruolo } from "../../app/entity/gestione_autenticazione/Ruolo";
import {
  ConflictError,
  UnauthorizedError,
  ValidationError,
} from "../../app/errors/AppError";
import { env } from "../../config/env";

describe("Rotte di autenticazione", () => {
  let servizi: ServiziMock;
  let app: Express;

  const credenziali = {
    email: "mario.rossi@example.com",
    password: "Password1@",
  };
  const registrazione = {
    email: "anna.bianchi@example.com",
    password: "Password1@",
    nome: "Anna",
    cognome: "Bianchi",
  };

  beforeEach(() => {
    servizi = creaServiziMock();
    app = creaAppDiTest(servizi);
  });

  describe("POST /auth/login", () => {
    it("apre la sessione con un cookie httpOnly", async () => {
      servizi.autenticazione.login.mockResolvedValue(unUtente());

      const res = await request(app)
        .post("/auth/login")
        .send(credenziali)
        .expect(200);

      const cookie = res.headers["set-cookie"][0];
      expect(cookie).toContain(env.jwt.cookieName);
      expect(cookie).toContain("HttpOnly");
      expect(cookie).toContain("SameSite=Lax");
    });

    it("non restituisce mai l'hash della password", async () => {
      servizi.autenticazione.login.mockResolvedValue(
        unUtente({ passwordHash: "$2b$10$segretissimo" }),
      );

      const res = await request(app)
        .post("/auth/login")
        .send(credenziali)
        .expect(200);

      expect(JSON.stringify(res.body)).not.toContain("segretissimo");
      expect(res.body).not.toHaveProperty("password");
      expect(res.body).not.toHaveProperty("passwordHash");
      expect(Object.keys(res.body).sort()).toEqual([
        "cognome",
        "email",
        "id",
        "nome",
        "quizSuperati",
        "ruolo",
      ]);
    });

    it("traduce le credenziali errate in 401", async () => {
      servizi.autenticazione.login.mockRejectedValue(
        new UnauthorizedError("Email o password non corretti."),
      );

      const res = await request(app)
        .post("/auth/login")
        .send(credenziali)
        .expect(401);

      expect(res.body).toEqual({
        message: "Email o password non corretti.",
        code: "UNAUTHORIZED",
      });
    });

    it("rifiuta una richiesta senza credenziali", async () => {
      await request(app).post("/auth/login").send({}).expect(400);
      expect(servizi.autenticazione.login).not.toHaveBeenCalled();
    });
  });

  describe("POST /auth/registrazione", () => {
    it("registra un nuovo utente", async () => {
      servizi.autenticazione.registra.mockResolvedValue(unUtente());

      await request(app)
        .post("/auth/registrazione")
        .send(registrazione)
        .expect(201);

      expect(servizi.autenticazione.registra).toHaveBeenCalledWith(
        expect.objectContaining({ nome: "Anna", cognome: "Bianchi" }),
      );
    });

    it("non apre una sessione automaticamente", async () => {
      servizi.autenticazione.registra.mockResolvedValue(unUtente());

      const res = await request(app)
        .post("/auth/registrazione")
        .send(registrazione)
        .expect(201);

      expect(res.headers["set-cookie"]).toBeUndefined();
    });

    it.each([
      ["email non valida", { email: "non-una-email" }],
      ["nome con cifre", { nome: "Anna1" }],
      ["cognome troppo corto", { cognome: "B" }],
      ["password assente", { password: "" }],
    ])("rifiuta la registrazione con %s", async (_etichetta, modifica) => {
      await request(app)
        .post("/auth/registrazione")
        .send({ ...registrazione, ...modifica })
        .expect(400);

      expect(servizi.autenticazione.registra).not.toHaveBeenCalled();
    });

    it("elenca i campi non validi nella risposta", async () => {
      const res = await request(app)
        .post("/auth/registrazione")
        .send({ ...registrazione, email: "non-una-email" })
        .expect(400);

      expect(res.body.code).toBe("VALIDATION_ERROR");
      expect(res.body.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ campo: "email" })]),
      );
    });

    it("traduce un'email già registrata in 409", async () => {
      servizi.autenticazione.registra.mockRejectedValue(
        new ConflictError("Email già in uso."),
      );

      await request(app)
        .post("/auth/registrazione")
        .send(registrazione)
        .expect(409);
    });

    it("traduce una password debole in 400", async () => {
      servizi.autenticazione.registra.mockRejectedValue(
        new ValidationError("Password troppo debole."),
      );

      await request(app)
        .post("/auth/registrazione")
        .send(registrazione)
        .expect(400);
    });
  });

  describe("POST /auth/logout", () => {
    it("invalida il cookie di sessione", async () => {
      const res = await request(app)
        .post("/auth/logout")
        .set("Cookie", cookieSessione())
        .expect(204);

      expect(res.headers["set-cookie"][0]).toContain(`${env.jwt.cookieName}=;`);
    });
  });

  describe("GET /auth/me", () => {
    it("restituisce il profilo dell'utente della sessione", async () => {
      servizi.account.getUtente.mockResolvedValue(
        unUtente({ id: 7, ruolo: Ruolo.ADMIN }),
      );

      const res = await request(app)
        .get("/auth/me")
        .set("Cookie", cookieSessione(Ruolo.ADMIN, 7))
        .expect(200);

      expect(servizi.account.getUtente).toHaveBeenCalledWith(7);
      expect(res.body.ruolo).toBe("admin");
    });

    it("richiede una sessione attiva", async () => {
      await request(app).get("/auth/me").expect(401);
    });
  });

  describe("GET /auth/email-disponibile", () => {
    it("segnala un'email già registrata", async () => {
      servizi.autenticazione.emailEsiste.mockResolvedValue(true);

      const res = await request(app)
        .get("/auth/email-disponibile?email=usata@example.com")
        .expect(200);

      expect(res.body).toEqual({ disponibile: false });
    });

    it("considera non disponibile una richiesta senza email", async () => {
      const res = await request(app).get("/auth/email-disponibile").expect(200);

      expect(res.body).toEqual({ disponibile: true });
      expect(servizi.autenticazione.emailEsiste).not.toHaveBeenCalled();
    });
  });

  describe("errori generici", () => {
    it("non espone i dettagli interni di un errore imprevisto", async () => {
      servizi.autenticazione.login.mockRejectedValue(
        new Error("connessione MySQL rifiutata su 10.0.0.5"),
      );

      const res = await request(app)
        .post("/auth/login")
        .send(credenziali)
        .expect(500);

      expect(JSON.stringify(res.body)).not.toContain("10.0.0.5");
      expect(res.body.code).toBe("INTERNAL_ERROR");
    });

    it("risponde 404 su una rotta inesistente", async () => {
      const res = await request(app).get("/rotta/inesistente").expect(404);
      expect(res.body.code).toBe("NOT_FOUND");
    });
  });
});
