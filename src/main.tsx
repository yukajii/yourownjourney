import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { GoalsProvider } from './contexts/GoalsContext';
import { SessionProvider } from './contexts/SessionContext';
import { ModalProvider } from './modals/ModalProvider';
import { startAnalytics } from './analytics';
import './index.css';

startAnalytics();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <GoalsProvider>
        <SessionProvider>
          <ModalProvider>
            <App />
          </ModalProvider>
        </SessionProvider>
      </GoalsProvider>
    </AuthProvider>
  </React.StrictMode>
);
