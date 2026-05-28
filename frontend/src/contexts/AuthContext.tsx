import { createContext, useContext, useState, ReactNode } from "react";

import { apiPost } from "@/lib/api";

export interface Employee {
  id: number;
  name: string;
  email: string;
  role: string;
  initials: string;
  isAdmin: boolean;
  canViewHistory: boolean;
  canViewObservationHistory: boolean;
}

interface AuthApiUser {
  id: number;
  username: string;
  nome: string;
  role: string;
  isAdmin?: boolean;
  canViewHistory?: boolean;
  canViewObservationHistory: boolean;
}

type StoredEmployee = Partial<Employee> & {
  nome?: string;
  username?: string;
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

const normalizeRole = (role: string | undefined) => role?.trim().toUpperCase() ?? "";

const canViewObservationHistory = (user: {
  role?: string;
  isAdmin?: boolean;
  canViewHistory?: boolean;
  canViewObservationHistory?: boolean;
}) =>
  normalizeRole(user.role) === "ROLE_ADMIN" ||
  user.isAdmin === true ||
  user.canViewHistory === true ||
  user.canViewObservationHistory === true;

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
      const parsedUser = JSON.parse(storedUser) as StoredEmployee;
      const name = parsedUser.name?.trim() || parsedUser.nome?.trim() || "";
      const email = parsedUser.email?.trim() || parsedUser.username?.trim() || "";

      if (!name || !email || !parsedUser.id || !parsedUser.role) {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
        return null;
      }

      const isAdmin = parsedUser.isAdmin ?? normalizeRole(parsedUser.role) === "ROLE_ADMIN";
      const canViewHistory = isAdmin || parsedUser.canViewHistory === true;
      const canViewObservationHistoryValue =
        isAdmin || parsedUser.canViewObservationHistory === true || parsedUser.canViewHistory === true;
      return {
        ...parsedUser,
        id: parsedUser.id,
        name,
        email,
        role: parsedUser.role,
        initials: parsedUser.initials || getInitials(name),
        isAdmin,
        canViewHistory,
        canViewObservationHistory: canViewObservationHistoryValue,
      };
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

      const nextUser = {
        id: authUser.id,
        name: authUser.nome,
        email: authUser.username,
        role: authUser.role,
        initials: getInitials(authUser.nome),
        isAdmin: authUser.isAdmin ?? normalizeRole(authUser.role) === "ROLE_ADMIN",
        canViewHistory: authUser.canViewHistory ?? canViewObservationHistory(authUser),
        canViewObservationHistory: canViewObservationHistory(authUser),
      };
      setUser(nextUser);
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
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
