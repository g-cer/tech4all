import request from "supertest";
import { creaApp, serviziPredefiniti } from "../../app";

/*
 * I router accettano i servizi dal costruttore e ne costruiscono uno
 * predefinito quando non vengono iniettati. Questa suite esercita proprio
 * quel percorso: l'applicazione reale deve potersi comporre da sola.
 * Il pool MySQL è simulato globalmente, quindi non viene aperta alcuna
 * connessione.
 */
describe("Composizione dell'applicazione", () => {
  it("costruisce i servizi predefiniti", () => {
    const servizi = serviziPredefiniti();

    expect(servizi.autenticazione).toBeDefined();
    expect(servizi.account).toBeDefined();
    expect(servizi.tutorial).toBeDefined();
    expect(servizi.quiz).toBeDefined();
    expect(servizi.feedback).toBeDefined();
    expect(servizi.obiettivo).toBeDefined();
  });

  it("costruisce l'app senza dipendenze esplicite", async () => {
    const app = creaApp();

    await request(app).get("/salute").expect(200, { stato: "ok" });
  });

  it("monta tutte le rotte previste", async () => {
    const app = creaApp();

    // Le rotte protette rispondono 401: la risposta prova che sono montate,
    // e che il gestore delle rotte inesistenti non le ha intercettate.
    await request(app).get("/accounts/me").expect(401);
    await request(app).get("/auth/me").expect(401);
    await request(app).get("/tutorials/categorie").expect(200);
    await request(app).post("/quiz/1/svolgimenti").expect(401);
    await request(app).get("/feedback/me").expect(401);
    await request(app).post("/obiettivi").expect(401);
  });

  it("dichiara l'origine del client nelle intestazioni CORS", async () => {
    const res = await request(creaApp()).get("/salute");

    expect(res.headers["access-control-allow-origin"]).toBe(
      "http://localhost:3000",
    );
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });
});
