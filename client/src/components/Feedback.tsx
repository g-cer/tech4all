import React, { useCallback, useEffect, useState } from "react";
import styles from "../css/Feedback.module.css";
import { api } from "@/api";
import { useAuth } from "@/context/AuthContext";
import { Feedback } from "@/types";

interface Props {
  tutorialId: number;
}

const VALUTAZIONI = [1, 2, 3, 4, 5];

/** Elenco dei feedback di un tutorial, con inserimento e modifica del proprio. */
const FeedbackTutorial: React.FC<Props> = ({ tutorialId }) => {
  const { utente, isAdmin } = useAuth();

  const [feedback, setFeedback] = useState<Feedback[] | null>(null);
  const [modaleAperta, setModaleAperta] = useState(false);
  const [valutazione, setValutazione] = useState(5);
  const [commento, setCommento] = useState("");
  const [errore, setErrore] = useState<string | null>(null);
  const [inInvio, setInInvio] = useState(false);

  const carica = useCallback(async () => {
    try {
      setFeedback(await api.feedback.perTutorial(tutorialId));
    } catch {
      setFeedback([]);
    }
  }, [tutorialId]);

  useEffect(() => {
    void carica();
  }, [carica]);

  const proprio = feedback?.find((f) => f.utenteId === utente?.id) ?? null;

  const apriModale = () => {
    setValutazione(proprio?.valutazione ?? 5);
    setCommento(proprio?.commento ?? "");
    setErrore(null);
    setModaleAperta(true);
  };

  const salva = async () => {
    setErrore(null);
    setInInvio(true);
    try {
      if (proprio) {
        await api.feedback.aggiorna(tutorialId, valutazione, commento);
      } else {
        await api.feedback.crea(tutorialId, valutazione, commento);
      }
      setModaleAperta(false);
      await carica();
    } catch (e) {
      setErrore((e as Error).message);
    } finally {
      setInInvio(false);
    }
  };

  const elimina = async (autoreId: number) => {
    setErrore(null);
    try {
      await api.feedback.elimina(
        tutorialId,
        autoreId === utente?.id ? undefined : autoreId,
      );
      await carica();
    } catch (e) {
      setErrore((e as Error).message);
    }
  };

  if (!feedback) {
    return <p>Caricamento dei feedback…</p>;
  }

  const bordo = (voto: number): string => {
    if (voto <= 2) return styles.borderRed;
    if (voto === 3) return styles.borderYellow;
    return styles.borderGreen;
  };

  return (
    <>
      {errore && <p className={styles.errore}>{errore}</p>}

      {feedback.length === 0 ? (
        <p>Nessun feedback per questo tutorial.</p>
      ) : (
        <div className={styles.feedbackContainer}>
          {feedback.map((item) => (
            <article
              key={`${item.utenteId}-${item.tutorialId}`}
              className={`${styles.feedbackItem} ${bordo(item.valutazione)}`}
            >
              <p>
                <strong>Valutazione:</strong> {item.valutazione}/5
              </p>
              <p>{item.commento}</p>
              {item.dataCreazione && (
                <p className={styles.data}>
                  {new Date(item.dataCreazione).toLocaleDateString("it-IT")}
                </p>
              )}
              {(utente?.id === item.utenteId || isAdmin) && (
                <button
                  type="button"
                  className={styles.deleteFeedbackBtn}
                  onClick={() => elimina(item.utenteId)}
                >
                  Elimina
                </button>
              )}
            </article>
          ))}
        </div>
      )}

      {utente ? (
        <button
          type="button"
          className={styles.createFeedbackBtn}
          onClick={apriModale}
        >
          {proprio ? "Modifica il tuo feedback" : "Lascia un feedback"}
        </button>
      ) : (
        <p>Accedi per lasciare un feedback.</p>
      )}

      {modaleAperta && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>{proprio ? "Modifica feedback" : "Nuovo feedback"}</h2>

            <label htmlFor="valutazione">Valutazione</label>
            <select
              id="valutazione"
              value={valutazione}
              onChange={(e) => setValutazione(Number(e.target.value))}
            >
              {VALUTAZIONI.map((voto) => (
                <option key={voto} value={voto}>
                  {voto} {voto === 1 ? "stella" : "stelle"}
                </option>
              ))}
            </select>

            <label htmlFor="commento">Commento</label>
            <textarea
              id="commento"
              value={commento}
              maxLength={500}
              rows={5}
              onChange={(e) => setCommento(e.target.value)}
            />
            <p className={styles.contatore}>{commento.length}/500</p>

            {errore && <p className={styles.errore}>{errore}</p>}

            <div className={styles.modalButtons}>
              <button type="button" onClick={salva} disabled={inInvio}>
                {inInvio ? "Salvataggio…" : "Conferma"}
              </button>
              <button type="button" onClick={() => setModaleAperta(false)}>
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FeedbackTutorial;
