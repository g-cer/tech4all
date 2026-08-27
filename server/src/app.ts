import express, { Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { creaAuthRouter } from "./app/routes/auth";
import { creaAccountsRouter } from "./app/routes/accounts";
import { creaTutorialsRouter } from "./app/routes/tutorials";
import { creaQuizRouter } from "./app/routes/quiz";
import { creaFeedbackRouter } from "./app/routes/feedback";
import { creaObiettiviRouter } from "./app/routes/obiettivi";
import { errorHandler, notFoundHandler } from "./app/middleware/errorHandler";
import { AutenticazioneService } from "./app/services/AutenticazioneService";
import { AccountService } from "./app/services/AccountService";
import { TutorialService } from "./app/services/TutorialService";
import { QuizService } from "./app/services/QuizService";
import { FeedbackService } from "./app/services/FeedbackService";
import { ObiettivoService } from "./app/services/ObiettivoService";

/**
 * Servizi applicativi usati dai router.
 *
 * In esecuzione normale sono costruiti con le implementazioni predefinite;
 * i test di integrazione ne iniettano versioni con DAO simulati.
 */
export interface Servizi {
  autenticazione: AutenticazioneService;
  account: AccountService;
  tutorial: TutorialService;
  quiz: QuizService;
  feedback: FeedbackService;
  obiettivo: ObiettivoService;
}

/** Servizi predefiniti, collegati ai DAO reali. */
export function serviziPredefiniti(): Servizi {
  return {
    autenticazione: new AutenticazioneService(),
    account: new AccountService(),
    tutorial: new TutorialService(),
    quiz: new QuizService(),
    feedback: new FeedbackService(),
    obiettivo: new ObiettivoService(),
  };
}

/**
 * Costruisce l'applicazione Express senza metterla in ascolto.
 *
 * Separare la costruzione dall'avvio permette ai test di integrazione di
 * usare l'app direttamente con `supertest`, senza occupare una porta.
 *
 * @param servizi Servizi da collegare ai router.
 */
export function creaApp(servizi: Servizi = serviziPredefiniti()): Express {
  const app = express();

  // Il cookie di sessione viaggia cross-origin fra Next.js e l'API:
  // serve un'origine esplicita, perché `credentials` esclude il wildcard.
  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true,
    }),
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use("/uploads", express.static(env.uploadsDir));

  app.get("/salute", (_req, res) => {
    res.status(200).json({ stato: "ok" });
  });

  app.use("/auth", creaAuthRouter(servizi.autenticazione, servizi.account));
  app.use("/accounts", creaAccountsRouter(servizi.account, servizi.obiettivo));
  app.use("/tutorials", creaTutorialsRouter(servizi.tutorial));
  app.use("/quiz", creaQuizRouter(servizi.quiz));
  app.use("/feedback", creaFeedbackRouter(servizi.feedback));
  app.use("/obiettivi", creaObiettiviRouter(servizi.obiettivo));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
