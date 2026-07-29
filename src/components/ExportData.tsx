import { useState } from "react";
import { useGoals } from "../contexts/GoalsContext";
import { download, exportFilename, toBundle, toCsv } from "../export";

/**
 * Takes the journey out of the app.
 *
 * Years of logged hours with no way to retrieve them is a reason not to trust
 * a tracker in the first place, so both a full-fidelity JSON copy and a
 * spreadsheet-ready CSV are one click away.
 */
const ExportData = () => {
  const { goals, loadAllLogs } = useGoals();
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
      setError("Could not gather your logs. If you are offline, try again once connected.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <section id="export-data" className="card flex flex-col gap-3">
      <h2 className="section-title">Your data</h2>
      <p className="text-sm text-gray-400">
        Every goal, every logged hour and every note — yours to keep.
      </p>

      <div className="flex gap-2">
        <button
          onClick={() => run("json")}
          disabled={busy !== null}
          className="btn btn-outline flex-1"
        >
          {busy === "json" ? "Gathering…" : "⬇ JSON"}
        </button>
        <button
          onClick={() => run("csv")}
          disabled={busy !== null}
          className="btn btn-outline flex-1"
        >
          {busy === "csv" ? "Gathering…" : "⬇ CSV"}
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
    </section>
  );
};

export default ExportData;
