import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { TOKEN_KEY, setUnauthorizedHandler } from "../api/client";
import * as authApi from "../api/auth";
import type { Usuario } from "../types/api";

interface AuthState {
  user: Usuario | null;
  loading: boolean;
  sessionExpired: boolean;
  signIn: (usuario: string, password: string) => Promise<Usuario>;
  signOut: () => void;
}

export const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(() => !!localStorage.getItem(TOKEN_KEY));
  const [sessionExpired, setSessionExpired] = useState(false);

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  // 401 en cualquier request: cerrar sesión con mensaje.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
      setSessionExpired(true);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  // Restaurar sesión al cargar. El rol confiable viene siempre de /auth/me.
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    authApi
      .me()
      .then(setUser)
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  const signIn = useCallback(async (usuario: string, password: string) => {
    const res = await authApi.login(usuario, password);
    localStorage.setItem(TOKEN_KEY, res.access_token);
    const u = await authApi.me();
    setSessionExpired(false);
    setUser(u);
    return u;
  }, []);

  const value = useMemo(
    () => ({ user, loading, sessionExpired, signIn, signOut }),
    [user, loading, sessionExpired, signIn, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
