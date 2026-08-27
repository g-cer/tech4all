import fs from "fs";
import path from "path";
import multer from "multer";
import sharp from "sharp";
import { env } from "../../config/env";
import { ValidationError } from "../errors/AppError";

/** Estensioni immagine accettate dal sistema. */
const ESTENSIONI_AMMESSE = new Set([".png", ".jpg", ".jpeg", ".webp"]);

/** Dimensione massima di un file caricato. */
const DIMENSIONE_MASSIMA = 5 * 1024 * 1024;

/** Larghezza e altezza a cui vengono normalizzate le copertine. */
const COPERTINA = { larghezza: 1280, altezza: 720 } as const;

const DIR_COPERTINE = path.join(env.uploadsDir, "copertine");
const DIR_CONTENUTI = path.join(env.uploadsDir, "quill");

for (const dir of [DIR_COPERTINE, DIR_CONTENUTI]) {
  fs.mkdirSync(dir, { recursive: true });
}

/**
 * Genera un nome file casuale conservando solo l'estensione originale.
 * Il nome scelto dall'utente non viene mai usato sul filesystem: eviterebbe
 * collisioni ma soprattutto impedisce la traversal tramite `originalname`.
 */
function nomeFileSicuro(originalname: string): string {
  const estensione = path.extname(originalname).toLowerCase();
  const casuale = Math.random().toString(36).slice(2, 10);
  return `${Date.now()}-${casuale}${estensione}`;
}

function filtroImmagini(
  _req: Express.Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback,
): void {
  const estensione = path.extname(file.originalname).toLowerCase();
  if (!ESTENSIONI_AMMESSE.has(estensione)) {
    callback(
      new ValidationError(
        "Formato immagine non valido. Sono ammessi png, jpg, jpeg e webp.",
      ),
    );
    return;
  }
  callback(null, true);
}

function creaUploader(destinazione: string): multer.Multer {
  return multer({
    storage: multer.diskStorage({
      destination: (_req, _file, callback) => callback(null, destinazione),
      filename: (_req, file, callback) =>
        callback(null, nomeFileSicuro(file.originalname)),
    }),
    limits: { fileSize: DIMENSIONE_MASSIMA },
    fileFilter: filtroImmagini,
  });
}

/** Upload della copertina di un tutorial (campo `grafica`). */
export const uploadCopertina = creaUploader(DIR_COPERTINE).single("grafica");

/** Upload di un'immagine inserita nel corpo di un tutorial (campo `immagine`). */
export const uploadContenuto = creaUploader(DIR_CONTENUTI).single("immagine");

/**
 * Ridimensiona la copertina appena caricata e ne restituisce il percorso
 * relativo, adatto a essere salvato nel database e servito su `/uploads`.
 *
 * @param file File prodotto da `uploadCopertina`.
 * @returns Percorso relativo dell'immagine normalizzata.
 */
export async function normalizzaCopertina(
  file: Express.Multer.File,
): Promise<string> {
  const nomeRidimensionato = `r-${file.filename}`;
  const destinazione = path.join(DIR_COPERTINE, nomeRidimensionato);

  await sharp(file.path)
    .resize(COPERTINA.larghezza, COPERTINA.altezza, { fit: "cover" })
    .toFile(destinazione);

  await fs.promises.unlink(file.path).catch(() => undefined);
  return `uploads/copertine/${nomeRidimensionato}`;
}

/** Percorso relativo di un'immagine di contenuto appena caricata. */
export function percorsoContenuto(file: Express.Multer.File): string {
  return `uploads/quill/${file.filename}`;
}

/**
 * Elimina un'immagine di contenuto.
 *
 * Accetta soltanto un nome file semplice e lo risolve dentro la cartella
 * dei contenuti, verificando l'esito: nessun percorso fornito dal client
 * può portare fuori da quella directory.
 *
 * @param nomeFile Nome del file da eliminare, senza separatori di percorso.
 * @returns True se il file esisteva ed è stato rimosso.
 * @throws ValidationError se il nome file non è un nome semplice.
 */
export async function eliminaImmagineContenuto(
  nomeFile: string,
): Promise<boolean> {
  if (nomeFile !== path.basename(nomeFile) || nomeFile.startsWith(".")) {
    throw new ValidationError("Nome file non valido.");
  }

  const percorso = path.resolve(DIR_CONTENUTI, nomeFile);
  if (path.dirname(percorso) !== path.resolve(DIR_CONTENUTI)) {
    throw new ValidationError("Nome file non valido.");
  }

  try {
    await fs.promises.unlink(percorso);
    return true;
  } catch {
    return false;
  }
}
