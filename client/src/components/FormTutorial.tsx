import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import styles from "../css/CreaTutorial.module.css";
import { api, urlMedia } from "@/api";
import { Categoria, Tutorial } from "@/types";

// Quill accede al DOM in fase di costruzione: va caricato solo nel browser.
const TextEditor = dynamic(() => import("./TextEditor"), { ssr: false });

interface Props {
  /** Tutorial da modificare; assente in creazione. */
  tutorial?: Tutorial;
  onSalvato: (tutorial: Tutorial) => void;
}

/** Form condiviso da creazione e modifica di un tutorial. */
const FormTutorial: React.FC<Props> = ({ tutorial, onSalvato }) => {
  const inModifica = tutorial !== undefined;

  const [titolo, setTitolo] = useState(tutorial?.titolo ?? "");
  const [categoria, setCategoria] = useState<Categoria | "">(
    tutorial?.categoria ?? "",
  );
  const [testo, setTesto] = useState(tutorial?.testo ?? "");
  const [copertina, setCopertina] = useState<File | null>(null);
  const [categorie, setCategorie] = useState<Categoria[]>([]);
  const [errore, setErrore] = useState<string | null>(null);
  const [inInvio, setInInvio] = useState(false);

  useEffect(() => {
    void api.tutorial
      .categorie()
      .then(setCategorie)
      .catch(() => undefined);
  }, []);

  const invia = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setErrore(null);

    if (!inModifica && !copertina) {
      setErrore("Carica un'immagine di copertina.");
      return;
    }

    const dati = new FormData();
    dati.append("titolo", titolo);
    dati.append("categoria", categoria);
    dati.append("testo", testo);
    if (copertina) {
      dati.append("grafica", copertina);
    }

    setInInvio(true);
    try {
      const salvato = inModifica
        ? await api.tutorial.aggiorna(tutorial.id, dati)
        : await api.tutorial.crea(dati);
      onSalvato(salvato);
    } catch (e) {
      setErrore((e as Error).message);
    } finally {
      setInInvio(false);
    }
  };

  return (
    <form className={styles.tutorialForm} onSubmit={invia}>
      {errore && (
        <p className={`${styles.formMessage} ${styles.error}`} role="alert">
          {errore}
        </p>
      )}

      <div className={styles.formGroup}>
        <label htmlFor="titolo">Titolo</label>
        <input
          id="titolo"
          className={styles.formInput}
          placeholder="Titolo del tutorial"
          value={titolo}
          onChange={(e) => setTitolo(e.target.value)}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="categoria">Categoria</label>
        <select
          id="categoria"
          className={styles.formInput}
          value={categoria}
          onChange={(e) => setCategoria(e.target.value as Categoria)}
          required
        >
          <option value="">Seleziona una categoria</option>
          {categorie.map((valore) => (
            <option key={valore} value={valore}>
              {valore}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.formGroup}>
        <label>Contenuto</label>
        <TextEditor valoreIniziale={tutorial?.testo} onChange={setTesto} />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="grafica">
          Immagine di copertina
          {inModifica && " (lascia vuoto per non cambiarla)"}
        </label>
        <input
          id="grafica"
          type="file"
          className={styles.formInput}
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => setCopertina(e.target.files?.[0] ?? null)}
        />
        {inModifica && (
          <img
            className={styles.anteprima}
            src={urlMedia(tutorial.grafica)}
            alt="Copertina attuale"
          />
        )}
      </div>

      <div className={styles.buttonContainer}>
        <button
          type="submit"
          className={styles.submitButton}
          disabled={inInvio}
        >
          {inInvio
            ? "Salvataggio…"
            : inModifica
              ? "Salva modifiche"
              : "Crea tutorial"}
        </button>
      </div>
    </form>
  );
};

export default FormTutorial;
