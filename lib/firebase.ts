
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

/**
 * CONFIGURAÇÃO DO FIREBASE
 */
export const firebaseEnvKeys = {
  apiKey: "NEXT_PUBLIC_FIREBASE_API_KEY",
  authDomain: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  projectId: "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  storageBucket: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  appId: "NEXT_PUBLIC_FIREBASE_APP_ID",
};

const getManualConfig = () => {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem('firebase_manual_config');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

const manualConfig = typeof window !== 'undefined' ? getManualConfig() : null;

const isValidKey = (val: string | undefined) => {
  if (!val) return false;
  const v = val.trim().toLowerCase();
  return v !== "" && v !== "undefined" && v !== "null" && !v.includes("...");
};

const firebaseConfig = {
  apiKey: manualConfig?.apiKey || (isValidKey(process.env.NEXT_PUBLIC_FIREBASE_API_KEY) ? process.env.NEXT_PUBLIC_FIREBASE_API_KEY : "dummy-key"),
  authDomain: manualConfig?.authDomain || (isValidKey(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) ? process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN : "dummy.firebaseapp.com"),
  projectId: manualConfig?.projectId || (isValidKey(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) ? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID : "dummy-project"),
  storageBucket: manualConfig?.storageBucket || (isValidKey(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) ? process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET : "dummy.appspot.com"),
  messagingSenderId: manualConfig?.messagingSenderId || (isValidKey(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) ? process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID : "12345678"),
  appId: manualConfig?.appId || (isValidKey(process.env.NEXT_PUBLIC_FIREBASE_APP_ID) ? process.env.NEXT_PUBLIC_FIREBASE_APP_ID : "1:12345678:web:dummy"),
};

export const getFirebaseConfigStatus = () => {
  const missing = Object.entries(firebaseConfig)
    .filter(([key, value]) => value?.includes("dummy") || !value)
    .map(([key]) => (firebaseEnvKeys as any)[key]);
  
  return {
    isValid: missing.length === 0,
    missingKeys: missing
  };
};

let app: FirebaseApp;
try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
} catch (e) {
  console.error("Firebase Init Error:", e);
  // @ts-ignore
  app = { name: '[DEFAULT]', options: firebaseConfig };
}

// Inicialização com Fallbacks para evitar erro de "reading getProvider"
export const auth: Auth = (() => {
    try { return getAuth(app); } catch { return { currentUser: null } as unknown as Auth; }
})();

export const db: Firestore = (() => {
    try { return getFirestore(app); } catch { return {} as unknown as Firestore; }
})();

export const storage: FirebaseStorage = (() => {
    try { return getStorage(app); } catch { return {} as unknown as FirebaseStorage; }
})();
