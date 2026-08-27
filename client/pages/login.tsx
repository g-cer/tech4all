import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "../src/css/Login.module.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errore, setErrore] = useState<string | null>(null);
  const [inInvio, setInInvio] = useState(false);

  const invia = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setErrore(null);
    setInInvio(true);

    try {
      const utente = await login(email.trim(), password);
      await router.push(
        utente.ruolo === "admin" ? "/area-amministratore" : "/home",
      );
    } catch (e) {
      // Le regole di validazione vivono sul server: qui si mostra
      // il messaggio che ne arriva, senza replicarle.
      setErrore((e as Error).message);
    } finally {
      setInInvio(false);
    }
  };

  return (
    <>
      <Header />
      <div className={styles.mainContainer}>
        <div className={styles.formContainer}>
          <h1>Accedi</h1>
          {errore && (
            <p className={styles.error} role="alert">
              {errore}
            </p>
          )}

          <form onSubmit={invia} noValidate>
            <div className={styles.inputGroup}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={inInvio}
            >
              {inInvio ? "Accesso in corso…" : "Accedi"}
            </button>
          </form>

          <p>
            Non hai un account? <Link href="/registrazione">Registrati</Link>.
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
