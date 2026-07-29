import { useT } from "../i18n";
import { TIER_STAGES } from "../tiers";

/**
 * What a stranger sees on arrival.
 *
 * The app used to open straight into a timer, which tells someone who followed
 * a link nothing about why they should care. This explains the idea in about
 * five seconds and then gets out of the way — it is shown only to a visitor
 * with no goals who is not signed in, so it never appears twice.
 */
const Landing = () => {
  const t = useT();

  return (
  <section className="card-hero flex flex-col gap-5 text-center">
    <div className="flex flex-col gap-3">
      <p className="section-title mx-auto">{t("landing.eyebrow")}</p>

      <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">
        {t("landing.headline1")}
        <br />
        {t("landing.headline2")}
      </h1>

      <p className="mx-auto max-w-md text-sm leading-relaxed text-gray-400">
        {t("landing.body", { league: t("landing.league") })}
      </p>
    </div>

    {/* The stations, so the shape of a long journey is visible immediately. */}
    <ol className="mx-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-gray-500">
      {TIER_STAGES.map((stage, i) => (
        <li key={stage.nameKey} className="flex items-center gap-2">
          {i > 0 && <span aria-hidden className="text-gray-700">·</span>}
          <span style={{ color: stage.accent }}>{t(stage.nameKey)}</span>
          <span className="tabular-nums text-gray-600">{stage.from}</span>
        </li>
      ))}
    </ol>

    <p className="text-sm text-gray-500">
      {t("landing.footer")}
      <span className="whitespace-nowrap">{t("landing.footerExport")}</span>
    </p>
  </section>
  );
};

export default Landing;
