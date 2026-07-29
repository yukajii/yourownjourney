# Leagues — Your Own Journey

A time and progress tracker built around a single idea: **a league is the
distance you can walk in one focused hour.** Start a session, do the work, log
what you accomplished, and watch a goal climb the tiers — 20, 100, 1 000,
10 000 leagues.

Installable as an app on Android, iOS and desktop, and fully usable offline.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
```

| script            | what it does                                     |
| ----------------- | ------------------------------------------------ |
| `npm run dev`     | dev server, with the service worker enabled      |
| `npm run typecheck` | type-checks every project reference            |
| `npm run lint`    | ESLint                                           |
| `npm run test`    | Vitest, over the pure timer, tier and storage logic |
| `npm run build`   | type-check, then produce `dist/`                 |
| `npm run preview` | serve the production build locally               |

## Deploying

The site is hosted on **Cloudflare Pages** (project `leagues`, serving
`leagues.yukajii.com`), which builds from `main` on every push. There is no
manual deploy step for the app.

Firebase is used only for Auth and Firestore. Its rules deploy separately:

```bash
npx firebase deploy --only firestore
```

The reflection Worker deploys on its own:

```bash
cd worker && npx wrangler deploy
```

### Build-time configuration

`VITE_*` values are compiled into the bundle, so they must be set **in the
Cloudflare Pages project**, not only in a local `.env` — `.env` is gitignored
and the build has no access to it. Pages → Settings → Environment variables:

| variable | purpose |
| -------- | ------- |
| `VITE_REFLECTION_ENDPOINT` | the reflection Worker's URL; the Reflection card does not render without it |
| `VITE_CF_ANALYTICS_TOKEN`  | Cloudflare Web Analytics site token |

Caching lives in `public/_headers`. Pages does not read `firebase.json`, and a
long-cached `sw.js` would strand installed users on an old build.

`firestore.rules` restricts `users/{uid}` and everything beneath it to its
owner. Deploy it at least once — a project left in test mode lets any
signed-in account read every other account's goals. The recursive wildcard in
the rule is load-bearing: goals and logs are subcollections, and a rule on the
user document alone does not reach them.

## How it is put together

State lives in three providers, composed in `src/main.tsx`:

| provider          | owns                                                      |
| ----------------- | --------------------------------------------------------- |
| `AuthContext`     | the Firebase user, sign-in (popup, redirect fallback)      |
| `GoalsContext`    | goals and logs; localStorage + a live Firestore subscription |
| `SessionContext`  | the single running session                                 |

`ModalProvider` supplies promise-based `prompt()` and `confirm()` dialogs, so
nothing in the app blocks on `window.prompt`.

### Timers

Both the session timer and the pomodoro store a **timestamp**, never a tick
count — `startTime` for the session, `endsAt` for the pomodoro. Browsers
throttle background intervals and suspend them entirely when the screen goes
off, so `useTicker` merely decides *when* to recompute and every value is
derived from `Date.now()`. Reopening the app after an hour therefore shows the
correct elapsed time rather than a countdown that stopped in your pocket.

### Reflection

The note field was write-only — nothing in the app ever read it back. The
reflection sends one period's notes to `gpt-5.6-luna` and returns the threads
running through them. It is opt-in, never automatic, and the card says plainly
that the notes leave the device.

The key cannot live in this app. Leagues is a static PWA, so anything it can
read, every visitor can read; Vite compiles every `VITE_*` variable into the
public bundle. The key therefore lives on a Cloudflare Worker in `worker/`,
which verifies the caller's Firebase ID token against Google's public keys
before spending it. Without that check, an endpoint holding a funded key is a
free OpenAI account for anyone who finds the URL.

Setting it up:

```bash
cd worker
npx wrangler login
npx wrangler secret put OPENAI_API_KEY   # paste at the prompt; never committed
npx wrangler deploy
```

Then put the deployed Worker's URL in the app's `.env` as
`VITE_REFLECTION_ENDPOINT` (see `.env.example`) and rebuild. Until that is set,
the Reflection card does not render at all, so the app works exactly as before.

The Worker's free tier covers 100k requests a day, which a monthly reflection
will not trouble.

### The mentor

`src/mentor.ts` turns the state of the journey into a set of lines, ordered by
how pressing they are: a session already running, a mark within reach, a gap
to come back from, a streak to keep. The widget rotates through that set, so
it can keep speaking without ever saying something untrue.

That constraint is the whole point. The previous version cycled seven fixed
sayings, one of which told a user on a twelve-day streak that they had missed
a session. `mentor.test.ts` asserts the invariant directly across a range of
states — no absence line when today is walked, no streak claim without a
streak, no pace claim without movement.

### The wine-dark sea

The ground was a neutral near-black — the default of every dark dashboard ever
shipped, and it read as exactly that. It is a warm violet now, after Homer's
οἶνοψ πόντος, still dark enough to sit in front of for an hour.

Typography is split by job: **Spectral** for anything that speaks — the goal,
the station, both clocks, the leagues figure — and **Inter** for anything that
labels. Long serif UI copy at 13px on a phone is harder to read, and this app
lives on phones. Both are self-hosted; the previous `@font-face` pointed at
rsms.me and simply failed with no connection.

The station colours walk from cold open sea through verdigris and bronze to a
gold dawn at Ithaca. Every one clears 5.8:1 against the ground. The primary
button uses a darker verdigris than the accent does, because white on the
bright shade is 3.3:1 and fails AA at 16px.

Two textures do the rest: a generated grain at 3.5% over everything, since
perfectly flat fills are the tell of a template, and a single meander — the
Greek key — as the divider in the hero. One ornament, used once. The discipline
is the point; this style goes kitsch the moment there are laurel wreaths too.

### Look and hierarchy

Eight sections once shared one `.card` recipe and one heading size, so the
session timer had no more presence than the export buttons and the eye had
nowhere to land. Surfaces now come in three weights: `.card-hero` for the walk
itself, `.card` for the things you read beside it, `.card-quiet` for
housekeeping. Export and reset live behind a disclosure. Section headings are
deliberately small and lettered so nothing competes with the clock.

The tiers carry an identity rather than being numbers on a bar. Each stage —
Wanderer, Traveller, Wayfarer, Pathfinder, Master of the Road — has a name and
its own accent, written to the root element by `useTierTheme`, so every
`var(--accent)` in the app moves together the moment a tier is reached. The
palette walks from first light to a night sky over the course of the journey.

`Trail` replaces the flat bar: ground covered behind the walker, the way ahead
still dashed, and a cairn or a tier marker standing at the next mark.

### Waypoints

The tiers — 20, 100, 1000, 10000 — frame the whole journey but make a poor
progress bar: between 100 and 1000, an hour a day moves it by a tenth of a
percent, so it reads as motionless for years. `src/journey.ts` puts waypoints
between them, spaced 5 leagues apart at the start and widening to 1000, and
the bar fills toward the next one. Every tier is also a waypoint, so the bar
lands exactly on a tier rather than sailing past it, and the tier stays on
screen as the larger frame.

Pace is measured over a trailing 28 days rather than a lifetime average, so a
goal picked up again after a fallow month reflects this month. Arrival
estimates past a decade are withheld rather than shown as a date in the 2050s.

### Data layout

```
users/{uid}                              currentGoalId, schemaVersion
users/{uid}/goals/{goalId}               name, totalTime, created
users/{uid}/goals/{goalId}/logs/{logId}  timestamp, durationSec, note
```

Logs are a subcollection rather than an array on the user document. As one
array they were rewritten in full on every change, so stopping a session
re-uploaded the entire history, a device returning from offline could flush a
stale whole-array write over anything logged elsewhere meanwhile, and the
1 MiB document ceiling sat a few thousand logs away. Appending is now one
small write plus an `increment()` on the goal's running total.

`totalTime` is denormalised onto the goal so the progress bar and goal list
never need the logs. Every write that touches a log moves it by exactly the
difference, keeping it equal to the sum of the logs. Only the open goal's logs
are fetched; export is the one place that needs them all, and it asks for them
on demand.

A user still on the old shape is migrated once, on first load. Log document
ids are derived from the entry rather than random, so a run interrupted
halfway can simply be repeated; the legacy array is deleted only after
everything else has committed.

### Pomodoro and leagues

A pomodoro is a way of walking, so a completed focus block is logged as leagues
walked — it asks what you accomplished exactly as the session timer does. Ending
a block early logs only the minutes actually spent in it.

Two things it deliberately will not do. It never logs while the session timer is
running, because that clock is already measuring the same minutes and the hour
would be counted twice. And a block that expires while the app is closed is not
logged at all: the app cannot know you kept working through it, and inventing
time you never confirmed is worse than missing it — add it by hand instead.

The behaviour can be turned off entirely in the pomodoro's settings.

### Offline and sync

Goals are written to `localStorage` synchronously and mirrored to Firestore in
the background; nothing in the UI waits on the network. Firestore's
IndexedDB cache queues writes made offline and flushes them on reconnect, and
`onSnapshot` subscriptions keep a phone and a desktop in step. Signing in
on a device that already has local-only history uploads it rather than
replacing it with an empty cloud document.

### PWA

`vite-plugin-pwa` generates the manifest and a Workbox service worker that
precaches the build. Updates are opt-in: a new build shows a "Reload" prompt
instead of swapping itself in mid-session. `vite.config.ts` splits React and
Firebase into their own chunks so a small app change does not force every
installed client to re-download the whole bundle.

Icons are generated from `public/favicon.svg` — `pwa-*` for general use and
`maskable-*` sized to Android's 80% safe zone.
