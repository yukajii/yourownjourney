import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useGoals } from "../contexts/GoalsContext";
import { canReflect, trailingMonth, type Reflection as ReflectionType } from "../reflection";
import { isConfigured, requestReflection } from "../reflectionClient";
import { useT } from "../i18n";

/**
 * Reads the last month of the user's own notes back to them.
 *
 * Strictly opt-in and never automatic: this is the only part of the app that
 * sends anything anywhere other than the user's own Firestore document, and
 * the notes are the most personal thing it holds.
 */
const Reflection = () => {
  const { current, logs } = useGoals();
  const { user } = useAuth();
  const t = useT();
  const [result, setResult] = useState<ReflectionType | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Nothing to offer without a build that has an endpoint, a signed-in user to
  // authorise the call, or a goal to reflect on.
  if (!isConfigured() || !current || !user) return null;

  const period = trailingMonth(Date.now());
  const input = { goalName: current.name, ...period, logs };
  const readiness = canReflect(input);
  const readinessMessage = readiness.ready ? "" : t(readiness.key, readiness.params);

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      setResult(await requestReflection(input));
    } catch (e) {
      // Worker messages arrive as sentences; our own arrive as keys.
      setError(e instanceof Error ? t(e.message) : t("reflection.failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="reflection" className="card flex flex-col gap-3">
      <h2 className="section-title">{t("reflection.title")}</h2>

      {!readiness.ready ? (
        <p className="text-sm text-gray-400">{readinessMessage}</p>
      ) : (
        <>
          <p className="text-sm text-gray-400">
            {t("reflection.pitch")}{" "}
            <span className="text-gray-500">{t("reflection.privacy")}</span>
          </p>

          <button onClick={run} disabled={busy} className="btn btn-blue self-start">
            {busy ? t("reflection.busy") : result ? t("reflection.again") : t("reflection.run")}
          </button>
        </>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {result && (
        <div className="flex flex-col gap-3 border-t border-white/10 pt-3">
          <p className="text-sm leading-relaxed text-gray-200">{result.summary}</p>

          {result.themes.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {result.themes.map((t) => (
                <li
                  key={t}
                  className="rounded-full border border-white/10 bg-[color:var(--surface-alt)] px-3 py-1 text-xs text-gray-300"
                >
                  {t}
                </li>
              ))}
            </ul>
          )}

          {result.suggestion && (
            <p className="text-sm italic leading-relaxed text-gray-400">{result.suggestion}</p>
          )}
        </div>
      )}
    </section>
  );
};

export default Reflection;
