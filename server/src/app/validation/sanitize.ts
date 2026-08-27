import sanitizeHtml from "sanitize-html";

/**
 * Whitelist per il corpo dei tutorial, prodotto dall'editor Quill.
 * Sono ammessi soltanto marcatori di formattazione: nessuno `script`,
 * nessun attributo `on*`, nessun URL con schema arbitrario.
 */
const OPZIONI: sanitizeHtml.IOptions = {
  allowedTags: [
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "p",
    "br",
    "hr",
    "span",
    "div",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "ul",
    "ol",
    "li",
    "blockquote",
    "pre",
    "code",
    "a",
    "img",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height"],
    "*": ["class"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["http", "https", "data"] },
  transformTags: {
    // Un link esterno non deve poter manipolare la pagina che lo ha aperto.
    a: sanitizeHtml.simpleTransform("a", {
      rel: "noopener noreferrer",
    }),
  },
};

/**
 * Ripulisce l'HTML di un tutorial dai costrutti eseguibili.
 * Va applicata **in ingresso**, prima della persistenza: quanto è salvato
 * nel database è già sicuro da rendere nel client.
 */
export function sanificaHtmlTutorial(html: string): string {
  return sanitizeHtml(html, OPZIONI);
}
