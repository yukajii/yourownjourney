import { useGoals } from "../contexts/GoalsContext";
import { useModal } from "../modals/ModalProvider";

const ResetAll = () => {
  const { resetAll, goals } = useGoals();
  const { confirm } = useModal();

  const handleReset = async () => {
    const ok = await confirm({
      title: "Delete everything?",
      body: `All ${goals.length} goal${goals.length === 1 ? "" : "s"}, their logged time and ` +
        "every note will be erased here and in the cloud. This cannot be undone.",
      confirmLabel: "Erase it all",
      danger: true,
    });
    if (ok) await resetAll();
  };

  if (goals.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <button onClick={handleReset} className="btn btn-outline w-full text-red-400">
        🔥 Reset everything
      </button>
    </section>
  );
};

export default ResetAll;
