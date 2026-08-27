import React from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "../src/css/index.module.css";

/** Pagina di ingresso, visibile anche senza autenticazione. */
export default function Landing() {
  return (
    <div className={styles.container}>
      <Header />
      <main>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>Tech4All</h1>
            <p className={styles.heroSubtitle}>
              Byte per Byte, verso il futuro.
            </p>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.videoContainer}>
            <iframe
              width="700"
              height="350"
              src="https://www.youtube.com/embed/4S9xd5MZJRY"
              title="Presentazione di Tech4All"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>

          <h2 className={styles.cardTitle}>Che cos&apos;è Tech4All</h2>
          <p className={styles.cardText}>
            Tech4All è una piattaforma dedicata all&apos;alfabetizzazione
            digitale: tutorial passo dopo passo, quiz di verifica e badge che
            certificano i traguardi raggiunti. I contenuti sono pensati per chi
            si avvicina per la prima volta agli strumenti digitali e vuole
            imparare a usarli in autonomia e in sicurezza.
          </p>

          <div className={styles.azioni}>
            <Link href="/registrazione" className={styles.cardButton}>
              Registrati
            </Link>
            <Link href="/tutorial" className={styles.cardButtonSecondario}>
              Sfoglia i tutorial
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
