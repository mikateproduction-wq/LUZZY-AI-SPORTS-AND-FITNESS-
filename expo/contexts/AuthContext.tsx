import createContextHook from "@nkzw/create-context-hook";
import { useCallback, useState } from "react";

export type AuthUser = {
  id: string;
  email: string | null;
  name: string | null;
};

const AUTH_UNAVAILABLE_MESSAGE =
  "Connexion indisponible pendant la migration de l'authentification.";

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user] = useState<AuthUser | null>(null);
  const [isLoading] = useState<boolean>(false);
  const [isSigningIn] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const signIn = useCallback(async (_provider: "google") => {
    setError(AUTH_UNAVAILABLE_MESSAGE);
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
  }, []);

  return { user, isLoading, isSigningIn, error, signIn, clearError, signOut };
});
