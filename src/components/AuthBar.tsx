// src/components/AuthBar.tsx
import { useAuth } from "../contexts/AuthContext";

const AuthBar = () => {
  const { user, signInWithGoogle, signOut } = useAuth();

  return (
    <header className="w-full p-4 flex justify-end items-center border-b gap-4">
      {user ? (
        <>
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
            className="px-3 py-1 bg-red-500 text-white rounded"
          >
            Logout
          </button>
        </>
      ) : (
        <button
          onClick={signInWithGoogle}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Sign in with Google
        </button>
      )}
    </header>
  );
};

export default AuthBar;
