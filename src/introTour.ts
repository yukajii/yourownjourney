import introJs from 'intro.js';
import 'intro.js/introjs.css';
import './introjs-dark.css';

const TOUR_KEY = 'leagues_has_seen_intro';
let   tourRunning = false;

/* selectors that exist from first render */
const STATIC_TARGETS = [
  '#goal-manager',
  '#session-timer',
  '#pomodoro-section',
];

/* helper: wait until an element appears */
function waitFor(sel: string, timeout = 1500): Promise<void> {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    (function check() {
      if (document.querySelector(sel)) return resolve();
      if (Date.now() - t0 > timeout)    return reject();
      requestAnimationFrame(check);
    })();
  });
}

/* helper: force Intro.js to recalc positions */
function refreshSoon(tour: ReturnType<typeof introJs.tour>) {
  requestAnimationFrame(() => tour.refresh());
}

export async function maybeRunIntroTour() {
  if (tourRunning) return;
  if (localStorage.getItem(TOUR_KEY)) return;

  /* wait for initial DOM (should be immediate) */
  for (const sel of STATIC_TARGETS) await waitFor(sel, 1000);

  tourRunning = true;
  const tour = introJs.tour();

  tour.setOptions({
    tooltipClass: 'introjs-dark',
    overlayOpacity: 0.65,
    showProgress: true,
    showBullets: false,
    scrollToElement: true,       // ✦ auto-scroll enabled
    nextLabel: 'Next',
    prevLabel: 'Back',
    steps: [
      {
        intro:
          '<b>Welcome, seeker of mastery.</b><br>' +
          'A <em>league</em> is the distance a person can walk in one focused hour.<br>' +
          'Your journey begins now.',
      },
      {
        element: '#goal-manager',
        intro:
          'Click “➕ New” to set your first goal. Every journey needs a destination.',
        disableInteraction: false,    // let user press the button
      },
      {
        element: '#session-timer',
        intro:
          'Start the timer to walk your leagues. Stay focused – each second matters.',
      },
      {
        element: '#pomodoro-section',
        intro:
          'Pomodoro cycles keep your stride steady – effort balanced with rest.',
      },
      {
        /* Logbook step: waits until #logs-section exists */
        element: '#logs-section',
        intro:
          'This is your logbook. Reflect on your steps and learn from them.',
      },
      {
        intro:
          'You are ready. Take the first step and let the journey teach you.',
      },
    ],
  });

  /* ── keep highlight aligned when Goal card resizes ───────────── */
  const gm   = document.querySelector('#goal-manager');
  let   obs: MutationObserver | null = null;
  if (gm) {
    obs = new MutationObserver(() => refreshSoon(tour));
    obs.observe(gm, { childList: true, subtree: true });
  }

  /* ── before each step: make sure element exists, then refresh ── */
  tour.onbeforechange(async (el) => {
    const sel = el?.getAttribute?.('id');
    if (!sel) return;

    /* wait for element if it might appear later (logs-section) */
    if (sel === 'logs-section') {
      try {
        await waitFor('#logs-section');
      } catch {
        /* give up silently; the step will float in center */
      }
    }
    refreshSoon(tour);
  });

  /* ── cleanup & flag ──────────────────────────────────────────── */
  const close = () => {
    localStorage.setItem(TOUR_KEY, 'true');
    tourRunning = false;
    if (obs) obs.disconnect();
  };
  tour.onexit(close).oncomplete(close);

  tour.start();
}
