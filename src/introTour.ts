// ──────────────────────────────────────────────────────────
//  Intro.js first-run tour with mentor portrait in tooltip
// ──────────────────────────────────────────────────────────
import introJs from "intro.js";
import "intro.js/introjs.css";
import "./introjs-dark.css";          // your dark skin
import "./guruTooltip.css";           // layout for avatar + text

// local asset → Vite gives a hashed URL at runtime
import mentorImg from "./assets/stoic-mentor.png";

/* ---------- tooltip HTML template ---------- */
const tpl = /* html */ `
  <div class="introjs-tooltip guru-tooltip">
    <a class="introjs-skipbutton introjs-exitbutton" role="button" aria-label="Close">×</a>

    <h4 class="introjs-tooltip-title"></h4>

    <div class="mentor-row">
      <img src="${mentorImg}" class="mentor-avatar" />
      <div class="introjs-tooltiptext"></div>
    </div>

    <div class="introjs-progress"></div>
    <div class="introjs-tooltipbuttons"></div>
  </div>
`;

/* ---------- helper: run only on first visit ---------- */
export const maybeRunIntroTour = (): void => {
  if (localStorage.getItem("leagues_seenTour") === "1") return;

  const intro = introJs();

  intro.setOptions({
    template      : tpl,              // <— custom tooltip markup
    tooltipClass  : "guru-tooltip",   // for extra CSS rules
    nextLabel     : "Next ▸",
    prevLabel     : "◂ Back",
    doneLabel     : "Begin the walk",

    steps: [
      {
        title: "Добро пожаловать!",
        intro:
          "Greetings, <em>Student</em>. I am your guide. Together we will walk Leagues toward mastery."
      },
      { element: "#goal-manager",     intro: "Choose the mountain you will climb — create a Goal." },
      { element: "#session-timer",    intro: "Focus one League at a time. Press <strong>Start</strong>." },
      { element: "#pomodoro-section", intro: "Rest is part of the rhythm. 25 min focus → 5 min pause." },
      { element: "#leagues-progress", intro: "Observe how far you’ve travelled. Every pulse is progress." },
      { element: "#logs-section",     intro: "Write short notes after each League. Reflection sharpens learning." },
      { element: "#stoic-mentor",     intro: "I dwell here. Tap me anytime for calm, practical counsel." }
    ]
  } as any);          // cast avoids outdated @types/intro.js complaints

  /* hide bottom-right widget while tour is active */
  const addFlag    = () => { document.body.classList.add("tour-active"); return true; };
  const removeFlag = () =>   document.body.classList.remove("tour-active");

  intro.onbeforechange(addFlag);
  intro.onafterchange (addFlag);
  intro.oncomplete    (removeFlag);
  intro.onexit        (removeFlag);

  intro.start();
};
