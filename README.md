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
| `npm run build`   | type-check, then produce `dist/`                 |
| `npm run preview` | serve the production build locally               |

## Deploying

Hosting and Firestore rules live in `firebase.json` and `firestore.rules`:

```bash
npm run build
npx firebase deploy
```

`firestore.rules` restricts `users/{uid}` to its owner. Deploy it at least
once — a project left in test mode lets any signed-in account read every
other account's goals.

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

### Offline and sync

Goals are written to `localStorage` synchronously and mirrored to Firestore in
the background; nothing in the UI waits on the network. Firestore's
IndexedDB cache queues writes made offline and flushes them on reconnect, and
an `onSnapshot` subscription keeps a phone and a desktop in step. Signing in
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
