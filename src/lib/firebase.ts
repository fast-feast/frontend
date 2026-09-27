import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

/**
 * Firebase Web SDK configuration (public values only — safe for the browser).
 *
 * All values come from Vite environment variables. When the project is not
 * configured, this module throws a clear, descriptive error instead of
 * silently falling back to mock authentication.
 *
 * Students only: owners/admins never touch this module.
 */

function requireEnv(key: string): string {
  const value = import.meta.env[key];
  if (typeof value !== 'string' || value.trim() === '' || value.startsWith('your_')) {
    throw new Error(
      `[FastFeast] Firebase is not configured. Set ${key} (and the other ` +
        `VITE_FIREBASE_* variables) in frontend/.env. See frontend/.env.example.`
    );
  }
  return value;
}

let cachedApp: FirebaseApp | null = null;
let initError: Error | null = null;

function getFirebaseApp(): FirebaseApp {
  if (cachedApp) return cachedApp;
  if (initError) throw initError;

  try {
    const config = {
      apiKey: requireEnv('VITE_FIREBASE_API_KEY'),
      authDomain: requireEnv('VITE_FIREBASE_AUTH_DOMAIN'),
      projectId: requireEnv('VITE_FIREBASE_PROJECT_ID'),
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
      appId: requireEnv('VITE_FIREBASE_APP_ID'),
    };
    // Initialize exactly once even if this module is imported repeatedly.
    cachedApp = getApps().length ? getApps()[0] : initializeApp(config);
    return cachedApp;
  } catch (err) {
    initError = err instanceof Error ? err : new Error(String(err));
    throw initError;
  }
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

export const firebaseConfigError = (): Error | null => initError;
