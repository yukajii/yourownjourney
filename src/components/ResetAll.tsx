import { useGoals } from "../contexts/GoalsContext";
import { useModal } from "../modals/ModalProvider";
import { useT } from "../i18n";

const ResetAll = () => {
  const { resetAll, goals } = useGoals();
  const { confirm } = useModal();
  const t = useT();

  const handleReset = async () => {
    const ok = await confirm({
      title: t("reset.title"),
      body: t("reset.body", { count: goals.length }),
      confirmLabel: t("reset.confirm"),
      danger: true,
    });
    if (ok) await resetAll();
  };

  if (goals.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <button onClick={handleReset} className="btn btn-outline w-full text-red-400">
        🔥 {t("reset.button")}
      </button>
    </section>
  );
};

export default ResetAll;
