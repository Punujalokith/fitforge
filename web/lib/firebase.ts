import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBZZLKdiVz8WyLSNHW46Y0d1_BShvkfPeA",
  authDomain: "fitforge-35f33.firebaseapp.com",
  projectId: "fitforge-35f33",
  storageBucket: "fitforge-35f33.firebasestorage.app",
  messagingSenderId: "483241590862",
  appId: "1:483241590862:web:42f68d425d4d53d256c31f"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
