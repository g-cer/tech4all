import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "../../src/css/CreaTutorial.module.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Protetta from "@/components/Protetta";
import FormTutorial from "@/components/FormTutorial";

export default function NuovoTutorial() {
  const router = useRouter();

  return (
    <Protetta soloAdmin>
      <Header />
      <div className={styles.mainContainer}>
        <header className={styles.headerContainer}>
          <h1 className={styles.pageTitle}>Nuovo tutorial</h1>
        </header>
        <main className={styles.formContainer}>
          <FormTutorial
            onSalvato={(tutorial) => router.push(`/tutorial/${tutorial.id}`)}
          />
        </main>
        <div className={styles.buttonContainer}>
          <Link href="/tutorial">Torna al catalogo</Link>
        </div>
      </div>
      <Footer />
    </Protetta>
  );
}
