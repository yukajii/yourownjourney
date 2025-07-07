import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  type User
} from "firebase/auth";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { app } from "../firebase";           // the initialized Firebase app

/* ---------- Context shape ---------- */
type AuthCtx = {
  user: User | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | undefined>(undefined);
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be within <AuthProvider>");
  return ctx;
};

/* ---------- Provider ---------- */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = getAuth(app);                // getAuth used now → no TS6133
  const [user, setUser] = useState<User | null>(null);

  /* listen to Firebase auth */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, [auth]);

  /* helpers exposed to UI */
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signOut = async () => {
    await fbSignOut(auth);
  };

  const value: AuthCtx = { user, signInWithGoogle, signOut };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
