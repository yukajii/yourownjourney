import type { Messages } from "./types";

/**
 * The source of truth. Every other locale is translated from this file, and a
 * key missing elsewhere falls back to it.
 *
 * Keys are namespaced by where they appear. Anything with a {count} carries
 * plural forms rather than a bare string.
 */
export const en: Messages = {
  /* ── landing ─────────────────────────────────────────────── */
  "landing.eyebrow": "A focus tracker shaped like the Odyssey",
  "landing.headline1": "Ten years is a long voyage.",
  "landing.headline2": "Count it in leagues.",
  "landing.body":
    "A {league} is the distance you can walk in one focused hour — and, as it happens, a measure used at sea. Start the clock, do the work, write a line about what you did. Every hour puts your goal a little further along the chart.",
  "landing.league": "league",
  "landing.footer": "No account needed to try it. Works offline. Your notes stay yours —",
  "landing.footerExport": " export them any time.",

  /* ── stations ────────────────────────────────────────────── */
  "station.troy": "Troy",
  "station.troy.epithet": "The sails are set",
  "station.cyclops": "The Cyclops' Shore",
  "station.cyclops.epithet": "Cunning beats strength",
  "station.circe": "Circe's Island",
  "station.circe.epithet": "A year can vanish here",
  "station.sirens": "The Sirens' Strait",
  "station.sirens.epithet": "You hear the song and sail on",
  "station.ithaca": "Ithaca",
  "station.ithaca.epithet": "The long way home",

  /* ── session ─────────────────────────────────────────────── */
  "session.noGoal": "No goal selected",
  "session.start": "Start walking",
  "session.stop": "Stop",
  "session.needGoal": "Create a goal to start walking.",
  "session.complete": "Session complete",
  "session.notePrompt": "{duration} — what did you accomplish?",
  "session.noteOptional": "Optional",
  "session.logIt": "Log it",

  /* ── progress ────────────────────────────────────────────── */
  "progress.walked": "Leagues walked",
  "progress.toNextTier": "{n} to the next station",
  "progress.toNextWaypoint": "{n} to the next waypoint",
  "progress.around": "around {date}",
  "progress.pace": "{n} Leagues a week",
  "progress.tierBy": "{tier} Leagues by {date}",

  /* ── journey ─────────────────────────────────────────────── */
  "journey.title": "Journey",
  "journey.streak": {
    one: "{count} day streak",
    other: "{count} day streak",
  },
  "journey.noStreak": "No streak yet",
  "journey.daysIn": {
    one: "{count} day in {weeks} weeks",
    other: "{count} days in {weeks} weeks",
  },
  "journey.less": "Less",
  "journey.more": "More",
  "journey.nothingWalked": "nothing walked",

  /* ── pomodoro ────────────────────────────────────────────── */
  "pomodoro.title": "Pomodoro",
  "pomodoro.idle": "Ready when you are",
  "pomodoro.focusing": "Focusing",
  "pomodoro.onBreak": "On a break",
  "pomodoro.startFocus": "Start Focus",
  "pomodoro.takeBreak": "Take Break",
  "pomodoro.backToWork": "Back to Work",
  "pomodoro.stop": "Stop",
  "pomodoro.focusLabel": "Focus",
  "pomodoro.breakLabel": "Break",
  "pomodoro.minutes": "min",
  "pomodoro.countAsLeagues": "Count focus blocks as Leagues walked",
  "pomodoro.countAsLeaguesHelp":
    "Skipped while the session timer is running, so an hour is never counted twice.",
  "pomodoro.blockComplete": "Focus block complete",
  "pomodoro.settings": "Pomodoro settings",

  /* ── logs ────────────────────────────────────────────────── */
  "logs.title": "Logs",
  "logs.total": "{n} L total",
  "logs.add": "Add",
  "logs.empty": "No logs yet. Put out to sea.",
  "logs.editAria": "Edit entry from {when}",
  "logs.deleteAria": "Delete entry from {when}",
  "logs.deleteTitle": "Delete this entry?",
  "logs.deleteBody":
    "{duration} walked on {when} will be removed and subtracted from your total.",
  "logs.delete": "Delete",

  /* ── log editor ──────────────────────────────────────────── */
  "editor.addTitle": "Add walked time",
  "editor.editTitle": "Edit entry",
  "editor.addHint": "For a stretch of focused work you did not time.",
  "editor.when": "When",
  "editor.howLong": "How long",
  "editor.hours": "Hours",
  "editor.minutes": "Minutes",
  "editor.h": "h",
  "editor.m": "m",
  "editor.accomplished": "What did you accomplish?",
  "editor.future": "You cannot log a crossing you have not made yet.",
  "editor.setDuration": "Set a duration to save.",
  "editor.save": "Save",
  "editor.add": "Add",

  /* ── goals ───────────────────────────────────────────────── */
  "goals.title": "Goals",
  "goals.empty": "No goals yet — name one!",
  "goals.new": "New",
  "goals.rename": "Rename",
  "goals.delete": "Delete",
  "goals.current": "Current goal",
  "goals.newTitle": "New goal",
  "goals.newLabel": "What are you sailing toward?",
  "goals.newPlaceholder": "e.g. Learn Japanese",
  "goals.create": "Create",
  "goals.renameTitle": "Rename goal",
  "goals.deleteTitle": "Delete “{name}”?",
  "goals.deleteBody": "Its logged time and notes go with it. This cannot be undone.",

  /* ── reflection ──────────────────────────────────────────── */
  "reflection.title": "Reflection",
  "reflection.pitch": "Read the last 30 days of your own notes back to you.",
  "reflection.privacy":
    "Your notes for this period are sent to OpenAI to write it. Nothing is sent until you ask.",
  "reflection.run": "Reflect on the month",
  "reflection.again": "Reflect again",
  "reflection.busy": "Reading your notes…",
  "reflection.noNotes":
    "None of this period's sessions carry a note. The reflection reads your notes back to you, so there is nothing yet to read.",
  "reflection.tooFew": {
    one: "Only {count} of this period's sessions carries a note. Write a few more and there will be a thread worth pulling.",
    other:
      "Only {count} of this period's sessions carry a note. Write a few more and there will be a thread worth pulling.",
  },
  "reflection.failed": "The reflection could not be written.",
  "reflection.signIn": "Sign in to request a reflection.",
  "reflection.notConfigured": "Reflections are not set up for this build.",
  "reflection.malformed": "The reflection came back in a shape we could not read.",

  /* ── data ────────────────────────────────────────────────── */
  "data.title": "Your data",
  "data.body": "Every goal, every logged hour and every note — yours to keep.",
  "data.gathering": "Gathering…",
  "data.failed":
    "Could not gather your logs. If you are offline, try again once connected.",
  "data.settings": "Data & settings",
  "reset.button": "Reset everything",
  "reset.title": "Delete everything?",
  "reset.body": {
    one: "Your {count} goal, its logged time and every note will be erased here and in the cloud. This cannot be undone.",
    other:
      "All {count} goals, their logged time and every note will be erased here and in the cloud. This cannot be undone.",
  },
  "reset.confirm": "Erase it all",

  /* ── auth, install, update ───────────────────────────────── */
  "auth.signIn": "Sign in",
  "auth.signOut": "Sign out",
  "auth.failed": "Sign-in failed. Please try again.",
  "auth.offline": "You appear to be offline. Your progress is still saved on this device.",
  "install.button": "Install",
  "install.title": "Add to Home Screen",
  "install.step1": "Tap the Share button in Safari's toolbar.",
  "install.step2": "Choose “Add to Home Screen”.",
  "install.step3": "Tap “Add” — Leagues then opens like any other app.",
  "install.gotIt": "Got it",
  "update.ready": "A new version of Leagues is ready.",
  "update.offlineReady": "Leagues is installed and works offline.",
  "update.reload": "Reload",
  "update.dismiss": "Dismiss",

  /* ── common ──────────────────────────────────────────────── */
  "common.cancel": "Cancel",
  "common.save": "Save",
  "common.ok": "OK",
  "common.language": "Language",
  "common.languageAuto": "Match my device",

  /* ── mentor ──────────────────────────────────────────────── */
  "mentor.noGoal": "Every voyage needs a destination. Name the harbour you are sailing for.",
  "mentor.neverWalked": "A league is one focused hour. You are one hour from your first.",
  "mentor.longSession":
    "You have rowed over ninety minutes without pause. Rest is not a retreat — it is what makes tomorrow possible.",
  "mentor.almostThere": "{time} more and you reach {next} Leagues. Stay with it.",
  "mentor.walking": "You are at sea now. Nothing else needs your attention.",
  "mentor.walking2": "The hour you are in is the only one you command.",
  "mentor.longAbsence":
    "{days} days among the Lotus Eaters. The sea did not go anywhere, and neither did the {leagues} Leagues already behind you.",
  "mentor.weekAbsence": "A week becalmed is not a wreck. Put out again today and the wind is yours.",
  "mentor.shortAbsence":
    "{days} days since your last league. The shortest way back to sea is a single hour.",
  "mentor.nearTier": "{n} Leagues from landfall at {next}. That one is worth the oars.",
  "mentor.nearWaypoint": "{n} Leagues to {next}. One good crossing away.",
  "mentor.longStreak":
    "{days} days without breaking stride. This is what mastery looks like from the inside — unremarkable, and daily.",
  "mentor.streak": "{days} days in a row. Do not break the chain today.",
  "mentor.keepStreak": "Your {days}-day streak is intact. One hour keeps it so.",
  "mentor.walkedToday": "Today is already sailed. Anything further is surplus.",
  "mentor.pace": "You are making {n} Leagues a week. Steady beats sudden.",
  "mentor.evergreen1": "Focus not on how far you have to go, but on the hour in front of you.",
  "mentor.evergreen2": "Greatness is merely good practice, repeated past the point of novelty.",
  "mentor.evergreen3": "You cannot cross a thousand leagues today. You can cross one.",
  "mentor.evergreen4": "Progress is the simple thing, done again.",
  "mentor.minute": "a minute",
  "mentor.minutes": "{n} minutes",
  "mentor.anHour": "an hour or so",

  /* ── intro tour ──────────────────────────────────────────── */
  "tour.next": "Next",
  "tour.back": "Back",
  "tour.done": "Cast off",
  "tour.welcome":
    "<b>Welcome, seeker of mastery.</b><br>A <em>league</em> is three nautical miles — and here, one hour of focused work.<br>Your voyage begins now.",
  "tour.goal":
    "Name the harbour you are sailing for. Every voyage needs a destination, and this is yours.",
  "tour.timer":
    "Start the clock to make way. Each hour at the oars is one league nearer.",
  "tour.pomodoro":
    "Pomodoro keeps the stroke steady — effort balanced with rest, the way a crew that means to arrive actually rows.",
  "tour.logs":
    "Your logbook. Write a line after each crossing; the reflection reads them back to you later.",
  "tour.mentor": "I keep watch here. Ask me anytime for calm, practical counsel.",
};
