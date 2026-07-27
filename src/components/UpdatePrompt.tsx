import { useRegisterSW } from "virtual:pwa-register/react";

/**
 * Surfaces service-worker state: a one-off "ready to work offline" note and,
 * when a new build is precached, an opt-in reload. Reloading is deliberately
 * manual so an update can never interrupt a running session.
 */
const UpdatePrompt = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!offlineReady && !needRefresh) return null;

  const dismiss = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto mb-[env(safe-area-inset-bottom)] w-full max-w-md p-3"
    >
      <div className="card flex items-center gap-3 text-sm shadow-lg">
        <span className="flex-1">
          {needRefresh
            ? "A new version of Leagues is ready."
            : "Leagues is installed and works offline."}
        </span>

        {needRefresh && (
          <button
            onClick={() => updateServiceWorker(true)}
            className="btn btn-blue px-3 py-1"
          >
            Reload
          </button>
        )}

        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="btn btn-outline px-3 py-1"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default UpdatePrompt;
