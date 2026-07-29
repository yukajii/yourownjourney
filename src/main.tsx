import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { GoalsProvider } from './contexts/GoalsContext';
import { SessionProvider } from './contexts/SessionContext';
import { ModalProvider } from './modals/ModalProvider';
import { I18nProvider } from './i18n';
import { startAnalytics } from './analytics';
import './index.css';

startAnalytics();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    {/* Outermost: every other provider's UI needs to be able to speak. */}
    <I18nProvider>
      <AuthProvider>
        <GoalsProvider>
          <SessionProvider>
            <ModalProvider>
              <App />
            </ModalProvider>
          </SessionProvider>
        </GoalsProvider>
      </AuthProvider>
    </I18nProvider>
  </React.StrictMode>
);
