import type { Messages } from "./types";

/**
 * German. Two plural forms, and the mentor speaks on «du» — a Stoic guide
 * addressing a student, not a bank.
 *
 * Compounds run long: "Fokusblöcke als gelaufene Leagues zählen" is already
 * near the width the settings row allows, so labels are kept as short as the
 * meaning permits.
 */
export const de: Messages = {
  /* ── landing ─────────────────────────────────────────────── */
  "landing.eyebrow": "Ein Fokus-Tracker nach dem Vorbild der Odyssee",
  "landing.headline1": "Zehn Jahre sind eine lange Fahrt.",
  "landing.headline2": "Zähle sie in Leagues.",
  "landing.body":
    "Eine {league} ist die Strecke einer konzentrierten Stunde — und zugleich ein altes Seemaß. Uhr starten, arbeiten, eine Zeile über das Getane schreiben. Jede Stunde bringt dein Ziel ein Stück weiter auf der Karte.",
  "landing.league": "League",
  "landing.footer": "Kein Konto nötig. Funktioniert offline. Deine Notizen bleiben deine —",
  "landing.footerExport": " exportiere sie jederzeit.",

  /* ── stations ────────────────────────────────────────────── */
  "station.troy": "Troja",
  "station.troy.epithet": "Die Segel stehen",
  "station.cyclops": "Die Küste des Kyklopen",
  "station.cyclops.epithet": "List schlägt Stärke",
  "station.circe": "Kirkes Insel",
  "station.circe.epithet": "Hier kann ein Jahr verschwinden",
  "station.sirens": "Die Meerenge der Sirenen",
  "station.sirens.epithet": "Du hörst den Gesang und fährst weiter",
  "station.ithaca": "Ithaka",
  "station.ithaca.epithet": "Der lange Weg nach Hause",

  /* ── session ─────────────────────────────────────────────── */
  "session.noGoal": "Kein Ziel gewählt",
  "session.start": "Ablegen",
  "session.stop": "Stopp",
  "session.needGoal": "Lege ein Ziel an, um loszufahren.",
  "session.complete": "Fahrt beendet",
  "session.notePrompt": "{duration} — was hast du geschafft?",
  "session.noteOptional": "Optional",
  "session.logIt": "Eintragen",

  /* ── progress ────────────────────────────────────────────── */
  "progress.walked": "Leagues zurückgelegt",
  "progress.toNextTier": "{n} bis zur nächsten Station",
  "progress.toNextWaypoint": "{n} bis zur nächsten Marke",
  "progress.around": "etwa {date}",
  "progress.pace": "{n} Leagues pro Woche",
  "progress.tierBy": "{tier} Leagues bis {date}",

  /* ── journey ─────────────────────────────────────────────── */
  "journey.title": "Fahrt",
  "journey.streak": {
    one: "{count} Tag in Folge",
    other: "{count} Tage in Folge",
  },
  "journey.noStreak": "Noch keine Serie",
  "journey.daysIn": {
    one: "{count} Tag in {weeks} Wochen",
    other: "{count} Tage in {weeks} Wochen",
  },
  "journey.less": "Weniger",
  "journey.more": "Mehr",
  "journey.nothingWalked": "nichts zurückgelegt",

  /* ── pomodoro ────────────────────────────────────────────── */
  "pomodoro.title": "Pomodoro",
  "pomodoro.idle": "Bereit, wenn du es bist",
  "pomodoro.focusing": "Konzentriert",
  "pomodoro.onBreak": "Pause",
  "pomodoro.startFocus": "Fokus starten",
  "pomodoro.takeBreak": "Pause machen",
  "pomodoro.backToWork": "Weitermachen",
  "pomodoro.stop": "Beenden",
  "pomodoro.focusLabel": "Fokus",
  "pomodoro.breakLabel": "Pause",
  "pomodoro.minutes": "Min.",
  "pomodoro.countAsLeagues": "Fokusblöcke als Leagues zählen",
  "pomodoro.countAsLeaguesHelp":
    "Wird übersprungen, solange die Sitzungsuhr läuft — so zählt eine Stunde nie doppelt.",
  "pomodoro.blockComplete": "Fokusblock beendet",
  "pomodoro.settings": "Pomodoro-Einstellungen",

  /* ── logs ────────────────────────────────────────────────── */
  "logs.title": "Logbuch",
  "logs.total": "{n} L gesamt",
  "logs.add": "Hinzufügen",
  "logs.empty": "Noch keine Einträge. Lauf aus.",
  "logs.editAria": "Eintrag vom {when} bearbeiten",
  "logs.deleteAria": "Eintrag vom {when} löschen",
  "logs.deleteTitle": "Diesen Eintrag löschen?",
  "logs.deleteBody":
    "{duration} vom {when} werden entfernt und von deiner Summe abgezogen.",
  "logs.delete": "Löschen",

  /* ── log editor ──────────────────────────────────────────── */
  "editor.addTitle": "Zeit nachtragen",
  "editor.editTitle": "Eintrag bearbeiten",
  "editor.addHint": "Für konzentrierte Arbeit, die du nicht gestoppt hast.",
  "editor.when": "Wann",
  "editor.howLong": "Wie lange",
  "editor.hours": "Stunden",
  "editor.minutes": "Minuten",
  "editor.h": "Std.",
  "editor.m": "Min.",
  "editor.accomplished": "Was hast du geschafft?",
  "editor.future": "Eine Überfahrt, die noch nicht stattfand, lässt sich nicht eintragen.",
  "editor.setDuration": "Dauer angeben, um zu speichern.",
  "editor.save": "Speichern",
  "editor.add": "Hinzufügen",

  /* ── goals ───────────────────────────────────────────────── */
  "goals.title": "Ziele",
  "goals.empty": "Noch keine Ziele — benenne eines!",
  "goals.new": "Neu",
  "goals.rename": "Umbenennen",
  "goals.delete": "Löschen",
  "goals.current": "Aktuelles Ziel",
  "goals.newTitle": "Neues Ziel",
  "goals.newLabel": "Welchen Hafen steuerst du an?",
  "goals.newPlaceholder": "z. B. Japanisch lernen",
  "goals.create": "Anlegen",
  "goals.renameTitle": "Ziel umbenennen",
  "goals.deleteTitle": "„{name}“ löschen?",
  "goals.deleteBody":
    "Die eingetragene Zeit und alle Notizen gehen mit. Das lässt sich nicht rückgängig machen.",

  /* ── reflection ──────────────────────────────────────────── */
  "reflection.title": "Rückschau",
  "reflection.pitch": "Lies dir deine Notizen der letzten 30 Tage vorlesen.",
  "reflection.privacy":
    "Deine Notizen dieses Zeitraums gehen dafür an OpenAI. Nichts wird gesendet, bis du es verlangst.",
  "reflection.run": "Auf den Monat zurückblicken",
  "reflection.again": "Erneut zurückblicken",
  "reflection.busy": "Lese deine Notizen…",
  "reflection.noNotes":
    "Keine Sitzung dieses Zeitraums trägt eine Notiz. Die Rückschau liest deine Notizen zurück — es gibt also noch nichts zu lesen.",
  "reflection.tooFew": {
    one: "Nur {count} Sitzung dieses Zeitraums trägt eine Notiz. Schreib ein paar mehr, dann gibt es einen Faden, an dem sich ziehen lässt.",
    other:
      "Nur {count} Sitzungen dieses Zeitraums tragen eine Notiz. Schreib ein paar mehr, dann gibt es einen Faden, an dem sich ziehen lässt.",
  },
  "reflection.failed": "Die Rückschau konnte nicht geschrieben werden.",
  "reflection.signIn": "Melde dich an, um eine Rückschau anzufordern.",
  "reflection.notConfigured": "Rückschau ist in diesem Build nicht eingerichtet.",
  "reflection.malformed": "Die Antwort kam in einer Form zurück, die sich nicht lesen lässt.",

  /* ── data ────────────────────────────────────────────────── */
  "data.title": "Deine Daten",
  "data.body": "Jedes Ziel, jede eingetragene Stunde, jede Notiz — gehören dir.",
  "data.gathering": "Sammle…",
  "data.failed":
    "Die Einträge ließen sich nicht sammeln. Wenn du offline bist, versuch es später erneut.",
  "data.settings": "Daten & Einstellungen",
  "reset.button": "Alles zurücksetzen",
  "reset.title": "Alles löschen?",
  "reset.body": {
    one: "Dein {count} Ziel, seine Zeit und jede Notiz werden hier und in der Cloud gelöscht. Das lässt sich nicht rückgängig machen.",
    other:
      "Alle {count} Ziele, ihre Zeit und jede Notiz werden hier und in der Cloud gelöscht. Das lässt sich nicht rückgängig machen.",
  },
  "reset.confirm": "Alles löschen",

  /* ── auth, install, update ───────────────────────────────── */
  "auth.signIn": "Anmelden",
  "auth.signOut": "Abmelden",
  "auth.failed": "Anmeldung fehlgeschlagen. Bitte versuch es erneut.",
  "auth.offline": "Du scheinst offline zu sein. Dein Fortschritt ist auf diesem Gerät gesichert.",
  "install.button": "Installieren",
  "install.title": "Zum Home-Bildschirm",
  "install.step1": "Tippe auf „Teilen“ in der Safari-Leiste.",
  "install.step2": "Wähle „Zum Home-Bildschirm“.",
  "install.step3": "Tippe auf „Hinzufügen“ — Leagues öffnet sich dann wie jede App.",
  "install.gotIt": "Verstanden",
  "update.ready": "Eine neue Version von Leagues ist bereit.",
  "update.offlineReady": "Leagues ist installiert und funktioniert offline.",
  "update.reload": "Neu laden",
  "update.dismiss": "Schließen",

  /* ── common ──────────────────────────────────────────────── */
  "common.cancel": "Abbrechen",
  "common.save": "Speichern",
  "common.ok": "OK",
  "common.language": "Sprache",
  "common.languageAuto": "Wie mein Gerät",

  /* ── mentor ──────────────────────────────────────────────── */
  "mentor.noGoal": "Jede Fahrt braucht ein Ziel. Benenne den Hafen, den du ansteuerst.",
  "mentor.neverWalked": "Eine League ist eine konzentrierte Stunde. Bis zur ersten ist es eine.",
  "mentor.longSession":
    "Du ruderst seit über neunzig Minuten ohne Pause. Rast ist kein Rückzug — sie ist das, woraus morgen entsteht.",
  "mentor.almostThere": "Noch {time}, dann sind es {next} Leagues. Bleib dran.",
  "mentor.walking": "Du bist auf See. Nichts sonst braucht deine Aufmerksamkeit.",
  "mentor.walking2": "Die Stunde, in der du bist, ist die einzige, über die du gebietest.",
  "mentor.longAbsence":
    "{days} Tage bei den Lotophagen. Das Meer ist nicht fortgezogen — und die {leagues} Leagues hinter dir auch nicht.",
  "mentor.weekAbsence":
    "Eine Woche Flaute ist kein Schiffbruch. Lauf heute wieder aus, dann gehört dir der Wind.",
  "mentor.shortAbsence":
    "{days} Tage seit deiner letzten League. Der kürzeste Weg zurück aufs Wasser ist eine einzige Stunde.",
  "mentor.nearTier": "{n} Leagues bis Land bei {next}. Dafür lohnen sich die Riemen.",
  "mentor.nearWaypoint": "{n} Leagues bis {next}. Eine gute Überfahrt.",
  "mentor.longStreak":
    "{days} Tage ohne Bruch. So sieht Meisterschaft von innen aus — unspektakulär und täglich.",
  "mentor.streak": "{days} Tage in Folge. Reiß die Kette heute nicht ab.",
  "mentor.keepStreak": "Deine Serie von {days} Tagen steht. Eine Stunde hält sie.",
  "mentor.walkedToday": "Der heutige Tag ist gefahren. Alles Weitere ist Zugabe.",
  "mentor.pace": "Du machst {n} Leagues pro Woche. Stetig schlägt plötzlich.",
  "mentor.evergreen1":
    "Denk nicht daran, wie weit es noch ist, sondern an die Stunde vor dir.",
  "mentor.evergreen2":
    "Größe ist nichts als gute Übung, wiederholt über den Punkt hinaus, an dem sie neu war.",
  "mentor.evergreen3": "Tausend Leagues schaffst du heute nicht. Eine schon.",
  "mentor.evergreen4": "Fortschritt ist das Einfache, noch einmal getan.",
  "mentor.minute": "eine Minute",
  "mentor.minutes": "{n} Minuten",
  "mentor.anHour": "etwa eine Stunde",

  /* ── intro tour ──────────────────────────────────────────── */
  "tour.next": "Weiter",
  "tour.back": "Zurück",
  "tour.done": "Leinen los",
  "tour.welcome":
    "<b>Willkommen, Suchender.</b><br>Eine <em>League</em> sind drei Seemeilen — und hier eine Stunde konzentrierter Arbeit.<br>Deine Fahrt beginnt jetzt.",
  "tour.goal":
    "Benenne den Hafen, den du ansteuerst. Jede Fahrt braucht ein Ziel, und dies ist deins.",
  "tour.timer": "Starte die Uhr und mach Fahrt. Jede Stunde an den Riemen ist eine League.",
  "tour.pomodoro":
    "Pomodoro hält den Schlag gleichmäßig — Anstrengung im Gleichgewicht mit Rast, so wie eine Mannschaft rudert, die ankommen will.",
  "tour.logs":
    "Dein Logbuch. Schreib nach jeder Überfahrt eine Zeile; die Rückschau liest sie dir später vor.",
  "tour.mentor": "Ich halte hier Wache. Frag mich jederzeit um ruhigen, brauchbaren Rat.",
};
