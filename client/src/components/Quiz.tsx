import React, { useEffect, useMemo, useState } from "react";
import styles from "../css/Quiz.module.css";
import { api, urlMedia } from "@/api";
import { useAuth } from "@/context/AuthContext";
import { EsitoQuiz, Quiz, RispostaFornita } from "@/types";

interface Props {
  tutorialId: number;
  /** Invocata dopo una consegna, per aggiornare i dati del profilo. */
  onConsegnato?: () => void;
}

/**
 * Svolgimento di un quiz.
 *
 * Il componente non conosce le risposte corrette: le riceve dal server solo
 * dopo la consegna, insieme all'esito. Non è quindi possibile ricavarle
 * ispezionando la pagina prima di rispondere.
 */
const QuizComponent: React.FC<Props> = ({ tutorialId, onConsegnato }) => {
  const { utente } = useAuth();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [inCaricamento, setInCaricamento] = useState(true);
  const [scelte, setScelte] = useState<Record<number, number>>({});
  const [esito, setEsito] = useState<EsitoQuiz | null>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const [inInvio, setInInvio] = useState(false);

  useEffect(() => {
    let annullato = false;
    setInCaricamento(true);

    void api.quiz.perTutorial(tutorialId).then((risultato) => {
      if (!annullato) {
        setQuiz(risultato);
        setScelte({});
        setEsito(null);
        setInCaricamento(false);
      }
    });

    return () => {
      annullato = true;
    };
  }, [tutorialId]);

  const soluzioni = useMemo(() => {
    const mappa = new Map<number, number>();
    for (const soluzione of esito?.soluzioni ?? []) {
      mappa.set(soluzione.domandaId, soluzione.rispostaCorrettaId);
    }
    return mappa;
  }, [esito]);

  if (inCaricamento) {
    return <p>Caricamento del quiz…</p>;
  }

  if (!quiz) {
    return <p className={styles.quizDescrizione}>Nessun quiz disponibile.</p>;
  }

  const tutteRisposte = quiz.domande.every((domanda) => scelte[domanda.id]);
  const minimoCorrette = Math.ceil(quiz.domande.length * 0.7);

  const consegna = async () => {
    setErrore(null);
    setInInvio(true);
    try {
      const risposte: RispostaFornita[] = quiz.domande.map((domanda) => ({
        domandaId: domanda.id,
        rispostaId: scelte[domanda.id],
      }));
      setEsito(await api.quiz.consegna(quiz.id, risposte));
      onConsegnato?.();
    } catch (e) {
      setErrore((e as Error).message);
    } finally {
      setInInvio(false);
    }
  };

  const classeRisposta = (domandaId: number, rispostaId: number): string => {
    const selezionata = scelte[domandaId] === rispostaId;
    if (!esito) {
      return selezionata ? styles.selezionata : styles.nonSelezionata;
    }
    if (soluzioni.get(domandaId) === rispostaId) {
      return styles.correttaSelezionata;
    }
    return selezionata ? styles.errataSelezionata : styles.nonSelezionata;
  };

  return (
    <div className={styles.quizContainer}>
      <h2>Quiz</h2>
      <p className={styles.quizDescrizione}>
        Per superare il quiz devi rispondere correttamente ad almeno{" "}
        {minimoCorrette} {minimoCorrette === 1 ? "domanda" : "domande"} su{" "}
        {quiz.domande.length}.
      </p>

      {quiz.domande.map((domanda) => (
        <div key={domanda.id} className={styles.domandaContainer}>
          <p className={styles.domandaTesto}>{domanda.testo}</p>
          <div className={styles.risposteContainer}>
            {domanda.risposte.map((risposta) => (
              <button
                key={risposta.id}
                type="button"
                disabled={esito !== null || !utente}
                className={`${styles.rispostaButton} ${classeRisposta(
                  domanda.id,
                  risposta.id,
                )}`}
                onClick={() =>
                  setScelte((precedenti) => ({
                    ...precedenti,
                    [domanda.id]: risposta.id,
                  }))
                }
              >
                {risposta.testo}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className={styles.buttonContainer}>
        {!utente ? (
          <p className={styles.errorMessage}>
            Accedi per svolgere il quiz e ottenere i badge.
          </p>
        ) : (
          <>
            <button
              type="button"
              className={styles.submitButton}
              onClick={consegna}
              disabled={esito !== null || !tutteRisposte || inInvio}
            >
              {inInvio ? "Invio in corso…" : "Conferma"}
            </button>
            {!tutteRisposte && esito === null && (
              <p className={styles.errorMessage}>
                Rispondi a tutte le domande prima di confermare.
              </p>
            )}
          </>
        )}
        {errore && <p className={styles.errorMessage}>{errore}</p>}
      </div>

      {esito && (
        <div className={styles.risultatoTesto}>
          <p>
            Quiz {esito.esito ? "superato" : "non superato"}:{" "}
            {esito.risposteEsatte}{" "}
            {esito.risposteEsatte === 1
              ? "risposta corretta"
              : "risposte corrette"}{" "}
            su {esito.totaleDomande}.
          </p>
          {esito.obiettiviSbloccati.length > 0 && (
            <div className={styles.badgeSbloccati}>
              <p>Hai sbloccato un nuovo traguardo:</p>
              <ul>
                {esito.obiettiviSbloccati.map((obiettivo) => (
                  <li key={obiettivo.nome}>
                    <img
                      src={urlMedia(obiettivo.graficaBadge)}
                      alt=""
                      width={40}
                      height={40}
                    />
                    <span>{obiettivo.nome}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizComponent;
