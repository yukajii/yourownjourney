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

Hosting and Firestore rules live in `firebase.json` and `firestore.rules`:

```bash
npm run build
npx firebase deploy
```

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
