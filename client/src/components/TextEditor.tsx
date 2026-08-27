import React, { useEffect, useRef } from "react";
import type Quill from "quill";
import { api, urlMedia } from "@/api";

interface Props {
  /** Contenuto HTML iniziale dell'editor. */
  valoreIniziale?: string;
  onChange: (html: string) => void;
}

const BARRA_STRUMENTI = [
  [{ header: [1, 2, 3, false] }],
  [{ align: [] }],
  ["bold", "italic", "underline"],
  [{ color: [] }, { background: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
  ["link", "image"],
  ["clean"],
];

/**
 * Editor di testo ricco per il corpo dei tutorial.
 *
 * Le immagini inserite sono caricate sul server e referenziate per URL; quelle
 * rimosse dall'editor vengono eliminate, così i file orfani non si accumulano.
 * L'HTML prodotto è comunque sanificato dal server prima di essere salvato.
 */
const TextEditor: React.FC<Props> = ({ valoreIniziale = "", onChange }) => {
  const contenitore = useRef<HTMLDivElement>(null);
  const immaginiPrecedenti = useRef<string[]>([]);
  // Mantiene il riferimento all'ultima callback senza reinizializzare Quill.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!contenitore.current) {
      return;
    }

    let istanza: Quill | undefined;
    let annullato = false;

    const caricaImmagine = (editor: Quill): void => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/png,image/jpeg,image/webp";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) {
          return;
        }
        try {
          const percorso = await api.tutorial.caricaImmagine(file);
          const posizione = editor.getSelection()?.index ?? editor.getLength();
          editor.insertEmbed(posizione, "image", urlMedia(percorso));
        } catch (errore) {
          console.error("Caricamento dell'immagine non riuscito:", errore);
        }
      };
      input.click();
    };

    const sincronizzaImmagini = (editor: Quill): void => {
      const attuali = Array.from(editor.root.querySelectorAll("img")).map(
        (img) => img.getAttribute("src") ?? "",
      );
      const rimosse = immaginiPrecedenti.current.filter(
        (src) => !attuali.includes(src),
      );

      for (const src of rimosse) {
        const nomeFile = src.split("/").pop();
        if (nomeFile && src.includes("/uploads/quill/")) {
          void api.tutorial.eliminaImmagine(nomeFile).catch(() => undefined);
        }
      }
      immaginiPrecedenti.current = attuali;
    };

    void import("quill").then(({ default: QuillCostruttore }) => {
      if (annullato || !contenitore.current) {
        return;
      }

      istanza = new QuillCostruttore(contenitore.current, {
        theme: "snow",
        modules: { toolbar: BARRA_STRUMENTI },
        placeholder: "Inserisci il contenuto del tutorial…",
      });

      if (valoreIniziale) {
        istanza.clipboard.dangerouslyPasteHTML(valoreIniziale);
        onChangeRef.current(istanza.root.innerHTML);
      }

      const barra = istanza.getModule("toolbar") as {
        addHandler: (nome: string, gestore: () => void) => void;
      };
      barra.addHandler("image", () => caricaImmagine(istanza as Quill));

      istanza.on("text-change", () => {
        onChangeRef.current((istanza as Quill).root.innerHTML);
        sincronizzaImmagini(istanza as Quill);
      });
    });

    return () => {
      annullato = true;
      istanza?.off("text-change");
    };
    // L'editor viene inizializzato una sola volta: il contenuto iniziale
    // successivo è gestito internamente da Quill.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={contenitore} />;
};

export default TextEditor;
