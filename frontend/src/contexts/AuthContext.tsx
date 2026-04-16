import { createContext, useContext, useState, ReactNode } from "react";

import { apiPost } from "@/lib/api";

export interface Employee {
  id: number;
  name: string;
  email: string;
  role: string;
  initials: string;
}

interface AuthApiUser {
  id: number;
  username: string;
  nome: string;
}

const roleByUsername: Record<string, string> = {
  admin: "Administrador",
  "janaina@eva.com": "Atendente",
  "veronica@eva.com": "Atendente",
  "ana@eva.com": "Atendente",
  "vitor@eva.com": "Atendente",
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

interface AuthContextType {
  user: Employee | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);
const AUTH_STORAGE_KEY = "eva.auth.user";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Employee | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const storedUser = window.localStorage.getItem(AUTH_STORAGE_KEY);

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser) as Employee;
    } catch {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
  });

  const login = async (email: string, password: string) => {
    try {
      const authUser = await apiPost<AuthApiUser, { username: string; senha: string }>(
        "/auth/login",
        {
          username: email.trim(),
          senha: password,
        },
      );

      const normalizedUsername = authUser.username.toLowerCase();
      setUser({
        id: authUser.id,
        name: authUser.nome,
        email: authUser.username,
        role: roleByUsername[normalizedUsername] ?? "Atendente",
        initials: getInitials(authUser.nome),
      });
      window.localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({
          id: authUser.id,
          name: authUser.nome,
          email: authUser.username,
          role: roleByUsername[normalizedUsername] ?? "Atendente",
          initials: getInitials(authUser.nome),
        }),
      );
      return { success: true };
    } catch (_error) {
      return { success: false, error: "Usuário ou senha inválidos" };
    }
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
