/**
 * Vincoli di dominio condivisi fra i validatori delle rotte e i service.
 *
 * Tenerli in un solo file evita che le regole divergano fra i due livelli,
 * ed è il riferimento unico rispetto al quale sono scritti i casi di test.
 */

export const UTENTE = {
  emailMin: 6,
  emailMax: 255,
  /** Almeno 8 caratteri, una maiuscola, una cifra e un carattere speciale. */
  passwordRegex: /^(?=.*[!@#$%^&*])(?=.*\d)(?=.*[A-Z]).{8,64}$/,
  passwordMin: 8,
  passwordMax: 64,
  nomeMin: 2,
  nomeMax: 50,
  /** Lettere (anche accentate), spazi, apostrofi e trattini. */
  nomeRegex: /^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ' -]*$/,
} as const;

export const TUTORIAL = {
  titoloMin: 5,
  titoloMax: 100,
  testoMin: 20,
  testoMax: 65535,
  graficaRegex: /\.(png|jpe?g|webp)$/i,
} as const;

export const FEEDBACK = {
  commentoMin: 2,
  commentoMax: 500,
  valutazioneMin: 1,
  valutazioneMax: 5,
} as const;

export const QUIZ = {
  domandaMin: 2,
  domandaMax: 255,
  rispostaMin: 2,
  rispostaMax: 255,
  domandeMin: 1,
  risposteMin: 2,
  risposteMax: 5,
  /** Frazione di risposte corrette necessaria a superare il quiz. */
  sogliaSuperamento: 0.7,
} as const;

export const OBIETTIVO = {
  nomeMin: 2,
  nomeMax: 255,
  descrizioneMin: 2,
  descrizioneMax: 500,
} as const;

/** Messaggio d'errore standard sulla politica delle password. */
export const MESSAGGIO_PASSWORD =
  "La password deve contenere almeno 8 caratteri, una lettera maiuscola, " +
  "un numero e un carattere speciale.";
