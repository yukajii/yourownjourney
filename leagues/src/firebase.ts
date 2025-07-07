import { initializeApp } from 'firebase/app';
import { getAuth }       from 'firebase/auth';
import { getFirestore }  from 'firebase/firestore';

/* TODO: Replace with your new Firebase credentials */
const firebaseConfig = {
  apiKey:            'YOUR_API_KEY',
  authDomain:        'leagues-project.firebaseapp.com',
  projectId:         'leagues-project',
  storageBucket:     'leagues-project.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId:             'YOUR_APP_ID',
  measurementId:     'YOUR_MEASUREMENT_ID',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db   = getFirestore(app);