import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, query, orderBy, deleteDoc, getDocFromServer } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

let firebaseApp;
let firestoreDb: any = null;
let firebaseAuth: any = null;
let googleProvider: any = null;
let isFirebaseAvailable = false;

// Attempt to load the configuration files if possible
try {
  const config = {
    apiKey: firebaseConfig.apiKey || (import.meta as any).env?.VITE_FIREBASE_API_KEY || "",
    authDomain: firebaseConfig.authDomain || (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || "",
    projectId: firebaseConfig.projectId || (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || "",
    storageBucket: firebaseConfig.storageBucket || (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: firebaseConfig.messagingSenderId || (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: firebaseConfig.appId || (import.meta as any).env?.VITE_FIREBASE_APP_ID || "",
    firestoreDatabaseId: firebaseConfig.firestoreDatabaseId || (import.meta as any).env?.VITE_FIREBASE_DATABASE_ID || "(default)"
  };

  if (config.apiKey) {
    firebaseApp = getApps().length === 0 ? initializeApp(config) : getApp();
    firestoreDb = getFirestore(firebaseApp, config.firestoreDatabaseId);
    firebaseAuth = getAuth(firebaseApp);
    googleProvider = new GoogleAuthProvider();
    isFirebaseAvailable = true;
    console.log("Firebase initialized successfully with environmental config.");
  }
} catch (e) {
  console.log("Firebase config not available yet. Operating in Local/Guest Mode.");
}

export { 
  firestoreDb as db, 
  firebaseAuth as auth, 
  googleProvider as provider, 
  isFirebaseAvailable,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
};

// Firestore Operation Types
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

// Global firestore error translator as requested in Firebase Integration instructions
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentAuth = firebaseAuth;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentAuth?.currentUser?.uid || null,
      email: currentAuth?.currentUser?.email || null,
      emailVerified: currentAuth?.currentUser?.emailVerified || null,
      isAnonymous: currentAuth?.currentUser?.isAnonymous || null,
    },
    operationType,
    path
  };
  console.error("Firestore Error logged: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Helper to validate connection
export async function testConnection() {
  if (!isFirebaseAvailable || !firestoreDb) return;
  try {
    await getDocFromServer(doc(firestoreDb, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.error("Please check your Firebase configuration: Client is offline.");
    }
  }
}
