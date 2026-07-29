import { useState } from "react";
import { useGoals } from "../contexts/GoalsContext";
import { download, exportFilename, toBundle, toCsv } from "../export";
import { useT } from "../i18n";

/**
 * Takes the journey out of the app.
 *
 * Years of logged hours with no way to retrieve them is a reason not to trust
 * a tracker in the first place, so both a full-fidelity JSON copy and a
 * spreadsheet-ready CSV are one click away.
 */
const ExportData = () => {
  const { goals, loadAllLogs } = useGoals();
  const t = useT();
  const [busy, setBusy] = useState<"json" | "csv" | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (goals.length === 0) return null;

  const run = async (kind: "json" | "csv") => {
    setBusy(kind);
    setError(null);
    try {
      // Only the open goal's logs are kept in memory; the rest are fetched now.
      const logsByGoal = await loadAllLogs();

      if (kind === "json") {
        download(
          JSON.stringify(toBundle(goals, logsByGoal), null, 2),
          exportFilename("json"),
          "application/json"
        );
      } else {
        download(toCsv(goals, logsByGoal), exportFilename("csv"), "text/csv");
      }
    } catch (e) {
      console.error("Export failed", e);
      setError(t("data.failed"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <section id="export-data" className="card flex flex-col gap-3">
      <h2 className="section-title">{t("data.title")}</h2>
      <p className="text-sm text-gray-400">
        {t("data.body")}
      </p>

      <div className="flex gap-2">
        <button
          onClick={() => run("json")}
          disabled={busy !== null}
          className="btn btn-outline flex-1"
        >
          {busy === "json" ? t("data.gathering") : "⬇ JSON"}
        </button>
        <button
          onClick={() => run("csv")}
          disabled={busy !== null}
          className="btn btn-outline flex-1"
        >
          {busy === "csv" ? t("data.gathering") : "⬇ CSV"}
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
    </section>
  );
};

export default ExportData;
