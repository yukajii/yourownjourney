import { useEffect, useState } from "react";
import { useT } from "../i18n";

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  // iOS Safari predates the display-mode media query for home-screen apps.
  (navigator as { standalone?: boolean }).standalone === true;

const isIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  // iPadOS 13+ reports itself as a Mac; touch points give it away.
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

/**
 * Offers to install the app. Chromium fires `beforeinstallprompt` and lets us
 * trigger the native sheet; iOS has no such API, so we explain the manual
 * "Add to Home Screen" route instead.
 */
const InstallPrompt = () => {
  const t = useT();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    const onPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault(); // keep the mini-infobar away; we choose the moment
      setDeferred(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    // The event is single-use — drop it either way.
    setDeferred(null);
    if (outcome === "accepted") setInstalled(true);
  };

  if (installed) return null;

  const iosFallback = !deferred && isIos();
  if (!deferred && !iosFallback) return null;

  return (
    <>
      <button
        onClick={iosFallback ? () => setShowIosHelp(true) : install}
        className="btn btn-outline text-sm py-1 px-3"
        title={t("install.button")}
      >
        ⬇️ {t("install.button")}
      </button>

      {showIosHelp && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
          onClick={() => setShowIosHelp(false)}
        >
          <div
            className="card max-w-sm space-y-3 text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-lg font-semibold">{t("install.title")}</h2>
            <ol className="list-decimal space-y-1 pl-5 text-gray-300">
              <li>{t("install.step1")}</li>
              <li>{t("install.step2")}</li>
              <li>{t("install.step3")}</li>
            </ol>
            <button
              onClick={() => setShowIosHelp(false)}
              className="btn btn-blue w-full"
            >
              {t("install.gotIt")}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default InstallPrompt;
