
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
const firebaseConfig = {
  apiKey: "AIzaSyDFySGrz1XPPFP92goKBNH09VQzy5BxdxU",
  authDomain: "ecpartz.firebaseapp.com",
  projectId: "ecpartz",
  storageBucket: "ecpartz.firebasestorage.app",
  messagingSenderId: "925085803132",
  appId: "1:925085803132:web:ac8a4248764ed708c8dff9",
  measurementId: "G-95EWCBK6HV"
};

const requiredConfig = [
  "apiKey",
  "authDomain",
  "projectId",
  "appId",
];

const missingConfig = requiredConfig.filter(
  (key) => !firebaseConfig[key]
);

if (missingConfig.length > 0) {
  throw new Error(
    `Falta configurar Firebase: ${missingConfig.join(", ")}. Revisa el archivo .env.`
  );
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
