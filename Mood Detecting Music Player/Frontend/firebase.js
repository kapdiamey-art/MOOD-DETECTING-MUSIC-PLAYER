import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBs16TJR_sfBZcYY0JP5zhQlmprAKyBf7c",
  authDomain: "mood-detecting-music-player.firebaseapp.com",
  projectId: "mood-detecting-music-player",
  storageBucket: "mood-detecting-music-player.firebasestorage.app",
  messagingSenderId: "1075539391762",
  appId: "1:1075539391762:web:a3e18e59a0fa4dfc192fcb",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);