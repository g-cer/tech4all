import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import styles from "../src/css/AreaUtente.module.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Protetta from "@/components/Protetta";
import { api, urlMedia } from "@/api";
import { useAuth } from "@/context/AuthContext";
import { Obiettivo, Utente } from "@/types";

type Sezione = "Utenti" | "Obiettivi";

const SEZIONI: Sezione[] = ["Utenti", "Obiettivi"];

function GestioneUtenti() {
  const { utente: amministratore } = useAuth();
  const [utenti, setUtenti] = useState<Utente[] | null>(null);
  const [errore, setErrore] = useState<string | null>(null);

  const carica = useCallback(async () => {
    setErrore(null);
    try {
      setUtenti(await api.account.utenti());
    } catch (e) {
      setErrore((e as Error).message);
      setUtenti([]);
    }
  }, []);

  useEffect(() => {
    void carica();
  }, [carica]);

  const elimina = async (id: number, nome: string) => {
    if (!window.confirm(`Eliminare definitivamente l'account di ${nome}?`)) {
      return;
    }
    try {
      await api.account.eliminaUtente(id);
      await carica();
    } catch (e) {
      setErrore((e as Error).message);
    }
  };

  if (!utenti) {
    return <p>Caricamento…</p>;
  }

  return (
    <div className={styles.usersContainer}>
      <h2>Utenti registrati</h2>
      {errore && <p className={styles.errorMessage}>{errore}</p>}

      <ul className={styles.userList}>
        {utenti.map((utente) => (
          <li key={utente.id} className={styles.userItem}>
            <div>
              <strong>
                {utente.nome} {utente.cognome}
              </strong>
              <p>{utente.email}</p>
              <p>
                {utente.ruolo === "admin" ? "Amministratore" : "Utente"} ·{" "}
                {utente.quizSuperati} quiz superati
              </p>
            </div>
            {utente.id !== amministratore?.id && (
              <button
                type="button"
                className={styles.pericolo}
                onClick={() => elimina(utente.id, utente.nome)}
              >
                Elimina
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function GestioneObiettivi() {
  const [obiettivi, setObiettivi] = useState<Obiettivo[] | null>(null);
  const [nome, setNome] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [graficaBadge, setGraficaBadge] = useState("uploads/seed/badge-1.png");
  const [quizDaSuperare, setQuizDaSuperare] = useState(1);
  const [errore, setErrore] = useState<string | null>(null);

  const carica = useCallback(async () => {
    try {
      setObiettivi(await api.obiettivi.elenco());
    } catch (e) {
      setErrore((e as Error).message);
      setObiettivi([]);
    }
  }, []);

  useEffect(() => {
    void carica();
  }, [carica]);

  const crea = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setErrore(null);
    try {
      await api.obiettivi.crea({
        nome,
        descrizione,
        graficaBadge,
        quizDaSuperare,
      });
      setNome("");
      setDescrizione("");
      await carica();
    } catch (e) {
      setErrore((e as Error).message);
    }
  };

  const elimina = async (nomeObiettivo: string) => {
    if (!window.confirm(`Eliminare l'obiettivo "${nomeObiettivo}"?`)) {
      return;
    }
    try {
      await api.obiettivi.elimina(nomeObiettivo);
      await carica();
    } catch (e) {
      setErrore((e as Error).message);
    }
  };

  return (
    <div className={styles.goalsContainer}>
      <h2>Obiettivi</h2>
      {errore && (
        <p className={styles.errorMessage} role="alert">
          {errore}
        </p>
      )}

      {obiettivi === null ? (
        <p>Caricamento…</p>
      ) : (
        <ul className={styles.badgeContainer}>
          {obiettivi.map((obiettivo) => (
            <li key={obiettivo.nome} className={styles.badge}>
              <img src={urlMedia(obiettivo.graficaBadge)} alt="" />
              <div>
                <strong>{obiettivo.nome}</strong>
                <p>{obiettivo.descrizione}</p>
                <small>{obiettivo.quizDaSuperare} quiz da superare</small>
              </div>
              <button
                type="button"
                className={styles.pericolo}
                onClick={() => elimina(obiettivo.nome)}
              >
                Elimina
              </button>
            </li>
          ))}
        </ul>
      )}

      <form className={styles.profileInfo} onSubmit={crea}>
        <h3>Nuovo obiettivo</h3>
        <div className={styles.profileRow}>
          <label htmlFor="nomeObiettivo">Nome</label>
          <input
            id="nomeObiettivo"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </div>
        <div className={styles.profileRow}>
          <label htmlFor="descrizione">Descrizione</label>
          <input
            id="descrizione"
            value={descrizione}
            onChange={(e) => setDescrizione(e.target.value)}
            required
          />
        </div>
        <div className={styles.profileRow}>
          <label htmlFor="badge">Percorso del badge</label>
          <input
            id="badge"
            value={graficaBadge}
            onChange={(e) => setGraficaBadge(e.target.value)}
            required
          />
        </div>
        <div className={styles.profileRow}>
          <label htmlFor="soglia">Quiz da superare</label>
          <input
            id="soglia"
            type="number"
            min={1}
            value={quizDaSuperare}
            onChange={(e) => setQuizDaSuperare(Number(e.target.value))}
            required
          />
        </div>
        <div className={styles.azioni}>
          <button type="submit">Crea obiettivo</button>
        </div>
      </form>
    </div>
  );
}

export default function AreaAmministratore() {
  const [sezione, setSezione] = useState<Sezione>("Utenti");

  return (
    <Protetta soloAdmin>
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
            {sezione === "Utenti" && <GestioneUtenti />}
            {sezione === "Obiettivi" && <GestioneObiettivi />}
          </div>

          <div className={styles.homeButtonContainer}>
            <Link href="/tutorial" className={styles.homeButton}>
              Vai al catalogo dei tutorial
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </Protetta>
  );
}
