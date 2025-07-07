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

  /* ───────── button handlers ───────── */
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

  /* ───────── UI ───────── */
  return (
    <section className="my-4 p-4 border rounded flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Goals</h2>

      {/* selector */}
      {goals.length > 0 ? (
        <select
          className="p-2 border rounded"
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
        <p className="text-sm text-gray-500">
          No goals yet – create one!
        </p>
      )}

      {/* action buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleCreate}
          className="flex-1 bg-green-600 text-white rounded p-2"
        >
          ➕ New
        </button>
        <button
          onClick={handleRename}
          className="flex-1 bg-blue-600 text-white rounded p-2"
          disabled={!currentGoalId}
        >
          ✏️ Rename
        </button>
        <button
          onClick={handleDelete}
          className="flex-1 bg-red-600 text-white rounded p-2"
          disabled={goals.length === 1}
        >
          🗑️ Delete
        </button>
      </div>
    </section>
  );
};

export default GoalManager;
