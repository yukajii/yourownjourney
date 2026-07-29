import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { auth } from "../firebase";

/* ---------- Context shape ---------- */
type AuthCtx = {
  user: User | null;
  /** True until Firebase reports the initial auth state. */
  loading: boolean;
  /** Last sign-in failure, for display; cleared on the next attempt. */
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | undefined>(undefined);
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be within <AuthProvider>");
  return ctx;
};

/** Errors that mean "this browser won't give us a popup" rather than "no". */
const POPUP_UNAVAILABLE = new Set([
  "auth/popup-blocked",
  "auth/operation-not-supported-in-this-environment",
  "auth/web-storage-unsupported",
]);

/** Errors the user caused on purpose — not worth surfacing as a failure. */
const USER_ABORTED = new Set([
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request",
]);

const codeOf = (e: unknown) =>
  typeof e === "object" && e !== null && "code" in e ? String((e as { code: unknown }).code) : "";

/* ---------- Provider ---------- */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });

    // Collects the result when we had to fall back to a full-page redirect.
    void getRedirectResult(auth).catch((e) => {
      if (!USER_ABORTED.has(codeOf(e))) setError("auth.failed");
    });

    return unsub;
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    const provider = new GoogleAuthProvider();

    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      const code = codeOf(e);
      if (USER_ABORTED.has(code)) return;

      if (POPUP_UNAVAILABLE.has(code)) {
        // Installed PWAs and locked-down mobile browsers often refuse popups.
        await signInWithRedirect(auth, provider);
        return;
      }

      console.error("Sign-in failed", e);
      // A key rather than a sentence: AuthBar translates it.
      setError(code === "auth/network-request-failed" ? "auth.offline" : "auth.failed");
    }
  };

  const signOut = async () => {
    setError(null);
    await fbSignOut(auth);
  };

  const value: AuthCtx = { user, loading, error, signInWithGoogle, signOut };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
