import { useEffect } from "react";
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

  const showing = offlineReady || needRefresh;

  /*
   * The mentor floats in the same bottom corner and would sit on top of this
   * on a narrow screen, where the bubble is most of the width. Both are fixed
   * overlays, so raising the z-index alone is not enough — they would simply
   * overlap. The mentor steps aside while this is up.
   */
  useEffect(() => {
    document.body.classList.toggle("prompt-open", showing);
    return () => document.body.classList.remove("prompt-open");
  }, [showing]);

  if (!showing) return null;

  const dismiss = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-0 z-50 mx-auto mb-[env(safe-area-inset-bottom)] w-full max-w-md p-3"
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
