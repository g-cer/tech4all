import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "../css/Header.module.css";
import { api } from "@/api";
import { useAuth } from "@/context/AuthContext";
import { Tutorial } from "@/types";

/** Ritardo prima di interrogare il server mentre l'utente digita. */
const ATTESA_RICERCA_MS = 300;

const Header: React.FC = () => {
  const { utente, isAdmin, inCaricamento, logout } = useAuth();
  const router = useRouter();

  const [menuAperto, setMenuAperto] = useState(false);
  const [ricerca, setRicerca] = useState("");
  const [risultati, setRisultati] = useState<Tutorial[]>([]);
  const contenitoreMenu = useRef<HTMLDivElement>(null);

  // La ricerca è ritardata: senza debounce ogni tasto premuto genererebbe
  // una richiesta al server.
  useEffect(() => {
    const chiave = ricerca.trim();
    if (chiave.length === 0) {
      setRisultati([]);
      return;
    }

    const timer = setTimeout(() => {
      void api.tutorial
        .cerca(chiave)
        .then(setRisultati)
        .catch(() => setRisultati([]));
    }, ATTESA_RICERCA_MS);

    return () => clearTimeout(timer);
  }, [ricerca]);

  // Il menu si chiude cliccando altrove: senza questo resterebbe aperto
  // anche dopo aver interagito con il resto della pagina.
  useEffect(() => {
    if (!menuAperto) {
      return;
    }
    const chiudi = (evento: MouseEvent) => {
      if (!contenitoreMenu.current?.contains(evento.target as Node)) {
        setMenuAperto(false);
      }
    };
    document.addEventListener("mousedown", chiudi);
    return () => document.removeEventListener("mousedown", chiudi);
  }, [menuAperto]);

  const esci = async () => {
    await logout();
    setMenuAperto(false);
    await router.push("/");
  };

  const apriTutorial = (id: number) => {
    setRicerca("");
    setRisultati([]);
    void router.push(`/tutorial/${id}`);
  };

  return (
    <header className={styles.header}>
      <Link href={utente ? "/home" : "/"} className={styles.logo}>
        <img src="/Media/LogoT4A.jpeg" alt="Tech4All" />
      </Link>

      <nav className={styles.navContainer}>
        {utente && (
          <div className={styles.searchBarContainer}>
            <input
              type="search"
              placeholder="Cerca un tutorial…"
              aria-label="Cerca un tutorial"
              className={styles.searchBar}
              value={ricerca}
              onChange={(e) => setRicerca(e.target.value)}
            />
            {risultati.length > 0 && (
              <div className={styles.searchDropdown}>
                {risultati.map((tutorial) => (
                  <button
                    key={tutorial.id}
                    type="button"
                    className={styles.searchResultItem}
                    onClick={() => apriTutorial(tutorial.id)}
                  >
                    <span className={styles.searchResultIcon}>🔍</span>
                    <span className={styles.searchResultTitle}>
                      {tutorial.titolo}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <ul className={styles.navLinks}>
          {/* Finché la sessione non è nota non si mostra né "Accedi" né
              l'avatar: evita che la voce cambi sotto gli occhi dell'utente. */}
          {inCaricamento ? null : !utente ? (
            <li>
              <Link href="/login">Accedi</Link>
            </li>
          ) : (
            <li>
              <div className={styles.userAvatarContainer} ref={contenitoreMenu}>
                <button
                  type="button"
                  className={styles.userAvatarButton}
                  aria-haspopup="menu"
                  aria-expanded={menuAperto}
                  onClick={() => setMenuAperto((aperto) => !aperto)}
                >
                  <img
                    src="/Media/icona.png"
                    alt={`Menu di ${utente.nome}`}
                    className={styles.userAvatar}
                  />
                </button>

                {menuAperto && (
                  <div className={styles.dropdownMenu} role="menu">
                    <Link
                      href={
                        isAdmin ? "/area-amministratore" : "/area-personale"
                      }
                      onClick={() => setMenuAperto(false)}
                    >
                      {isAdmin ? "Area amministratore" : "Area personale"}
                    </Link>
                    <Link href="/tutorial" onClick={() => setMenuAperto(false)}>
                      Catalogo tutorial
                    </Link>
                    <button type="button" onClick={esci}>
                      Esci
                    </button>
                  </div>
                )}
              </div>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Header;
