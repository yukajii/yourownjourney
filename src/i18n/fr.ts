import type { Messages } from "./types";

/**
 * French. Two plural forms, but the boundary differs from English: 0 and 1 are
 * both singular, so "0 jour" and not "0 jours". Intl.PluralRules knows this;
 * a count === 1 check would not.
 *
 * The mentor speaks on «tu» — a guide addressing a student directly.
 */
export const fr: Messages = {
  /* ── landing ─────────────────────────────────────────────── */
  "landing.eyebrow": "Un compteur de concentration bâti comme l'Odyssée",
  "landing.headline1": "Dix ans, c'est une longue traversée.",
  "landing.headline2": "Compte-la en lieues.",
  "landing.body":
    "Une {league} est la distance parcourue en une heure de travail concentré — et c'est aussi une vieille mesure marine. Lance le chronomètre, travaille, écris une ligne sur ce que tu as fait. Chaque heure avance ton but sur la carte.",
  "landing.league": "lieue",
  "landing.footer": "Aucun compte requis. Fonctionne hors ligne. Tes notes restent les tiennes —",
  "landing.footerExport": " exporte-les quand tu veux.",

  /* ── stations ────────────────────────────────────────────── */
  "station.troy": "Troie",
  "station.troy.epithet": "Les voiles sont hissées",
  "station.cyclops": "Le rivage du Cyclope",
  "station.cyclops.epithet": "La ruse vaut mieux que la force",
  "station.circe": "L'île de Circé",
  "station.circe.epithet": "Une année peut s'y perdre",
  "station.sirens": "Le détroit des Sirènes",
  "station.sirens.epithet": "Tu entends le chant et tu passes",
  "station.ithaca": "Ithaque",
  "station.ithaca.epithet": "Le long chemin du retour",

  /* ── session ─────────────────────────────────────────────── */
  "session.noGoal": "Aucun but choisi",
  "session.start": "Appareiller",
  "session.stop": "Arrêter",
  "session.needGoal": "Crée un but pour prendre la mer.",
  "session.complete": "Traversée terminée",
  "session.notePrompt": "{duration} — qu'as-tu accompli ?",
  "session.noteOptional": "Facultatif",
  "session.logIt": "Enregistrer",

  /* ── progress ────────────────────────────────────────────── */
  "progress.walked": "lieues parcourues",
  "progress.toNextTier": "{n} avant la prochaine escale",
  "progress.toNextWaypoint": "{n} avant le prochain repère",
  "progress.around": "vers le {date}",
  "progress.pace": "{n} lieues par semaine",
  "progress.tierBy": "{tier} lieues d'ici {date}",

  /* ── journey ─────────────────────────────────────────────── */
  "journey.title": "Traversée",
  "journey.streak": {
    one: "{count} jour d'affilée",
    other: "{count} jours d'affilée",
  },
  "journey.noStreak": "Pas encore de série",
  "journey.daysIn": {
    one: "{count} jour en {weeks} semaines",
    other: "{count} jours en {weeks} semaines",
  },
  "journey.less": "Moins",
  "journey.more": "Plus",
  "journey.nothingWalked": "rien de parcouru",

  /* ── pomodoro ────────────────────────────────────────────── */
  "pomodoro.title": "Pomodoro",
  "pomodoro.idle": "Prêt quand tu l'es",
  "pomodoro.focusing": "Concentration",
  "pomodoro.onBreak": "En pause",
  "pomodoro.startFocus": "Démarrer",
  "pomodoro.takeBreak": "Faire une pause",
  "pomodoro.backToWork": "Reprendre",
  "pomodoro.stop": "Arrêter",
  "pomodoro.focusLabel": "Travail",
  "pomodoro.breakLabel": "Pause",
  "pomodoro.minutes": "min",
  "pomodoro.countAsLeagues": "Compter les blocs de concentration en lieues",
  "pomodoro.countAsLeaguesHelp":
    "Ignoré tant que le chronomètre de séance tourne, pour qu'une heure ne compte jamais deux fois.",
  "pomodoro.blockComplete": "Bloc de concentration terminé",
  "pomodoro.settings": "Réglages du pomodoro",

  /* ── logs ────────────────────────────────────────────────── */
  "logs.title": "Journal de bord",
  "logs.total": "{n} L au total",
  "logs.add": "Ajouter",
  "logs.empty": "Pas encore d'entrées. Prends la mer.",
  "logs.editAria": "Modifier l'entrée du {when}",
  "logs.deleteAria": "Supprimer l'entrée du {when}",
  "logs.deleteTitle": "Supprimer cette entrée ?",
  "logs.deleteBody":
    "{duration} parcourues le {when} seront retirées et déduites de ton total.",
  "logs.delete": "Supprimer",

  /* ── log editor ──────────────────────────────────────────── */
  "editor.addTitle": "Ajouter du temps parcouru",
  "editor.editTitle": "Modifier l'entrée",
  "editor.addHint": "Pour un travail concentré que tu n'as pas chronométré.",
  "editor.when": "Quand",
  "editor.howLong": "Combien de temps",
  "editor.hours": "Heures",
  "editor.minutes": "Minutes",
  "editor.h": "h",
  "editor.m": "min",
  "editor.accomplished": "Qu'as-tu accompli ?",
  "editor.future": "Impossible d'enregistrer une traversée que tu n'as pas encore faite.",
  "editor.setDuration": "Indique une durée pour enregistrer.",
  "editor.save": "Enregistrer",
  "editor.add": "Ajouter",

  /* ── goals ───────────────────────────────────────────────── */
  "goals.title": "Buts",
  "goals.empty": "Aucun but pour l'instant — nomme le premier !",
  "goals.new": "Nouveau",
  "goals.rename": "Renommer",
  "goals.delete": "Supprimer",
  "goals.current": "But actuel",
  "goals.newTitle": "Nouveau but",
  "goals.newLabel": "Vers quel port fais-tu route ?",
  "goals.newPlaceholder": "p. ex. apprendre le japonais",
  "goals.create": "Créer",
  "goals.renameTitle": "Renommer le but",
  "goals.deleteTitle": "Supprimer « {name} » ?",
  "goals.deleteBody":
    "Son temps enregistré et toutes ses notes disparaîtront avec lui. C'est irréversible.",

  /* ── reflection ──────────────────────────────────────────── */
  "reflection.title": "Retour",
  "reflection.pitch": "Relis tes notes des 30 derniers jours.",
  "reflection.privacy":
    "Tes notes de cette période sont envoyées à OpenAI pour l'écrire. Rien n'est envoyé avant que tu le demandes.",
  "reflection.run": "Revenir sur le mois",
  "reflection.again": "Refaire le point",
  "reflection.busy": "Lecture de tes notes…",
  "reflection.noNotes":
    "Aucune séance de cette période ne porte de note. Le retour te relit tes notes : il n'y a donc rien à lire pour l'instant.",
  "reflection.tooFew": {
    one: "Seule {count} séance de cette période porte une note. Écris-en quelques-unes de plus et il y aura un fil à tirer.",
    other:
      "Seules {count} séances de cette période portent une note. Écris-en quelques-unes de plus et il y aura un fil à tirer.",
  },
  "reflection.failed": "Le retour n'a pas pu être écrit.",
  "reflection.signIn": "Connecte-toi pour demander un retour.",
  "reflection.notConfigured": "Le retour n'est pas configuré dans cette version.",
  "reflection.malformed": "La réponse est revenue sous une forme illisible.",

  /* ── data ────────────────────────────────────────────────── */
  "data.title": "Tes données",
  "data.body": "Chaque but, chaque heure enregistrée, chaque note — à toi de les garder.",
  "data.gathering": "Rassemblement…",
  "data.failed":
    "Impossible de rassembler tes entrées. Si tu es hors ligne, réessaie une fois connecté.",
  "data.settings": "Données et réglages",
  "reset.button": "Tout réinitialiser",
  "reset.title": "Tout supprimer ?",
  "reset.body": {
    one: "Ton {count} but, son temps enregistré et chaque note seront effacés ici et dans le cloud. C'est irréversible.",
    other:
      "Tes {count} buts, leur temps enregistré et chaque note seront effacés ici et dans le cloud. C'est irréversible.",
  },
  "reset.confirm": "Tout effacer",

  /* ── auth, install, update ───────────────────────────────── */
  "auth.signIn": "Se connecter",
  "auth.signOut": "Se déconnecter",
  "auth.failed": "Échec de la connexion. Réessaie.",
  "auth.offline":
    "Tu sembles hors ligne. Ta progression reste enregistrée sur cet appareil.",
  "install.button": "Installer",
  "install.title": "Sur l'écran d'accueil",
  "install.step1": "Touche « Partager » dans la barre de Safari.",
  "install.step2": "Choisis « Sur l'écran d'accueil ».",
  "install.step3": "Touche « Ajouter » — Leagues s'ouvre ensuite comme n'importe quelle app.",
  "install.gotIt": "Compris",
  "update.ready": "Une nouvelle version de Leagues est prête.",
  "update.offlineReady": "Leagues est installé et fonctionne hors ligne.",
  "update.reload": "Recharger",
  "update.dismiss": "Fermer",

  /* ── common ──────────────────────────────────────────────── */
  "common.cancel": "Annuler",
  "common.save": "Enregistrer",
  "common.ok": "OK",
  "common.language": "Langue",
  "common.languageAuto": "Comme mon appareil",

  /* ── mentor ──────────────────────────────────────────────── */
  "mentor.noGoal": "Toute traversée a une destination. Nomme le port vers lequel tu fais route.",
  "mentor.neverWalked": "Une lieue, c'est une heure concentrée. Tu es à une heure de la première.",
  "mentor.longSession":
    "Tu rames depuis plus de quatre-vingt-dix minutes sans pause. Le repos n'est pas une retraite : c'est ce qui rend demain possible.",
  "mentor.almostThere": "Encore {time} et tu atteins {next} lieues. Tiens bon.",
  "mentor.walking": "Tu es en mer. Rien d'autre n'a besoin de ton attention.",
  "mentor.walking2": "L'heure où tu te trouves est la seule que tu commandes.",
  "mentor.longAbsence":
    "{days} jours chez les Lotophages. La mer n'a bougé nulle part, ni les {leagues} lieues déjà derrière toi.",
  "mentor.weekAbsence":
    "Une semaine encalminé n'est pas un naufrage. Reprends la mer aujourd'hui et le vent est à toi.",
  "mentor.shortAbsence":
    "{days} jours depuis ta dernière lieue. Le plus court chemin vers le large tient en une heure.",
  "mentor.nearTier": "{n} lieues avant d'aborder à {next}. Celle-là vaut les rames.",
  "mentor.nearWaypoint": "{n} lieues avant {next}. Une bonne traversée.",
  "mentor.longStreak":
    "{days} jours sans rompre la cadence. Voilà à quoi ressemble la maîtrise vue de l'intérieur : ordinaire, et quotidienne.",
  "mentor.streak": "{days} jours d'affilée. Ne romps pas la chaîne aujourd'hui.",
  "mentor.keepStreak": "Ta série de {days} jours tient. Une heure suffit à la garder.",
  "mentor.walkedToday": "La journée est déjà faite. Tout le reste est en surplus.",
  "mentor.pace": "Tu tiens {n} lieues par semaine. Régulier vaut mieux que soudain.",
  "mentor.evergreen1":
    "Ne pense pas au chemin qui reste, mais à l'heure qui est devant toi.",
  "mentor.evergreen2":
    "La grandeur n'est qu'une bonne pratique, répétée bien après qu'elle a cessé d'être neuve.",
  "mentor.evergreen3": "Mille lieues, pas aujourd'hui. Une, oui.",
  "mentor.evergreen4": "Le progrès, c'est la chose simple, refaite.",
  "mentor.minute": "une minute",
  "mentor.minutes": "{n} minutes",
  "mentor.anHour": "une heure environ",

  /* ── intro tour ──────────────────────────────────────────── */
  "tour.next": "Suivant",
  "tour.back": "Retour",
  "tour.done": "Larguer les amarres",
  "tour.welcome":
    "<b>Bienvenue, toi qui cherches la maîtrise.</b><br>Une <em>lieue</em> vaut trois milles marins — et ici, une heure de travail concentré.<br>Ta traversée commence.",
  "tour.goal":
    "Nomme le port vers lequel tu fais route. Toute traversée a une destination : voici la tienne.",
  "tour.timer":
    "Lance le chronomètre et fais route. Chaque heure aux rames vaut une lieue.",
  "tour.pomodoro":
    "Le pomodoro tient la cadence — l'effort en équilibre avec le repos, comme rame un équipage qui compte arriver.",
  "tour.logs":
    "Ton journal de bord. Écris une ligne après chaque traversée ; le retour te les relira plus tard.",
  "tour.mentor": "Je monte la garde ici. Demande-moi à tout moment un conseil calme et utile.",
};
