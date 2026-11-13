"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  updateProfile as firebaseUpdateProfile,
  type User,
  type UserCredential,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "../config/firebase";
import { DEMO_CREDENTIALS, isMockEnvironment } from "../config/appEnvironment";

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isMock: boolean;
}

interface UserPreferences {
  language?: string;
  theme?: string;
  notifications?: boolean;
}

interface UserStats {
  totalSessions?: number;
  totalPracticeTime?: number;
  lastPracticeDate?: string | null;
}

interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt?: unknown;
  lastLoginAt?: unknown;
  preferences?: UserPreferences;
  stats?: UserStats;
  [field: string]: unknown;
}

interface MockSession {
  user: AppUser;
  profile: UserProfile;
}

interface AuthContextType {
  currentUser: AppUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<UserCredential>;
  signInWithCredentials: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Record<string, unknown>) => Promise<void>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  updateUserStats: (stats: Partial<UserStats>) => Promise<void>;
  isAuthenticated: boolean;
}

const MOCK_SESSION_KEY = "impression-demo-session";
const AuthContext = createContext<AuthContextType | null>(null);

const toAppUser = (user: User): AppUser => ({
  uid: user.uid,
  email: user.email,
  displayName: user.displayName,
  photoURL: user.photoURL,
  isMock: false,
});

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const createDemoProfile = (): MockSession => {
  const user: AppUser = {
    uid: "impression-demo-user",
    email: DEMO_CREDENTIALS.email,
    displayName: "Demo User",
    photoURL: null,
    isMock: true,
  };
  const now = new Date().toISOString();
  return {
    user,
    profile: {
      ...user,
      createdAt: now,
      lastLoginAt: now,
      preferences: { language: "en", theme: "system", notifications: true },
      stats: { totalSessions: 0, totalPracticeTime: 0, lastPracticeDate: null },
    },
  };
};

