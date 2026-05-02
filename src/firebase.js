import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC0NeaZpqkev2Pg90IWSbm-c-Tv0QovDDM",
  authDomain: "kaiyoppu-57f32.firebaseapp.com",
  projectId: "kaiyoppu-57f32",
  storageBucket: "kaiyoppu-57f32.firebasestorage.app",
  messagingSenderId: "713279877471",
  appId: "1:713279877471:web:b94de37c039cd4d6ea86ea",
  measurementId: "G-1G1CY9L9DD"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
