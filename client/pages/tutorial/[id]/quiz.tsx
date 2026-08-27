import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "../../../src/css/CreaQuiz.module.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Protetta from "@/components/Protetta";
import { api } from "@/api";
import { DomandaInInvio, Quiz } from "@/types";

const RISPOSTE_PER_DOMANDA = 3;

function domandaVuota(): DomandaInInvio {
  return {
    testo: "",
    risposte: Array.from({ length: RISPOSTE_PER_DOMANDA }, (_, indice) => ({
      testo: "",
      corretta: indice === 0,
    })),
  };
}

/** Creazione o modifica del quiz associato a un tutorial. */
export default function GestioneQuiz() {
  const router = useRouter();
  const tutorialId = Number(router.query.id);

  const [quizEsistente, setQuizEsistente] = useState<Quiz | null>(null);
  const [domande, setDomande] = useState<DomandaInInvio[]>([domandaVuota()]);
  const [inCaricamento, setInCaricamento] = useState(true);
  const [errore, setErrore] = useState<string | null>(null);
  const [inInvio, setInInvio] = useState(false);

  useEffect(() => {
    if (!Number.isInteger(tutorialId) || tutorialId <= 0) {
      return;
    }
    let annullato = false;

    void api.quiz.perTutorial(tutorialId).then((quiz) => {
      if (annullato) {
        return;
      }
      setQuizEsistente(quiz);
      if (quiz) {
        // Le soluzioni non sono esposte in lettura: in modifica le opzioni
        // vengono ricaricate e l'amministratore reindica quella corretta.
        setDomande(
          quiz.domande.map((domanda) => ({
            testo: domanda.testo,
            risposte: domanda.risposte.map((risposta, indice) => ({
              testo: risposta.testo,
              corretta: indice === 0,
            })),
          })),
        );
      }
      setInCaricamento(false);
    });

    return () => {
      annullato = true;
    };
  }, [tutorialId]);

  const aggiornaDomanda = (
    indice: number,
    modifica: (domanda: DomandaInInvio) => DomandaInInvio,
  ) => {
    setDomande((precedenti) =>
      precedenti.map((domanda, i) =>
        i === indice ? modifica(domanda) : domanda,
      ),
    );
  };

  const salva = async () => {
    setErrore(null);
    setInInvio(true);
    try {
      if (quizEsistente) {
        await api.quiz.aggiorna(quizEsistente.id, domande);
      } else {
        await api.quiz.crea(tutorialId, domande);
      }
      await router.push(`/tutorial/${tutorialId}`);
    } catch (e) {
      setErrore((e as Error).message);
    } finally {
      setInInvio(false);
    }
  };

  return (
    <Protetta soloAdmin>
      <Header />
      <div className={styles.creaQuizContainer}>
        <h1 className={styles.creaQuizTitolo}>
          {quizEsistente ? "Modifica quiz" : "Nuovo quiz"}
        </h1>

        {inCaricamento ? (
          <p>Caricamento…</p>
        ) : (
          <>
            {quizEsistente && (
              <p className={styles.avviso}>
                Salvando, le domande esistenti verranno sostituite da quelle
                indicate qui sotto.
              </p>
            )}

            {domande.map((domanda, indice) => (
              <fieldset key={indice} className={styles.domandaContainer}>
                <legend>Domanda {indice + 1}</legend>
                <input
                  type="text"
                  placeholder="Testo della domanda"
                  className={styles.domandaInput}
                  value={domanda.testo}
                  onChange={(e) =>
                    aggiornaDomanda(indice, (d) => ({
                      ...d,
                      testo: e.target.value,
                    }))
                  }
                />

                {domanda.risposte.map((risposta, i) => (
                  <div key={i} className={styles.rispostaContainer}>
                    <input
                      type="text"
                      placeholder={`Risposta ${i + 1}`}
                      className={styles.rispostaInput}
                      value={risposta.testo}
                      onChange={(e) =>
                        aggiornaDomanda(indice, (d) => ({
                          ...d,
                          risposte: d.risposte.map((r, j) =>
                            j === i ? { ...r, testo: e.target.value } : r,
                          ),
                        }))
                      }
                    />
                    <button
                      type="button"
                      className={`${styles.correttaButton} ${
                        risposta.corretta ? styles.selezionata : ""
                      }`}
                      onClick={() =>
                        aggiornaDomanda(indice, (d) => ({
                          ...d,
                          risposte: d.risposte.map((r, j) => ({
                            ...r,
                            corretta: j === i,
                          })),
                        }))
                      }
                    >
                      {risposta.corretta ? "Corretta" : "Segna come corretta"}
                    </button>
                  </div>
                ))}
              </fieldset>
            ))}

            {errore && (
              <p className={styles.errore} role="alert">
                {errore}
              </p>
            )}

            <div className={styles.buttonContainer}>
              <button
                type="button"
                className={styles.aggiungiButton}
                onClick={() => setDomande((d) => [...d, domandaVuota()])}
              >
                Aggiungi domanda
              </button>
              <button
                type="button"
                className={styles.rimuoviButton}
                disabled={domande.length === 1}
                onClick={() => setDomande((d) => d.slice(0, -1))}
              >
                Rimuovi ultima domanda
              </button>
              <button
                type="button"
                className={styles.salvaButton}
                onClick={salva}
                disabled={inInvio}
              >
                {inInvio ? "Salvataggio…" : "Salva quiz"}
              </button>
            </div>
          </>
        )}

        <Link href={`/tutorial/${tutorialId}`}>Torna al tutorial</Link>
      </div>
      <Footer />
    </Protetta>
  );
}