const persistMockSession = (user: AppUser, profile: UserProfile) => {
  localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify({ user, profile }));
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initializeUserProfile = async (user: User) => {
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          preferences: { language: "en", theme: "system", notifications: true },
          stats: { totalSessions: 0, totalPracticeTime: 0, lastPracticeDate: null },
        };
        await setDoc(userRef, newProfile);
        setUserProfile(newProfile);
      } else {
        const existingProfile = userSnap.data() as UserProfile;
        await updateDoc(userRef, { lastLoginAt: serverTimestamp() });
        setUserProfile(existingProfile);
      }
    } catch (profileError) {
      console.error("Error initializing user profile:", profileError);
      setError(getErrorMessage(profileError));
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const userSnap = await getDoc(doc(db, "users", userId));
      if (userSnap.exists()) setUserProfile(userSnap.data() as UserProfile);
    } catch (profileError) {
      console.error("Error fetching user profile:", profileError);
      setError(getErrorMessage(profileError));
    }
  };

  const signInWithGoogle = async () => {
    if (isMockEnvironment) {
      throw new Error("Google sign-in is disabled in development and staging.");
    }
    try {
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      await initializeUserProfile(result.user);
      return result;
    } catch (signInError) {
      setError(getErrorMessage(signInError));
      throw signInError;
    }
  };

  const signInWithCredentials = async (email: string, password: string) => {
    if (!isMockEnvironment) {
      throw new Error("Demo credentials are disabled in production.");
    }
    if (
      email.trim().toLowerCase() !== DEMO_CREDENTIALS.email ||
      password !== DEMO_CREDENTIALS.password
    ) {
      throw new Error("Invalid demo email or password.");
    }

    const session = createDemoProfile();
    persistMockSession(session.user, session.profile);
    setCurrentUser(session.user);
    setUserProfile(session.profile);
    setError(null);
  };

  const logout = async () => {
    setError(null);
    if (currentUser?.isMock || isMockEnvironment) {
      localStorage.removeItem(MOCK_SESSION_KEY);
      setCurrentUser(null);
      setUserProfile(null);
      return;
    }

    try {
      await signOut(auth);
      setFirebaseUser(null);
      setCurrentUser(null);
      setUserProfile(null);
    } catch (logoutError) {
      setError(getErrorMessage(logoutError));
      throw logoutError;
    }
  };

  const updateUserProfile = async (updates: Record<string, unknown>) => {
    if (!currentUser) throw new Error("No user logged in");

    if (currentUser.isMock) {
      const nextUser = {
        ...currentUser,
        displayName: typeof updates.displayName === "string"
          ? updates.displayName
          : currentUser.displayName,
        photoURL: typeof updates.photoURL === "string"
          ? updates.photoURL
          : currentUser.photoURL,
      };
      const nextProfile = { ...userProfile!, ...updates, ...nextUser };
      setCurrentUser(nextUser);
      setUserProfile(nextProfile);
      persistMockSession(nextUser, nextProfile);
      return;
    }

    if (!firebaseUser) throw new Error("Firebase user is not available");
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, { ...updates, updatedAt: serverTimestamp() });
      if (updates.displayName || updates.photoURL) {
        await firebaseUpdateProfile(firebaseUser, {
          displayName: typeof updates.displayName === "string"
            ? updates.displayName
            : firebaseUser.displayName,
          photoURL: typeof updates.photoURL === "string"
            ? updates.photoURL
            : firebaseUser.photoURL,
        });
      }
      await fetchUserProfile(currentUser.uid);
    } catch (updateError) {
      setError(getErrorMessage(updateError));
      throw updateError;
    }
  };

  const updatePreferences = async (preferences: Partial<UserPreferences>) => {
    if (!currentUser) throw new Error("No user logged in");
    if (currentUser.isMock) {
      const nextProfile = {
        ...userProfile!,
        preferences: { ...userProfile?.preferences, ...preferences },
      };
      setUserProfile(nextProfile);
      persistMockSession(currentUser, nextProfile);
      return;
    }

    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        preferences: { ...userProfile?.preferences, ...preferences },
        updatedAt: serverTimestamp(),
      });
      await fetchUserProfile(currentUser.uid);
    } catch (updateError) {
      setError(getErrorMessage(updateError));
      throw updateError;
    }
  };

  const updateUserStats = async (stats: Partial<UserStats>) => {
    if (!currentUser) return;
    if (currentUser.isMock) {
      const nextProfile = {
        ...userProfile!,
        stats: { ...userProfile?.stats, ...stats },
      };
      setUserProfile(nextProfile);
      persistMockSession(currentUser, nextProfile);
      return;
    }

    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        stats: { ...userProfile?.stats, ...stats },
        updatedAt: serverTimestamp(),
      });
      await fetchUserProfile(currentUser.uid);
    } catch (updateError) {
      setError(getErrorMessage(updateError));
    }
  };

  useEffect(() => {
    if (isMockEnvironment) {
      try {
        const savedSession = localStorage.getItem(MOCK_SESSION_KEY);
        if (savedSession) {
          const session = JSON.parse(savedSession) as MockSession;
          if (session.user.isMock && session.user.uid === "impression-demo-user") {
            setCurrentUser(session.user);
            setUserProfile(session.profile);
          } else {
            localStorage.removeItem(MOCK_SESSION_KEY);
          }
        }
      } catch (storageError) {
        console.error("Unable to restore demo session:", storageError);
        setError(getErrorMessage(storageError));
      } finally {
        setLoading(false);
      }
      return;
    }

    return onAuthStateChanged(
      auth,
      async (user) => {
        setFirebaseUser(user);
        setCurrentUser(user ? toAppUser(user) : null);
        if (user) await fetchUserProfile(user.uid);
        else setUserProfile(null);
        setLoading(false);
      },
      (authError) => {
        setError(getErrorMessage(authError));
        setLoading(false);
      },
    );
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        error,
        signInWithGoogle,
        signInWithCredentials,
        logout,
        updateUserProfile,
        updatePreferences,
        updateUserStats,
        isAuthenticated: !!currentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
