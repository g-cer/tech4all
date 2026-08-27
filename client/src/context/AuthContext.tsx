import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "@/api";
import { Utente } from "@/types";

interface AuthContextType {
  /** Utente della sessione, `null` se non autenticato. */
  utente: Utente | null;
  /** True finché la sessione non è stata verificata presso il server. */
  inCaricamento: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<Utente>;
  logout: () => Promise<void>;
  /** Ricarica il profilo dal server, ad esempio dopo una modifica. */
  aggiorna: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Stato di autenticazione dell'applicazione.
 *
 * La sessione risiede in un cookie `httpOnly` che il JavaScript di pagina non
 * può leggere: l'identità dell'utente viene quindi chiesta al server all'avvio
 * e non conservata nel `localStorage`.
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [utente, setUtente] = useState<Utente | null>(null);
  const [inCaricamento, setInCaricamento] = useState(true);

  const aggiorna = useCallback(async () => {
    setUtente(await api.autenticazione.sessione());
  }, []);

  useEffect(() => {
    let annullato = false;

    void (async () => {
      const profilo = await api.autenticazione.sessione();
      if (!annullato) {
        setUtente(profilo);
        setInCaricamento(false);
      }
    })();

    return () => {
      annullato = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const profilo = await api.autenticazione.login(email, password);
    setUtente(profilo);
    return profilo;
  }, []);

  const logout = useCallback(async () => {
    await api.autenticazione.logout();
    setUtente(null);
  }, []);

  const valore = useMemo(
    () => ({
      utente,
      inCaricamento,
      isAdmin: utente?.ruolo === "admin",
      login,
      logout,
      aggiorna,
    }),
    [utente, inCaricamento, login, logout, aggiorna],
  );

  return <AuthContext.Provider value={valore}>{children}</AuthContext.Provider>;
};

/**
 * Accesso allo stato di autenticazione.
 *
 * @throws Error se invocato fuori da `AuthProvider`.
 */
export function useAuth(): AuthContextType {
  const contesto = useContext(AuthContext);
  if (!contesto) {
    throw new Error("useAuth va usato all'interno di AuthProvider.");
  }
  return contesto;
}
