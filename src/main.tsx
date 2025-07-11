import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider }   from './contexts/AuthContext';
import { GoalsProvider }  from './contexts/GoalsContext';
import { ModalProvider }  from './modals/ModalProvider';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <GoalsProvider>
        <ModalProvider>
          <App />
        </ModalProvider>
      </GoalsProvider>
    </AuthProvider>
  </React.StrictMode>
);