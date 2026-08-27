import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import styles from "../../src/css/Contenuto.module.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import QuizComponent from "@/components/Quiz";
import FeedbackTutorial from "@/components/Feedback";
import { api, urlMedia } from "@/api";
import { useAuth } from "@/context/AuthContext";
import { Quiz, Tutorial } from "@/types";

export default function PaginaTutorial() {
  const router = useRouter();
  const { isAdmin, aggiorna } = useAuth();
  const id = Number(router.query.id);

  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [errore, setErrore] = useState<string | null>(null);

  const carica = useCallback(async () => {
    if (!Number.isInteger(id) || id <= 0) {
      return;
    }
    try {
      const [dettaglio, quizAssociato] = await Promise.all([
        api.tutorial.dettaglio(id),
        api.quiz.perTutorial(id),
      ]);
      setTutorial(dettaglio);
      setQuiz(quizAssociato);
    } catch (e) {
      setErrore((e as Error).message);
    }
  }, [id]);

  useEffect(() => {
    void carica();
  }, [carica]);

  const eliminaTutorial = async () => {
    if (!window.confirm("Eliminare definitivamente questo tutorial?")) {
      return;
    }
    try {
      await api.tutorial.elimina(id);
      await router.push("/tutorial");
    } catch (e) {
      setErrore((e as Error).message);
    }
  };

  const eliminaQuiz = async () => {
    if (!quiz || !window.confirm("Eliminare il quiz di questo tutorial?")) {
      return;
    }
    try {
      await api.quiz.elimina(quiz.id);
      setQuiz(null);
    } catch (e) {
      setErrore((e as Error).message);
    }
  };

  if (errore) {
    return (
      <>
        <Header />
        <div className={styles.mainContainer}>
          <p className={styles.errore}>{errore}</p>
          <Link href="/tutorial" className={styles.homeButton}>
            Torna al catalogo
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  if (!tutorial) {
    return (
      <>
        <Header />
        <div className={styles.mainContainer}>
          <p>Caricamento del tutorial…</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className={styles.mainContainer}>
        <header className={styles.headerContainer}>
          <h1 className={styles.pageTitle}>{tutorial.titolo}</h1>
          {isAdmin && (
            <div className={styles.azioniAdmin}>
              <Link
                href={`/tutorial/${id}/modifica`}
                className={styles.createQuizButton}
              >
                Modifica tutorial
              </Link>
              <button
                type="button"
                onClick={eliminaTutorial}
                className={styles.deleteQuizButton}
              >
                Elimina tutorial
              </button>
            </div>
          )}
        </header>

        <main className={styles.contentContainer}>
          <Tabs>
            <TabList>
              <Tab>Tutorial</Tab>
              <Tab>Quiz</Tab>
              <Tab>Feedback</Tab>
            </TabList>

            <TabPanel>
              <article className="tutorial-container">
                <img
                  className="tutorial-copertina"
                  src={urlMedia(tutorial.grafica)}
                  alt=""
                />
                {/* Il contenuto è sanificato dal server prima di essere salvato. */}
                <div dangerouslySetInnerHTML={{ __html: tutorial.testo }} />
              </article>
            </TabPanel>

            <TabPanel>
              {isAdmin && (
                <div className={styles.quizActions}>
                  <Link
                    href={`/tutorial/${id}/quiz`}
                    className={styles.createQuizButton}
                  >
                    {quiz ? "Modifica quiz" : "Crea quiz"}
                  </Link>
                  {quiz && (
                    <button
                      type="button"
                      onClick={eliminaQuiz}
                      className={styles.deleteQuizButton}
                    >
                      Elimina quiz
                    </button>
                  )}
                </div>
              )}
              <QuizComponent tutorialId={id} onConsegnato={aggiorna} />
            </TabPanel>

            <TabPanel>
              <FeedbackTutorial tutorialId={id} />
            </TabPanel>
          </Tabs>
        </main>

        <div className={styles.homeButtonContainer}>
          <Link href="/tutorial" className={styles.homeButton}>
            Torna al catalogo
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
}
