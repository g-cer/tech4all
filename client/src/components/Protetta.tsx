import React, { ReactNode, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";

interface Props {
  children: ReactNode;
  /** Se true la pagina è riservata agli amministratori. */
  soloAdmin?: boolean;
}

/**
 * Nasconde una pagina a chi non ha i permessi e reindirizza al login.
 *
 * È una comodità per l'utente, non una misura di sicurezza: il controllo
 * vincolante resta quello dei middleware del server, che protegge i dati
 * anche se qualcuno raggiunge la pagina in altro modo.
 */
const Protetta: React.FC<Props> = ({ children, soloAdmin = false }) => {
  const { utente, isAdmin, inCaricamento } = useAuth();
  const router = useRouter();

  const autorizzato = utente !== null && (!soloAdmin || isAdmin);

  useEffect(() => {
    if (inCaricamento) {
      return;
    }
    if (!utente) {
      void router.replace("/login");
    } else if (soloAdmin && !isAdmin) {
      void router.replace("/home");
    }
  }, [inCaricamento, utente, isAdmin, soloAdmin, router]);

  if (inCaricamento || !autorizzato) {
    return <p style={{ padding: "2rem" }}>Caricamento…</p>;
  }

  return <>{children}</>;
};

export default Protetta;
