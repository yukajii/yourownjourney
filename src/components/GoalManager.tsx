import { useGoals } from "../contexts/GoalsContext";
import { useModal } from "../modals/ModalProvider";

const GoalManager = () => {
  const { goals, currentGoalId, current, createGoal, renameGoal, deleteGoal, setCurrentGoal } =
    useGoals();
  const { prompt, confirm } = useModal();

  const handleCreate = async () => {
    const name = await prompt({
      title: "New goal",
      label: "What are you walking toward?",
      placeholder: "e.g. Learn Japanese",
      confirmLabel: "Create",
    });
    if (name) createGoal(name);
  };

  const handleRename = async () => {
    if (!current) return;
    const name = await prompt({
      title: "Rename goal",
      defaultValue: current.name,
      confirmLabel: "Rename",
    });
    if (name) renameGoal(current.id, name);
  };

  const handleDelete = async () => {
    if (!current) return;
    const ok = await confirm({
      title: `Delete “${current.name}”?`,
      body: "Its logged time and notes go with it. This cannot be undone.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (ok) deleteGoal(current.id);
  };

  return (
    <section id="goal-manager" className="card flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Goals</h2>

      {goals.length > 0 ? (
        <select
          aria-label="Current goal"
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
        <p className="text-sm text-gray-400">No goals yet – create one!</p>
      )}

      <div className="flex gap-2">
        <button onClick={handleCreate} className="btn btn-green flex-1">
          ➕ New
        </button>
        <button onClick={handleRename} className="btn btn-blue flex-1" disabled={!current}>
          ✏️ Rename
        </button>
        <button onClick={handleDelete} className="btn btn-red flex-1" disabled={!current}>
          🗑️ Delete
        </button>
      </div>
    </section>
  );
};

export default GoalManager;
