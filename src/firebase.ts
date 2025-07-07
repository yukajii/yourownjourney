import { initializeApp } from "firebase/app";

export const app = initializeApp({
  apiKey:            "YOUR-API-KEY",
  authDomain:        "your.firebaseapp.com",
  projectId:         "your",
  storageBucket:     "your.appspot.com",
  messagingSenderId: "123",
  appId:             "1:123:web:abc",
  measurementId:     "G-XXXX"
});
