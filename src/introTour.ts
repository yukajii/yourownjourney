import type introJsModule from 'intro.js';

/*
 * intro.js and its stylesheets are ~100 KB that all but the very first visit
 * will never need, so they are pulled in on demand rather than shipped in the
 * main bundle.
 */
type IntroJs = typeof introJsModule;
type Tour = ReturnType<IntroJs['tour']>;

/* local asset → Vite gives a hashed URL at runtime */
import mentorImg from './assets/stoic-mentor.png';

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
function refreshSoon(tour: Tour) {
  requestAnimationFrame(() => tour.refresh());
}

/*
 * Intro.js 8 renders its own tooltip markup and has no `template` option, so
 * the mentor portrait is woven into each step's HTML instead. Step text is
 * rendered as HTML by default (`tooltipRenderAsHtml`), which is what makes
 * this work.
 */
const withMentor = (html: string) => `
  <div class="mentor-row">
    <img src="${mentorImg}" class="mentor-avatar" alt="" />
    <div>${html}</div>
  </div>
`;

export async function maybeRunIntroTour(t: (key: string) => string) {
  if (tourRunning) return;
  if (localStorage.getItem(TOUR_KEY)) return;

  /* wait for initial DOM (should be immediate) */
  for (const sel of STATIC_TARGETS) await waitFor(sel, 1000);

  tourRunning = true;

  const [{ default: introJs }] = await Promise.all([
    import('intro.js'),
    import('intro.js/introjs.css'),
    import('./introjs-dark.css'),
    import('./guruTooltip.css'),
  ]);

  const tour = introJs.tour();

  tour.setOptions({
    tooltipClass: 'introjs-dark guru-tooltip',
    overlayOpacity: 0.65,
    showProgress: true,
    showBullets: false,
    scrollToElement: true,       // ✦ auto-scroll enabled
    nextLabel: t('tour.next'),
    prevLabel: t('tour.back'),
    doneLabel: t('tour.done'),
    steps: [
      {
        intro: withMentor(t('tour.welcome')),
      },
      {
        element: '#goal-manager',
        intro: withMentor(t('tour.goal')),
        disableInteraction: false,    // let user press the button
      },
      {
        element: '#session-timer',
        intro: withMentor(t('tour.timer')),
      },
      {
        element: '#pomodoro-section',
        intro: withMentor(t('tour.pomodoro')),
      },
      {
        /* Logbook step: waits until #logs-section exists */
        element: '#logs-section',
        intro: withMentor(t('tour.logs')),
      },
      {
        element: '#stoic-mentor',
        intro: withMentor(t('tour.mentor')),
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

  /*
   * The mentor widget floats over the page, so it is hidden for the duration
   * of the tour — except on its own step, where it has to be visible to be
   * highlighted.
   */
  document.body.classList.add('tour-active');

  /* ── before each step: make sure element exists, then refresh ── */
  tour.onbeforechange(async (el) => {
    const sel = el?.getAttribute?.('id');

    document.body.classList.toggle('tour-active', sel !== 'stoic-mentor');

    if (!sel) return true;

    /* wait for element if it might appear later (logs-section) */
    if (sel === 'logs-section') {
      try {
        await waitFor('#logs-section');
      } catch {
        /* give up silently; the step will float in center */
      }
    }
    refreshSoon(tour);
    return true;
  });

  /* ── cleanup & flag ──────────────────────────────────────────── */
  const close = () => {
    localStorage.setItem(TOUR_KEY, 'true');
    tourRunning = false;
    document.body.classList.remove('tour-active');
    if (obs) obs.disconnect();
  };
  tour.onexit(close).oncomplete(close);

  tour.start();
}
