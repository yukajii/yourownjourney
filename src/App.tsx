import {
  AuthBar,
  GoalHeader,
  SessionTimer,
  LeaguesProgress,
  Pomodoro,
  Logs,
  GoalManager,
} from './components'; // barrel export once stubs are created
import { maybeRunIntroTour } from './introTour';
import React, { useEffect } from 'react';

const App: React.FC = () => {
  useEffect(() => {
    maybeRunIntroTour();          // fire after first mount
  }, []);
  return (
    <div className="min-h-screen flex flex-col">
      <AuthBar />
      <main className="flex-grow p-4 max-w-xl mx-auto space-y-6">
        <GoalHeader />
        <SessionTimer />
        <LeaguesProgress />
        <Pomodoro />
        <Logs />
        <GoalManager />
      </main>
    </div>
  );
};

export default App;