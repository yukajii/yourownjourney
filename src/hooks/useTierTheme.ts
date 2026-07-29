import { useEffect } from "react";
import { useGoals } from "../contexts/GoalsContext";
import { useSession } from "../contexts/SessionContext";
import { tierForSeconds, type Tier } from "../tiers";

/**
 * Drives the app's accent from how far the current goal has walked.
 *
 * The colour is written to the root element rather than threaded through
 * components, so every existing `var(--accent)` — buttons, focus rings, the
 * heatmap, the ambient glow — moves together the moment a tier is reached.
 */
export const useTierTheme = (): Tier => {
  const { current } = useGoals();
  const { isActive, seconds } = useSession();

  const tier = tierForSeconds((current?.totalTime ?? 0) + (isActive ? seconds : 0));

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--accent", tier.accent);
    root.style.setProperty("--accent-soft", tier.accentSoft);
    root.dataset.tier = String(tier.index);
  }, [tier.accent, tier.accentSoft, tier.index]);

  return tier;
};
