import introJs from 'intro.js';
import 'intro.js/introjs.css';
import './introjs-dark.css';

const TOUR_KEY = 'leagues_has_seen_intro';

export function maybeRunIntroTour() {
  if (localStorage.getItem(TOUR_KEY)) return;

  const tour = introJs.tour();           // ① create the tour builder

  tour
    .setOptions({
      tooltipClass: 'introjs-dark',
      overlayOpacity: 0.65,
      showProgress: true,
      showBullets: false,
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
          intro: 'Set your first goal. A clear destination turns wandering into a path.',
        },
        {
          element: '#session-timer',
          intro: 'Start the timer to walk your leagues. Stay focused – each second matters.',
        },
        {
          element: '#leagues-progress',
          intro:
            'Watch your progress bar fill. Milestones at 20, 100 and 1 000 leagues celebrate your growth.',
        },
        {
          element: '#pomodoro-section',
          intro: 'Pomodoro cycles keep your stride steady – effort balanced with rest.',
        },
        {
          element: '#logs-section',
          intro: 'This is your logbook. Reflect on your steps and learn from them.',
        },
        {
          intro: 'You are ready. Take the first step and let the journey teach you.',
        },
      ],
    })
    .oncomplete(() => localStorage.setItem(TOUR_KEY, 'true'))
    .onexit(()     => localStorage.setItem(TOUR_KEY, 'true'))
    .start();                             // ② launch
}
