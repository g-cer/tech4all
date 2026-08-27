import React from "react";
import Link from "next/link";
import styles from "../src/css/Homepage.module.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Chatbot from "@/components/Chatbot";
import Protetta from "@/components/Protetta";

const SEZIONI = [
  {
    href: "/tutorial",
    src: "/Media/f1.webp",
    titolo: "Tutorial",
    descrizione: "Guide passo dopo passo, con quiz di verifica e badge.",
  },
  {
    href: "/chi-siamo",
    src: "/Media/ciao.jpg",
    titolo: "Chi siamo",
    descrizione: "Il gruppo che ha progettato e realizzato Tech4All.",
  },
];

export default function Home() {
  return (
    <Protetta>
      <Header />
      <div className={styles.homepageContainer}>
        <main className={styles.centeredImages}>
          {SEZIONI.map((sezione) => (
            <Link
              href={sezione.href}
              key={sezione.href}
              className={styles.largeImageCard}
            >
              <img src={sezione.src} alt="" className={styles.largeImage} />
              <p>{sezione.titolo}</p>
              <span className={styles.descrizione}>{sezione.descrizione}</span>
            </Link>
          ))}
        </main>
      </div>
      <Chatbot />
      <Footer />
    </Protetta>
  );
}
