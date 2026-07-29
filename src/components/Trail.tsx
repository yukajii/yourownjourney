type Props = {
  /** 0–100 along the segment. */
  pct: number;
  /** True when the mark ahead is one of the great tiers. */
  toIsTier: boolean;
  /** A session is running, so the walker is moving. */
  walking: boolean;
  label: string;
};

/**
 * The stretch of road between the last mark and the next.
 *
 * A flat bar says "45%". A road with the ground already covered behind you,
 * the way ahead still dashed, and a marker standing where you are says
 * something closer to what the app is about. The segment is the waypoint span
 * rather than the whole tier, so the marker visibly moves within a session.
 */
const Trail = ({ pct, toIsTier, walking, label }: Props) => {
  const clamped = Math.min(100, Math.max(0, pct));

  return (
    <div
      className="relative h-10 w-full"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      aria-label={label}
    >
      {/* the way ahead, not yet walked */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-dashed border-white/20" />

      {/* ground covered */}
      <div
        className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full transition-[width] duration-700 ease-out"
        style={{
          width: `${clamped}%`,
          background:
            "linear-gradient(90deg, color-mix(in srgb, var(--accent-soft) 70%, transparent), var(--accent))",
        }}
      />

      {/* where this stretch began */}
      <span className="absolute left-0 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/25" />

      {/* the mark ahead — a cairn for a waypoint, something taller for a tier */}
      <span
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2"
        aria-hidden
      >
        {toIsTier ? (
          <span
            className="block h-4 w-4 rotate-45 rounded-[3px] border-2"
            style={{
              borderColor: "var(--accent)",
              background: "color-mix(in srgb, var(--accent) 22%, transparent)",
            }}
          />
        ) : (
          <span className="block h-2.5 w-2.5 rounded-full border border-white/40 bg-[color:var(--bg)]" />
        )}
      </span>

      {/* the walker */}
      <span
        className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-[left] duration-700 ease-out"
        style={{ left: `${clamped}%` }}
        aria-hidden
      >
        <span
          className={`block h-3.5 w-3.5 rounded-full ring-2 ring-[color:var(--bg)] ${
            walking ? "running-pulse" : ""
          }`}
          style={{
            background: "var(--accent)",
            boxShadow: "0 0 14px 2px color-mix(in srgb, var(--accent) 55%, transparent)",
          }}
        />
      </span>
    </div>
  );
};

export default Trail;
