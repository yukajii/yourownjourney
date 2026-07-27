import React, { useEffect } from 'react';
import {
  AuthBar,
  GoalHeader,
  SessionTimer,
  LeaguesProgress,
  Pomodoro,
  Logs,
  GoalManager,
  ExportData,
  ResetAll,
  UpdatePrompt,
  StoicMentor,
} from './components';
import { useGoals } from './contexts/GoalsContext';
import { maybeRunIntroTour } from './introTour';

const App: React.FC = () => {
  const { loading } = useGoals();

  useEffect(() => {
    // Wait for the first data read: the tour highlights cards that only exist
    // once goals have loaded.
    if (!loading) maybeRunIntroTour();
  }, [loading]);

  return (
    <div className="flex min-h-screen flex-col">
      <AuthBar />

      <main className="mx-auto w-full max-w-xl flex-grow space-y-6 p-4 pb-24">
        <GoalHeader />
        <SessionTimer />
        <LeaguesProgress />
        <Pomodoro />
        <Logs />
        <GoalManager />
        <ExportData />
        <ResetAll />
      </main>

      <StoicMentor />
      <UpdatePrompt />
    </div>
  );
};

export default App;
