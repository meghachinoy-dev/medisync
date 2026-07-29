import { useEffect, useState, useCallback } from 'react';
import { auth, DEMO_MODE } from '../firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';

// A synthetic user so demo mode (no Firebase config) skips the login wall.
const DEMO_USER = { uid: 'demo-user', email: 'demo@medisync.app', displayName: 'Demo User' };

// Map Firebase auth error codes to friendly messages.
function friendlyAuthError(code) {
  switch (code) {
    case 'auth/invalid-email': return 'That email address looks invalid.';
    case 'auth/user-disabled': return 'This account has been disabled.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential': return 'Incorrect email or password.';
    case 'auth/email-already-in-use': return 'An account with this email already exists.';
    case 'auth/weak-password': return 'Password should be at least 6 characters.';
    case 'auth/too-many-requests': return 'Too many attempts. Please wait and try again.';
    case 'auth/network-request-failed': return 'Network error. Check your connection.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is not enabled for this Firebase project.';
    default: return 'Something went wrong. Please try again.';
  }
}

export function useAuth() {
  const [user, setUser] = useState(DEMO_MODE ? DEMO_USER : null);
  const [authLoading, setAuthLoading] = useState(!DEMO_MODE);

  useEffect(() => {
    if (DEMO_MODE) return;
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  const login = useCallback(async (email, password) => {
    if (DEMO_MODE) return;
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      throw new Error(friendlyAuthError(err?.code));
    }
  }, []);

  const signup = useCallback(async (email, password, displayName) => {
    if (DEMO_MODE) return;
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (displayName) {
        await updateProfile(cred.user, { displayName: displayName.trim() });
        setUser({ ...cred.user, displayName: displayName.trim() });
      }
    } catch (err) {
      throw new Error(friendlyAuthError(err?.code));
    }
  }, []);

  const logout = useCallback(async () => {
    if (DEMO_MODE) return;
    await signOut(auth);
  }, []);

  return { user, authLoading, login, signup, logout, isDemo: DEMO_MODE };
}
