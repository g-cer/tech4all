import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "../src/css/Register.module.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { api } from "@/api";
import { useAuth } from "@/context/AuthContext";

export default function Registrazione() {
  const router = useRouter();
  const { login } = useAuth();

  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [conferma, setConferma] = useState("");
  const [errore, setErrore] = useState<string | null>(null);
  const [inInvio, setInInvio] = useState(false);

  const invia = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setErrore(null);

    // Unico controllo eseguito qui: riguarda due campi del modulo e non
    // esiste lato server, dove arriva una sola password.
    if (password !== conferma) {
      setErrore("Le due password non coincidono.");
      return;
    }

    setInInvio(true);
    try {
      await api.autenticazione.registra({
        nome: nome.trim(),
        cognome: cognome.trim(),
        email: email.trim(),
        password,
      });
      await login(email.trim(), password);
      await router.push("/home");
    } catch (e) {
      setErrore((e as Error).message);
    } finally {
      setInInvio(false);
    }
  };

  return (
    <>
      <Header />
      <div className={styles.mainContainer}>
        <div className={styles.container}>
          <form onSubmit={invia} className={styles.form} noValidate>
            <h1>Registrazione</h1>
            {errore && (
              <p className={styles.error} role="alert">
                {errore}
              </p>
            )}

            <div className={styles.inputGroup}>
              <label htmlFor="nome">Nome</label>
              <input
                id="nome"
                className={styles.input}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                autoComplete="given-name"
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="cognome">Cognome</label>
              <input
                id="cognome"
                className={styles.input}
                value={cognome}
                onChange={(e) => setCognome(e.target.value)}
                autoComplete="family-name"
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <small>
                Almeno 8 caratteri, con una maiuscola, un numero e un carattere
                speciale.
              </small>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="conferma">Conferma password</label>
              <input
                id="conferma"
                type="password"
                className={styles.input}
                value={conferma}
                onChange={(e) => setConferma(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            <button type="submit" className={styles.button} disabled={inInvio}>
              {inInvio ? "Registrazione in corso…" : "Registrati"}
            </button>

            <h6 className={styles.link}>
              Hai già un account? <Link href="/login">Accedi</Link>.
            </h6>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}
