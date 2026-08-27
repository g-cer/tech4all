import axios, { AxiosError, AxiosInstance } from "axios";

/** URL di base dell'API. In sviluppo punta al server Express locale. */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

/**
 * Istanza axios condivisa.
 *
 * `withCredentials` è indispensabile: la sessione viaggia in un cookie
 * `httpOnly` che il browser allega solo se esplicitamente richiesto.
 */
export const http: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

/** Errore proveniente dall'API, con il messaggio pensato per l'utente. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Normalizza un errore axios in `ApiError`.
 *
 * Il messaggio mostrato all'utente arriva dal server, che è l'unica autorità
 * sulle regole di validazione: il client non le duplica.
 */
export function normalizzaErrore(errore: unknown): ApiError {
  if (axios.isAxiosError(errore)) {
    const risposta = (errore as AxiosError<{ message?: string; code?: string }>)
      .response;
    if (risposta) {
      return new ApiError(
        risposta.data?.message ?? "Richiesta non riuscita.",
        risposta.status,
        risposta.data?.code ?? "UNKNOWN",
      );
    }
    return new ApiError(
      "Impossibile contattare il server. Riprova più tardi.",
      0,
      "NETWORK_ERROR",
    );
  }
  return new ApiError("Si è verificato un errore imprevisto.", 0, "UNKNOWN");
}

/**
 * Esegue una chiamata all'API convertendo qualunque errore in `ApiError`.
 * Le pagine possono così mostrare un messaggio senza conoscere axios.
 */
export async function richiesta<T>(operazione: () => Promise<T>): Promise<T> {
  try {
    return await operazione();
  } catch (errore) {
    throw normalizzaErrore(errore);
  }
}

/**
 * URL assoluto di un file servito dall'API (copertine, badge, immagini).
 *
 * @param percorso Percorso relativo memorizzato nel database, es. `uploads/seed/x.webp`.
 */
export function urlMedia(percorso: string): string {
  if (!percorso) {
    return "";
  }
  if (percorso.startsWith("http://") || percorso.startsWith("https://")) {
    return percorso;
  }
  return `${API_URL}/${percorso.replace(/^\/+/, "")}`;
}
