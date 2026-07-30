import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "@/api/client";

type Ctx = {
  user: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthCtx = createContext<Ctx>({ user: null, loading: true, signOut: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Always try to restore session via httpOnly cookie or stored token
    api.getMe().then((data) => {
      setUser(data?.user ?? null);
      setLoading(false);
    }).catch(() => {
      setUser(null);
      setLoading(false);
    });
  }, []);

  return (
    <AuthCtx.Provider
      value={{
        user,
        loading,
        signOut: async () => {
          await api.signOut();
          setUser(null);
        },
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
