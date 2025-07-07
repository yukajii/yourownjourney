import { useGoals } from "../contexts/GoalsContext";

const GoalManager = () => {
  const {
    goals,
    currentGoalId,
    createGoal,
    renameGoal,
    deleteGoal,
    setCurrentGoal
  } = useGoals();

  const handleCreate = () => {
    const name = prompt("New goal name:")?.trim();
    if (name) createGoal(name);
  };

  const handleRename = () => {
    if (!currentGoalId) return;
    const current = goals.find(g => g.id === currentGoalId);
    const name = prompt("Rename goal:", current?.name)?.trim();
    if (name) renameGoal(currentGoalId, name);
  };

  const handleDelete = () => {
    if (goals.length === 1)
      return alert("You need at least one goal.");
    if (confirm("Delete this goal?")) deleteGoal(currentGoalId!);
  };

  return (
    <section className="card flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Goals</h2>

      {goals.length > 0 ? (
        <select
          className="p-2 rounded bg-[color:var(--surface-alt)] text-gray-100 border border-white/10 focus:outline-none"
          value={currentGoalId ?? undefined}
          onChange={e => setCurrentGoal(e.target.value)}
        >
          {goals.map(g => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      ) : (
        <p className="text-sm text-gray-400">
          No goals yet – create one!
        </p>
      )}

      <div className="flex gap-2">
        <button onClick={handleCreate} className="btn btn-green flex-1">
          ➕ New
        </button>
        <button
          onClick={handleRename}
          className="btn btn-blue flex-1"
          disabled={!currentGoalId}
        >
          ✏️ Rename
        </button>
        <button
          onClick={handleDelete}
          className="btn btn-red flex-1"
          disabled={goals.length === 1}
        >
          🗑️ Delete
        </button>
      </div>
    </section>
  );
};

export default GoalManager;
