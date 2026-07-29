import { useGoals } from "../contexts/GoalsContext";
import { fmt } from "../format";
import { useModal } from "../modals/ModalProvider";
import type { Log } from "../models";
import LogEditor, { type LogDraft } from "./LogEditor";
import { useI18n } from "../i18n";

const when = (ts: number, locale: string) =>
  new Date(ts).toLocaleString(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const Logs = () => {
  const { current, logs, addLog, editLog, removeLog } = useGoals();
  const { custom, confirm } = useModal();
  const { t, locale } = useI18n();

  if (!current) return null;

  const handleAdd = async () => {
    const draft = await custom<LogDraft | null>(
      (done) => <LogEditor done={done} />,
      null
    );
    if (draft) addLog(draft.timestamp, draft.durationSec, draft.note);
  };

  const handleEdit = async (log: Log) => {
    const draft = await custom<LogDraft | null>(
      (done) => <LogEditor existing={log} done={done} />,
      null
    );
    if (draft) editLog({ ...log, ...draft });
  };

  const handleDelete = async (log: Log) => {
    const ok = await confirm({
      title: t("logs.deleteTitle"),
      body: t("logs.deleteBody", {
        duration: fmt(log.durationSec),
        when: when(log.timestamp, locale),
      }),
      confirmLabel: t("logs.delete"),
      danger: true,
    });
    if (ok) removeLog(log);
  };

  return (
    <section id="logs-section" className="card flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="section-title">{t("logs.title")}</h2>
        <div className="flex items-baseline gap-3">
          <span className="text-sm text-gray-400">
            {t("logs.total", { n: (current.totalTime / 3600).toFixed(2) })}
          </span>
          <button onClick={handleAdd} className="btn btn-outline px-2 py-1 text-sm">
            ＋ {t("logs.add")}
          </button>
        </div>
      </div>

      {logs.length === 0 ? (
        <p className="text-sm text-gray-400">{t("logs.empty")}</p>
      ) : (
        <ol className="-mx-1 max-h-72 space-y-1 overflow-y-auto">
          {logs.map((l) => (
            <li
              key={l.id}
              className="group rounded px-3 py-1.5 text-sm odd:bg-[color:var(--surface-alt)]"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="shrink-0 font-mono text-gray-400">{when(l.timestamp, locale)}</span>

                <span className="flex shrink-0 items-baseline gap-2 font-mono tabular-nums">
                  {fmt(l.durationSec)}
                  <span className="text-[color:var(--accent)]">
                    {(l.durationSec / 3600).toFixed(2)} L
                  </span>

                  {/* Always rendered rather than revealed on hover: on a phone
                      there is no hover to reveal them with. */}
                  <button
                    onClick={() => handleEdit(l)}
                    aria-label={t("logs.editAria", { when: when(l.timestamp, locale) })}
                    className="px-1 text-gray-500 hover:text-gray-200"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(l)}
                    aria-label={t("logs.deleteAria", { when: when(l.timestamp, locale) })}
                    className="px-1 text-gray-500 hover:text-red-400"
                  >
                    🗑️
                  </button>
                </span>
              </div>
              {l.note && <p className="mt-0.5 italic text-gray-300">{l.note}</p>}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};

export default Logs;
