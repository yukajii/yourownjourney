import { useGoals } from "../contexts/GoalsContext";

const GoalHeader = () => {
  const { current } = useGoals();
  return (
    <h1 className="text-2xl font-bold mb-2">
      {current ? current.name : "No Goal Selected"}
    </h1>
  );
};

export default GoalHeader;
