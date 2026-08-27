import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "../../../src/css/CreaTutorial.module.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Protetta from "@/components/Protetta";
import FormTutorial from "@/components/FormTutorial";
import { api } from "@/api";
import { Tutorial } from "@/types";

export default function ModificaTutorial() {
  const router = useRouter();
  const id = Number(router.query.id);

  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [errore, setErrore] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isInteger(id) || id <= 0) {
      return;
    }
    void api.tutorial
      .dettaglio(id)
      .then(setTutorial)
      .catch((e: Error) => setErrore(e.message));
  }, [id]);

  return (
    <Protetta soloAdmin>
      <Header />
      <div className={styles.mainContainer}>
        <header className={styles.headerContainer}>
          <h1 className={styles.pageTitle}>Modifica tutorial</h1>
        </header>
        <main className={styles.formContainer}>
          {errore && <p className={styles.error}>{errore}</p>}
          {!tutorial && !errore && <p>Caricamento…</p>}
          {tutorial && (
            <FormTutorial
              tutorial={tutorial}
              onSalvato={() => router.push(`/tutorial/${id}`)}
            />
          )}
        </main>
        <div className={styles.buttonContainer}>
          <Link href={`/tutorial/${id}`}>Torna al tutorial</Link>
        </div>
      </div>
      <Footer />
    </Protetta>
  );
}
