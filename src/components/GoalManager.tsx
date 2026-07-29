import { useGoals } from "../contexts/GoalsContext";
import { useModal } from "../modals/ModalProvider";
import { useT } from "../i18n";

const GoalManager = () => {
  const { goals, currentGoalId, current, createGoal, renameGoal, deleteGoal, setCurrentGoal } =
    useGoals();
  const { prompt, confirm } = useModal();
  const t = useT();

  const handleCreate = async () => {
    const name = await prompt({
      title: t("goals.newTitle"),
      label: t("goals.newLabel"),
      placeholder: t("goals.newPlaceholder"),
      confirmLabel: t("goals.create"),
    });
    if (name) createGoal(name);
  };

  const handleRename = async () => {
    if (!current) return;
    const name = await prompt({
      title: t("goals.renameTitle"),
      defaultValue: current.name,
      confirmLabel: t("goals.rename"),
    });
    if (name) renameGoal(current.id, name);
  };

  const handleDelete = async () => {
    if (!current) return;
    const ok = await confirm({
      title: t("goals.deleteTitle", { name: current.name }),
      body: t("goals.deleteBody"),
      confirmLabel: t("goals.delete"),
      danger: true,
    });
    if (ok) deleteGoal(current.id);
  };

  return (
    // Prominent while there is nothing to walk toward, quiet once there is:
    // creating the first goal is the only thing that matters on an empty
    // screen, and routine switching afterwards does not warrant a full card.
    <section
      id="goal-manager"
      className={`flex flex-col gap-4 ${goals.length === 0 ? "card" : "card-quiet"}`}
    >
      <h2 className="section-title">{t("goals.title")}</h2>

      {goals.length > 0 ? (
        <select
          aria-label={t("goals.current")}
          className="rounded border border-white/10 bg-[color:var(--surface-alt)] p-2 text-gray-100 focus:outline-none"
          value={currentGoalId ?? ""}
          onChange={(e) => setCurrentGoal(e.target.value)}
        >
          {goals.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      ) : (
        <p className="text-sm text-gray-400">{t("goals.empty")}</p>
      )}

      <div className="flex gap-2">
        <button onClick={handleCreate} className="btn btn-green flex-1">
          ➕ {t("goals.new")}
        </button>
        <button onClick={handleRename} className="btn btn-blue flex-1" disabled={!current}>
          ✏️ {t("goals.rename")}
        </button>
        <button onClick={handleDelete} className="btn btn-red flex-1" disabled={!current}>
          🗑️ {t("goals.delete")}
        </button>
      </div>
    </section>
  );
};

export default GoalManager;
