import React, { useEffect, useState } from "react";
import Link from "next/link";
import styles from "../../src/css/ListaTutorial.module.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { api, urlMedia } from "@/api";
import { useAuth } from "@/context/AuthContext";
import { Categoria, Tutorial } from "@/types";

/** Catalogo dei tutorial, con filtro per categoria applicato dal server. */
export default function CatalogoTutorial() {
  const { isAdmin } = useAuth();

  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [categorie, setCategorie] = useState<Categoria[]>([]);
  const [categoria, setCategoria] = useState<Categoria | "">("");
  const [errore, setErrore] = useState<string | null>(null);
  const [inCaricamento, setInCaricamento] = useState(true);

  useEffect(() => {
    void api.tutorial
      .categorie()
      .then(setCategorie)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    let annullato = false;
    setInCaricamento(true);
    setErrore(null);

    void api.tutorial
      .elenco(categoria)
      .then((elenco) => {
        if (!annullato) {
          setTutorials(elenco);
        }
      })
      .catch((e: Error) => {
        if (!annullato) {
          setErrore(e.message);
        }
      })
      .finally(() => {
        if (!annullato) {
          setInCaricamento(false);
        }
      });

    return () => {
      annullato = true;
    };
  }, [categoria]);

  return (
    <>
      <Header />
      <div className={styles.mainContainer}>
        <header className={styles.headerContainer}>
          <h1 className={styles.pageTitle}>Catalogo dei tutorial</h1>
          {isAdmin && (
            <Link href="/tutorial/nuovo" className={styles.createButton}>
              Crea nuovo tutorial
            </Link>
          )}
        </header>

        <div className={styles.filterContainer}>
          <label className={styles.filterLabel} htmlFor="categoria">
            Filtra per categoria
          </label>
          <select
            id="categoria"
            className={styles.filterSelect}
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as Categoria | "")}
          >
            <option value="">Tutte</option>
            {categorie.map((valore) => (
              <option key={valore} value={valore}>
                {valore}
              </option>
            ))}
          </select>
        </div>

        <main className={styles.contentContainer}>
          {errore && <p className={styles.errore}>{errore}</p>}
          {inCaricamento ? (
            <p>Caricamento del catalogo…</p>
          ) : tutorials.length === 0 ? (
            <p>Nessun tutorial disponibile per questa categoria.</p>
          ) : (
            <ul className={styles.tutorialList}>
              {tutorials.map((tutorial) => (
                <li className={styles.tutorialItem} key={tutorial.id}>
                  <Link href={`/tutorial/${tutorial.id}`}>
                    <h2 className={styles.tutorialTitle}>{tutorial.titolo}</h2>
                    <div className={styles.thumbnailContainer}>
                      <img
                        className={styles.tutorialThumbnail}
                        src={urlMedia(tutorial.grafica)}
                        alt=""
                      />
                    </div>
                    <p className={styles.meta}>
                      {tutorial.categoria}
                      {tutorial.valutazione !== null &&
                        ` · ${tutorial.valutazione.toFixed(1)}/5`}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </main>

        <div className={styles.homeButtonContainer}>
          <Link href="/home" className={styles.homeButton}>
            Torna alla home
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
}
