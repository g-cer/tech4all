import React from "react";
import Link from "next/link";
import styles from "../src/css/Chisiamo.module.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Membro {
  src: string;
  nome: string;
  ruolo: string;
}

const PROJECT_MANAGER: Membro[] = [
  {
    src: "/Media/fb.jpeg",
    nome: "Ferdinando Boccia",
    ruolo: "Project Manager",
  },
  {
    src: "/Media/dd.jpeg",
    nome: "Domenico D'Antuono",
    ruolo: "Project Manager",
  },
];

const TEAM: Membro[] = [
  { src: "/Media/gc.jpeg", nome: "Giovanni Cerchia", ruolo: "Team Member" },
  { src: "/Media/ln.jpeg", nome: "Luigi Nasta", ruolo: "Team Member" },
  { src: "/Media/sd.jpeg", nome: "Silvana De Martino", ruolo: "Team Member" },
  { src: "/Media/gsa.jpeg", nome: "Giovanni Salsano", ruolo: "Team Member" },
  { src: "/Media/ac.jpeg", nome: "Arcangelo Ciaramella", ruolo: "Team Member" },
  { src: "/Media/ge.jpeg", nome: "Giovanni Esposito", ruolo: "Team Member" },
  { src: "/Media/mc.jpeg", nome: "Marco Capuano", ruolo: "Team Member" },
  { src: "/Media/gst.jpeg", nome: "Giuseppe Staiano", ruolo: "Team Member" },
];

const Scheda: React.FC<{ membro: Membro; classe: string }> = ({
  membro,
  classe,
}) => (
  <figure className={styles.imageCard}>
    <img src={membro.src} alt={membro.nome} className={classe} />
    <figcaption className={styles.imageDescription}>
      <strong>{membro.nome}</strong>
      <br />
      {membro.ruolo}
    </figcaption>
  </figure>
);

export default function ChiSiamo() {
  return (
    <>
      <Header />
      <div className={styles.chiSiamoContainer}>
        <section className={styles.heroSection}>
          <h1 className={styles.heroTitle}>Chi siamo</h1>
          <p className={styles.heroSubtitle}>
            Tech4All nasce come progetto del corso di{" "}
            <span className={styles.highlight}>Ingegneria del Software</span>{" "}
            dell&apos;Università degli Studi di Salerno, con l&apos;obiettivo di
            rendere le competenze digitali accessibili a tutti.
          </p>
        </section>

        <h2 className={styles.sectionTitle}>Project Manager</h2>
        <div className={styles.imageRow}>
          {PROJECT_MANAGER.map((membro) => (
            <Scheda
              key={membro.nome}
              membro={membro}
              classe={styles.mainImage}
            />
          ))}
        </div>

        <h2 className={styles.sectionTitle}>Team</h2>
        <div className={styles.imageGrid}>
          {TEAM.map((membro) => (
            <Scheda
              key={membro.nome}
              membro={membro}
              classe={styles.gridImage}
            />
          ))}
        </div>

        <Link href="/home" className={styles.homeButton}>
          Torna alla home
        </Link>
      </div>
      <Footer />
    </>
  );
}
