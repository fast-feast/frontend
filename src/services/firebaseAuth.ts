import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  getIdToken,
  type User,
} from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';

/**
 * Student-only Firebase Authentication abstraction.
 *
 * Providers: Google + Email/Password. There is deliberately NO phone/SMS
 * authentication here — see the project decision to avoid paid SMS flows.
 *
 * All Firebase SDK calls live here — screens never import 'firebase/auth'
 * directly. Canteen owners and admins never use this module; their flows
 * remain on the existing backend JWT authentication.
 */

export interface FirebaseSession {
  /** Firebase UID (auth identity only — NOT the FastFeast User._id). */
  uid: string;
  /** Short-lived Firebase ID token; the backend verifies it server-side. */
  idToken: string;
  email: string;
}

/**
 * Human-readable messages for common Firebase auth error codes, so the
 * existing login error box shows helpful text instead of raw SDK codes.
 */
const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'Please enter a valid email address',
  'auth/email-already-in-use': 'An account with this email already exists',
  'auth/weak-password': 'Password must be at least 6 characters',
  'auth/user-not-found': 'No account found with this email',
  'auth/wrong-password': 'Incorrect email or password',
  'auth/invalid-credential': 'Incorrect email or password',
  'auth/user-disabled': 'This account has been disabled',
  'auth/too-many-requests': 'Too many attempts. Please try again later',
  'auth/network-request-failed': 'Network error. Please check your connection',
  'auth/popup-closed-by-user': 'Google sign-in was cancelled',
  'auth/cancelled-popup-request': 'Google sign-in was cancelled',
  'auth/popup-blocked': 'Your browser blocked the Google popup. Please allow popups and try again',
  'auth/operation-not-allowed': 'This sign-in method is not enabled in the Firebase console',
  'auth/unauthorized-domain': 'This domain is not authorized in the Firebase console',
  'auth/configuration-not-found': 'Email/password sign-in is not enabled for this Firebase project',
  'auth/invalid-api-key': 'Firebase is misconfigured. Check VITE_FIREBASE_* values in frontend/.env',
};

function translateFirebaseError(err: unknown): never {
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code: unknown }).code)
      : '';
  if (FIREBASE_ERROR_MESSAGES[code]) {
    throw new Error(FIREBASE_ERROR_MESSAGES[code]);
  }
  throw err instanceof Error ? err : new Error(String(err));
}

async function toSession(user: User): Promise<FirebaseSession> {
  const idToken = await getIdToken(user);
  return {
    uid: user.uid,
    idToken,
    email: user.email ?? '',
  };
}

/** Student: sign in with an existing email/password Firebase account. */
export async function firebaseSignIn(
  email: string,
  password: string
): Promise<FirebaseSession> {
  try {
    const auth = getFirebaseAuth();
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    return await toSession(credential.user);
  } catch (err) {
    translateFirebaseError(err);
  }
}

/**
 * Student: create a new Firebase email/password account. Firebase sends the
 * standard verification email (no custom email system is built here).
 */
export async function firebaseSignUp(
  email: string,
  password: string
): Promise<FirebaseSession> {
  try {
    const auth = getFirebaseAuth();
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    // Fire-and-forget: signup must not fail or stall if the email bounces.
    void sendEmailVerification(credential.user).catch(() => {});
    return await toSession(credential.user);
  } catch (err) {
    translateFirebaseError(err);
  }
}

/** Student: sign in with Google via the Firebase popup flow. */
export async function firebaseGoogleSignIn(): Promise<FirebaseSession> {
  try {
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(auth, provider);
    return await toSession(credential.user);
  } catch (err) {
    translateFirebaseError(err);
  }
}

/** Student: trigger Firebase's standard password-reset email. */
export async function firebaseSendPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
  } catch (err) {
    translateFirebaseError(err);
  }
}

/** Sign the student out of Firebase. Safe to call when not signed in. */
export async function firebaseSignOut(): Promise<void> {
  try {
    await signOut(getFirebaseAuth());
  } catch {
    // Already signed out (or Firebase unconfigured) — nothing to do.
  }
}

/** True when a Firebase session currently exists (students only). */
export function hasFirebaseSession(): boolean {
  try {
    return getFirebaseAuth().currentUser !== null;
  } catch {
    return false;
  }
}
