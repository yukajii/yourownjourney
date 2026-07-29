// src/components/AuthBar.tsx
import { useAuth } from "../contexts/AuthContext";
import { useT } from "../i18n";
import InstallPrompt from "./InstallPrompt";

const AuthBar = () => {
  const { user, loading, error, signInWithGoogle, signOut } = useAuth();
  const t = useT();

  return (
    <header
      className="sticky top-0 z-30 border-b border-white/10 bg-[color:var(--bg)]/85 shadow-sm
                 backdrop-blur pt-[env(safe-area-inset-top)]"
    >
      <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-4 py-2">
        <span className="flex items-center gap-2 font-display text-xl font-semibold">
          <img src="/favicon.svg" alt="" className="h-6 w-6" />
          Leagues
        </span>

        <div className="flex items-center gap-2">
          <InstallPrompt />

          {loading ? (
            <span className="text-sm text-gray-500">…</span>
          ) : user ? (
            <>
              {user.photoURL && (
                <img
                  src={user.photoURL}
                  alt=""
                  className="h-8 w-8 rounded-full"
                  referrerPolicy="no-referrer"
                />
              )}
              <span className="hidden text-sm text-gray-300 sm:inline">
                {user.displayName?.split(" ")[0]}
              </span>
              <button onClick={signOut} className="btn btn-outline px-3 py-1 text-sm">
                {t("auth.signOut")}
              </button>
            </>
          ) : (
            <button onClick={signInWithGoogle} className="btn btn-green px-3 py-1 text-sm">
              {t("auth.signIn")}
            </button>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="px-4 pb-2 text-center text-sm text-red-400">
          {t(error)}
        </p>
      )}
    </header>
  );
};

export default AuthBar;
