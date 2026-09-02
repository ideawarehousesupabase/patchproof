/**
 * Firebase web configuration.
 *
 * All values MUST be provided through VITE_FIREBASE_* environment variables
 * in a `.env` file at the project root. No hardcoded fallback credentials are
 * shipped with the app to prevent accidental connection to the wrong project.
 *
 * See `.env.example` for the required variable names.
 */
export const defaultFirebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: "",
};
