import { useGoals } from "../contexts/GoalsContext";

const ResetAll = () => {
  const { resetAll } = useGoals();

  return (
    <section className="my-4 p-4 border rounded">
      <button
        onClick={resetAll}
        className="w-full bg-red-700 hover:bg-red-600 text-white p-3 rounded"
      >
        🔥 Reset EVERYTHING
      </button>
    </section>
  );
};

export default ResetAll;
