import React, { useEffect } from 'react';
import {
  Landing,
  AuthBar,
  SessionTimer,
  Journey,
  Pomodoro,
  Logs,
  GoalManager,
  Reflection,
  LanguagePicker,
  ExportData,
  ResetAll,
  UpdatePrompt,
  StoicMentor,
} from './components';
import { useAuth } from './contexts/AuthContext';
import { useGoals } from './contexts/GoalsContext';
import { useTierTheme } from './hooks/useTierTheme';
import { useT } from './i18n';
import { maybeRunIntroTour } from './introTour';

const App: React.FC = () => {
  const { loading, goals } = useGoals();
  const { user } = useAuth();
  const t = useT();

  // Only ever shown to someone who has not started: a returning visitor, or
  // anyone signed in, goes straight to the tool.
  const isNewcomer = !loading && goals.length === 0 && !user;

  // Paints the whole app in the current stage's colour.
  useTierTheme();

  useEffect(() => {
    // Wait for the first data read: the tour highlights cards that only exist
    // once goals have loaded.
    if (!loading) maybeRunIntroTour(t);
  }, [loading, t]);

  return (
    <div className="flex min-h-screen flex-col">
      <AuthBar />

      <main className="mx-auto w-full max-w-xl flex-grow space-y-5 p-4 pb-28">
        {isNewcomer && <Landing />}

        {/* The walk itself — goal, clock and road, on one surface. */}
        <SessionTimer />

        <Journey />
        <Pomodoro />
        <Logs />
        <Reflection />
        <GoalManager />

        {/* Housekeeping, folded away until wanted. */}
        <details className="group">
          <summary className="cursor-pointer list-none rounded-xl px-4 py-3 text-sm text-gray-500 transition-colors hover:bg-white/[0.03] hover:text-gray-300">
            <span className="inline-block transition-transform group-open:rotate-90">▸</span>{' '}
            {t('data.settings')}
          </summary>
          <div className="mt-3 space-y-3">
            <div className="card-quiet">
              <LanguagePicker />
            </div>
            <ExportData />
            <ResetAll />
          </div>
        </details>
      </main>

      <StoicMentor />
      <UpdatePrompt />
    </div>
  );
};

export default App;
