import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { defaultFirebaseConfig } from "./firebase-config";

const env = (key: string, fallback: string) =>
  ((import.meta.env[key] as string | undefined) || fallback).trim();

export const firebaseConfig = {
  apiKey: env("VITE_FIREBASE_API_KEY", defaultFirebaseConfig.apiKey),
  authDomain: env("VITE_FIREBASE_AUTH_DOMAIN", defaultFirebaseConfig.authDomain),
  projectId: env("VITE_FIREBASE_PROJECT_ID", defaultFirebaseConfig.projectId),
  storageBucket: env("VITE_FIREBASE_STORAGE_BUCKET", defaultFirebaseConfig.storageBucket),
  messagingSenderId: env(
    "VITE_FIREBASE_MESSAGING_SENDER_ID",
    defaultFirebaseConfig.messagingSenderId,
  ),
  appId: env("VITE_FIREBASE_APP_ID", defaultFirebaseConfig.appId),
  measurementId: env("VITE_FIREBASE_MEASUREMENT_ID", defaultFirebaseConfig.measurementId),
};

export const firebaseEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);


let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let analyticsStarted = false;

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = getApps()[0] ?? initializeApp(firebaseConfig as Record<string, string>);
  }
  return app;
}

export function getDb(): Firestore {
  if (!db) {
    db = getFirestore(getFirebaseApp());
  }
  return db;
}

/** Analytics only works in the browser and needs a measurementId. */
export async function initAnalytics(): Promise<void> {
  if (analyticsStarted) return;
  if (typeof window === "undefined") return;
  if (!firebaseEnabled || !firebaseConfig.measurementId) return;
  analyticsStarted = true;
  const { getAnalytics, isSupported } = await import("firebase/analytics");
  if (await isSupported()) {
    getAnalytics(getFirebaseApp());
  }
}

/* --------------------------------------------------- remote availability */

let remoteHealthy = firebaseEnabled;


export function remoteReady(): boolean {
  return remoteHealthy;
}

/** Only hard connectivity failures drop the session to the local driver. */
export function markRemoteDown(reason?: unknown): void {
  const code = (reason as { code?: string } | null)?.code ?? "";
  const message = reason instanceof Error ? reason.message : String(reason ?? "");
  if (import.meta.env.DEV) console.warn("[patchproof] Firestore write issue", code || message, reason);
  // Permission errors are rule problems, not connectivity: keep using Firestore
  // so later operations (and fixed rules) still reach the database.
  if (code === "permission-denied" || code === "unauthenticated") return;
  remoteHealthy = false;
}

export function withTimeout<T>(op: Promise<T>, ms = 10000): Promise<T> {
  return Promise.race([
    op,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("firestore-timeout")), ms)),
  ]);
}

/** Firestore is used whenever it is configured and has not hard-failed. */
export async function ensureRemote(): Promise<boolean> {
  return firebaseEnabled && remoteHealthy;
}

