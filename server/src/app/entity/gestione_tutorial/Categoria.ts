/** Categorie ammesse per un tutorial. Corrisponde a `tutorial.categoria`. */
export enum Categoria {
  INTERNET = "Internet",
  SOCIAL_MEDIA = "Social Media",
  TECNOLOGIA = "Tecnologia",
  SICUREZZA = "Sicurezza",
}

/** Elenco delle categorie valide, nell'ordine di presentazione. */
export const CATEGORIE: readonly Categoria[] = Object.values(Categoria);

/** Verifica che un valore proveniente dall'esterno sia una categoria valida. */
export function isCategoria(value: unknown): value is Categoria {
  return CATEGORIE.includes(value as Categoria);
}
