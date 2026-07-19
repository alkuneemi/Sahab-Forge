import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import type { Session, StoredUser } from "./types";

const USERS_KEY = "sahab_users";
// Kept identical to the keys the original SAHAB pages already wrote to
// localStorage, so the dashboard's "who is logged in" logic needs no
// changes at all.
const SESSION_EMAIL_KEY = "sahab_email";
const SESSION_NAME_KEY = "sahab_name";

function readUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    /* ignore */
  }
}

function readSession(): Session | null {
  try {
    const email = localStorage.getItem(SESSION_EMAIL_KEY);
    if (!email) return null;
    const fullName = localStorage.getItem(SESSION_NAME_KEY) || "";
    return { email, fullName };
  } catch {
    return null;
  }
}

interface AuthContextValue {
  session: Session | null;
  /** Returns null on success, or an error code ("invalid_credentials"). */
  login: (email: string, password: string) => "ok" | "invalid_credentials";
  /** Returns "ok" or "email_exists". */
  signup: (
    fullName: string,
    email: string,
    password: string
  ) => "ok" | "email_exists";
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(readSession);

  const login = useCallback(
    (email: string, password: string): "ok" | "invalid_credentials" => {
      const users = readUsers();
      const match = users.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase()
      );
      if (!match || match.password !== password) {
        return "invalid_credentials";
      }
      try {
        localStorage.setItem(SESSION_EMAIL_KEY, match.email);
        localStorage.setItem(SESSION_NAME_KEY, match.fullName);
      } catch {
        /* ignore */
      }
      setSession({ email: match.email, fullName: match.fullName });
      return "ok";
    },
    []
  );

  const signup = useCallback(
    (
      fullName: string,
      email: string,
      password: string
    ): "ok" | "email_exists" => {
      const users = readUsers();
      const exists = users.some(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase()
      );
      if (exists) return "email_exists";
      writeUsers([...users, { fullName, email: email.trim(), password }]);
      return "ok";
    },
    []
  );

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(SESSION_EMAIL_KEY);
      localStorage.removeItem(SESSION_NAME_KEY);
    } catch {
      /* ignore */
    }
    setSession(null);
  }, []);

  const value: AuthContextValue = { session, login, signup, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
