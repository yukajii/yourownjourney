import { useGoals } from "../contexts/GoalsContext";

const GoalHeader = () => {
  const { current, loading } = useGoals();

  if (loading) {
    return <div className="mb-2 h-8 w-2/3 animate-pulse rounded bg-white/10" aria-hidden />;
  }

  return (
    <h1 className="mb-2 text-2xl font-bold">
      {current ? current.name : "No goal selected"}
    </h1>
  );
};

export default GoalHeader;
