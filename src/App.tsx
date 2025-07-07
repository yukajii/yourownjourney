import {
  AuthBar,
  GoalHeader,
  SessionTimer,
  LeaguesProgress,
  Pomodoro,
  Logs,
  GoalManager,
  ResetAll
} from './components'; // barrel export once stubs are created

const App: React.FC = () => {
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
        <ResetAll />
      </main>
    </div>
  );
};

export default App;