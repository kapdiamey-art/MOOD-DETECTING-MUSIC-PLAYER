import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC4Ekqkz6l3klOUMoVI_LgVpHPBTnuqDfw",
  authDomain: "myis-f3dd6.firebaseapp.com",
  projectId: "myis-f3dd6",
  storageBucket: "myis-f3dd6.firebasestorage.app",
  messagingSenderId: "898194854042",
  appId: "1:898194854042:web:963d38d406eac0b95ccf23",
  measurementId: "G-WS32DXTD4C"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);