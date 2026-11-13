import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { APP_ENV } from './appEnvironment';

/**
 * Firebase Configuration
 * 
 * To use this app with your own Firebase project:
 * 1. Create a new project at https://console.firebase.google.com/
 * 2. Enable Google Sign-In in Authentication > Sign-in method
 * 3. Add your app and copy the config below
 * 4. Enable Firestore Database in Firestore Database
 * 5. Set up security rules for Firestore
 */

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ''
};

if (
  APP_ENV === 'production' &&
  Object.values(firebaseConfig).some(value => !value)
) {
  throw new Error('Production Google sign-in requires complete NEXT_PUBLIC_FIREBASE_* configuration.');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Initialize Firestore
export const db = getFirestore(app);

export default app;

