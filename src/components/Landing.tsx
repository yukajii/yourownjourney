import { TIER_STAGES } from "../tiers";

/**
 * What a stranger sees on arrival.
 *
 * The app used to open straight into a timer, which tells someone who followed
 * a link nothing about why they should care. This explains the idea in about
 * five seconds and then gets out of the way — it is shown only to a visitor
 * with no goals who is not signed in, so it never appears twice.
 */
const Landing = () => (
  <section className="card-hero flex flex-col gap-5 text-center">
    <div className="flex flex-col gap-3">
      <p className="section-title mx-auto">A focus tracker shaped like the Odyssey</p>

      <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
        Ten years is a long voyage.
        <br />
        Count it in leagues.
      </h1>

      <p className="mx-auto max-w-md text-sm leading-relaxed text-gray-400">
        A <span className="text-gray-200">league</span> is the distance you can walk in one
        focused hour — and, as it happens, a measure used at sea. Start the clock, do the
        work, write a line about what you did. Every hour puts your goal a little further
        along the chart.
      </p>
    </div>

    {/* The stations, so the shape of a long journey is visible immediately. */}
    <ol className="mx-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-gray-500">
      {TIER_STAGES.map((stage, i) => (
        <li key={stage.name} className="flex items-center gap-2">
          {i > 0 && <span aria-hidden className="text-gray-700">·</span>}
          <span style={{ color: stage.accent }}>{stage.name}</span>
          <span className="tabular-nums text-gray-600">{stage.from}</span>
        </li>
      ))}
    </ol>

    <p className="text-sm text-gray-500">
      No account needed to try it. Works offline. Your notes stay yours —
      <span className="whitespace-nowrap"> export them any time.</span>
    </p>
  </section>
);

export default Landing;
