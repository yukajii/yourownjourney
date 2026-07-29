import { useGoals } from "../contexts/GoalsContext";
import { fmt } from "../format";
import { useModal } from "../modals/ModalProvider";
import { useT } from "../i18n";

/**
 * Asks what was accomplished, then records the time.
 *
 * Shared by the session timer and the pomodoro so that walking an hour is
 * logged the same way whichever clock measured it — and, more to the point, so
 * that neither can quietly skip the note. The notes are what the reflection
 * reads back.
 */
export const useLogWalk = () => {
  const { pushLog } = useGoals();
  const { prompt } = useModal();
  const t = useT();

  return async (durationSec: number, options: { title: string; goalId?: string }) => {
    if (durationSec <= 0) return;

    const note = await prompt({
      title: options.title,
      label: t("session.notePrompt", { duration: fmt(durationSec) }),
      placeholder: t("session.noteOptional"),
      confirmLabel: t("session.logIt"),
      multiline: true,
      allowEmpty: true,
    });

    // Dismissing the note must not throw the walked time away.
    pushLog(durationSec, note ?? "", options.goalId);
  };
};
