// src/components/AuthBar.tsx
import { useAuth } from "../contexts/AuthContext";

const AuthBar = () => {
  const { user, signInWithGoogle, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur flex items-center justify-between px-4 py-2 border-b shadow-sm">
      {/* App name / logo */}
      <span className="font-semibold text-lg">🏆 Leagues</span>

      {/* Right-side auth controls */}
      {user ? (
        <div className="flex items-center gap-3">
          <img
            src={user.photoURL ?? undefined}
            alt={user.displayName ?? "avatar"}
            className="w-8 h-8 rounded-full"
          />
          <span className="text-sm text-gray-700">
            {user.displayName?.split(" ")[0]}
          </span>
          <button
            onClick={signOut}
            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md"
          >
            Logout
          </button>
        </div>
      ) : (
        <button
          onClick={signInWithGoogle}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
        >
          Sign in with Google
        </button>
      )}
    </header>
  );
};

export default AuthBar;
