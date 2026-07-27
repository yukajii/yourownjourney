import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

/*
 * These values are public by design — a Firebase web config identifies the
 * project, it does not grant access. Access is controlled by the rules in
 * firestore.rules.
 */
export const app = initializeApp({
  apiKey: "AIzaSyCEw80e897zNASO4Zw6rqyudCjzo4jzaAI",
  authDomain: "leagues-2790f.firebaseapp.com",
  projectId: "leagues-2790f",
  storageBucket: "leagues-2790f.firebasestorage.app",
  messagingSenderId: "998292692484",
  appId: "1:998292692484:web:29d733fc7e032d4f739f51",
  measurementId: "G-HQ0EDCZCQ9",
});

export const auth = getAuth(app);

/*
 * IndexedDB-backed cache so the installed app reads and writes while offline;
 * queued writes flush when connectivity returns. Multi-tab manager keeps a
 * browser tab and the installed app from fighting over the same lease.
 */
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
