import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "../src/css/AreaUtente.module.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Protetta from "@/components/Protetta";
import { api, urlMedia } from "@/api";
import { useAuth } from "@/context/AuthContext";
import { Badge, Feedback, Obiettivo } from "@/types";

type Sezione = "Anagrafica" | "Obiettivi" | "Feedback";

const SEZIONI: Sezione[] = ["Anagrafica", "Obiettivi", "Feedback"];

function Anagrafica() {
  const { utente, aggiorna } = useAuth();
  const router = useRouter();

  const [nome, setNome] = useState(utente?.nome ?? "");
  const [cognome, setCognome] = useState(utente?.cognome ?? "");
  const [email, setEmail] = useState(utente?.email ?? "");
  const [passwordAttuale, setPasswordAttuale] = useState("");
  const [nuovaPassword, setNuovaPassword] = useState("");
  const [messaggio, setMessaggio] = useState<string | null>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const [inInvio, setInInvio] = useState(false);

  const salva = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setErrore(null);
    setMessaggio(null);
    setInInvio(true);

    try {
      await api.account.aggiornaProfilo({
        nome,
        cognome,
        email,
        ...(nuovaPassword ? { passwordAttuale, nuovaPassword } : {}),
      });
      await aggiorna();
      setPasswordAttuale("");
      setNuovaPassword("");
      setMessaggio("Profilo aggiornato.");
    } catch (e) {
      setErrore((e as Error).message);
    } finally {
      setInInvio(false);
    }
  };

  const elimina = async () => {
    if (
      !window.confirm(
        "Eliminare definitivamente l'account? Feedback, quiz svolti e badge andranno persi.",
      )
    ) {
      return;
    }
    try {
      await api.account.eliminaProfilo();
      await aggiorna();
      await router.push("/");
    } catch (e) {
      setErrore((e as Error).message);
    }
  };

  return (
    <form className={styles.profileInfo} onSubmit={salva}>
      {messaggio && <p className={styles.successo}>{messaggio}</p>}
      {errore && (
        <p className={styles.errorMessage} role="alert">
          {errore}
        </p>
      )}

      <div className={styles.profileRow}>
        <label htmlFor="nome">Nome</label>
        <input
          id="nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
      </div>
      <div className={styles.profileRow}>
        <label htmlFor="cognome">Cognome</label>
        <input
          id="cognome"
          value={cognome}
          onChange={(e) => setCognome(e.target.value)}
        />
      </div>
      <div className={styles.profileRow}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className={styles.profileRow}>
        <span>Quiz superati</span>
        <span>{utente?.quizSuperati ?? 0}</span>
      </div>

      <fieldset className={styles.gruppoPassword}>
        <legend>Cambia password</legend>
        <div className={styles.profileRow}>
          <label htmlFor="passwordAttuale">Password attuale</label>
          <input
            id="passwordAttuale"
            type="password"
            autoComplete="current-password"
            value={passwordAttuale}
            onChange={(e) => setPasswordAttuale(e.target.value)}
          />
        </div>
        <div className={styles.profileRow}>
          <label htmlFor="nuovaPassword">Nuova password</label>
          <input
            id="nuovaPassword"
            type="password"
            autoComplete="new-password"
            value={nuovaPassword}
            onChange={(e) => setNuovaPassword(e.target.value)}
          />
        </div>
      </fieldset>

      <div className={styles.azioni}>
        <button type="submit" disabled={inInvio}>
          {inInvio ? "Salvataggio…" : "Salva modifiche"}
        </button>
        <button type="button" className={styles.pericolo} onClick={elimina}>
          Elimina account
        </button>
      </div>
    </form>
  );
}

function Obiettivi() {
  const { utente } = useAuth();
  const [badge, setBadge] = useState<Badge[]>([]);
  const [obiettivi, setObiettivi] = useState<Obiettivo[]>([]);

  useEffect(() => {
    void Promise.all([api.account.badge(), api.obiettivi.elenco()])
      .then(([conseguiti, catalogo]) => {
        setBadge(conseguiti);
        setObiettivi(catalogo);
      })
      .catch(() => undefined);
  }, []);

  const conseguiti = new Set(badge.map((b) => b.nome));
  const superati = utente?.quizSuperati ?? 0;

  return (
    <div className={styles.goalsContainer}>
      <h2>Obiettivi</h2>
      <p>
        Hai superato {superati} {superati === 1 ? "quiz" : "quiz"}. Completa i
        quiz dei tutorial per sbloccare i badge.
      </p>

      <ul className={styles.badgeContainer}>
        {obiettivi.map((obiettivo) => {
          const sbloccato = conseguiti.has(obiettivo.nome);
          return (
            <li
              key={obiettivo.nome}
              className={`${styles.badge} ${sbloccato ? "" : styles.bloccato}`}
            >
              <img src={urlMedia(obiettivo.graficaBadge)} alt="" />
              <div>
                <strong>{obiettivo.nome}</strong>
                <p>{obiettivo.descrizione}</p>
                <small>
                  {sbloccato
                    ? `Conseguito il ${new Date(
                        badge.find((b) => b.nome === obiettivo.nome)!
                          .dataConseguimento,
                      ).toLocaleDateString("it-IT")}`
                    : `Richiede ${obiettivo.quizDaSuperare} quiz superati`}
                </small>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FeedbackPropri() {
  const [feedback, setFeedback] = useState<Feedback[] | null>(null);

  const carica = useCallback(async () => {
    try {
      setFeedback(await api.feedback.propri());
    } catch {
      setFeedback([]);
    }
  }, []);

  useEffect(() => {
    void carica();
  }, [carica]);

  if (!feedback) {
    return <p>Caricamento…</p>;
  }

  return (
    <div className={styles.feedbackContainer}>
      <h2>I miei feedback</h2>
      {feedback.length === 0 ? (
        <p>Non hai ancora lasciato feedback.</p>
      ) : (
        <ul>
          {feedback.map((item) => (
            <li key={`${item.tutorialId}`}>
              <Link href={`/tutorial/${item.tutorialId}`}>
                Tutorial #{item.tutorialId}
              </Link>
              <p>
                <strong>{item.valutazione}/5</strong> — {item.commento}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AreaPersonale() {
  const [sezione, setSezione] = useState<Sezione>("Anagrafica");

  return (
    <Protetta>
      <Header />
      <div className={styles.mainContainer}>
        <div className={styles.tabContainer}>
          {SEZIONI.map((voce) => (
            <button
              key={voce}
              type="button"
              className={`${styles.tabButton} ${
                sezione === voce ? styles.active : ""
              }`}
              onClick={() => setSezione(voce)}
            >
              {voce}
            </button>
          ))}
        </div>

        <div className={styles.contentContainer}>
          <div className={styles.profileContainer}>
            {sezione === "Anagrafica" && <Anagrafica />}
            {sezione === "Obiettivi" && <Obiettivi />}
            {sezione === "Feedback" && <FeedbackPropri />}
          </div>

          <div className={styles.homeButtonContainer}>
            <Link href="/home" className={styles.homeButton}>
              Torna alla home
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </Protetta>
  );
}
