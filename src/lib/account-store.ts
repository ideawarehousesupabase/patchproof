/**
 * Prototype account store — Firestore CRUD only (no Firebase Authentication).
 *
 * If Firebase config env vars are present the `users` collection in Firestore
 * is used. Otherwise the MVP falls back to an equivalent browser-local store so
 * the demo remains clickable without credentials.
 */
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { ensureRemote, firebaseEnabled, getDb, markRemoteDown, withTimeout } from "./firebase";

export { firebaseEnabled };

export type Account = {
  id: string;
  fullName: string;
  agencyName: string;
  email: string;
  passwordHash: string;
  createdAt: string;
};


/** Deterministic prototype-only hash. Not production security. */
export function hashPassword(password: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < password.length; i++) {
    const c = password.charCodeAt(i);
    h1 = (h1 ^ c) >>> 0;
    h1 = (h1 * 16777619) >>> 0;
    h2 = (h2 + c * (i + 7)) >>> 0;
    h2 = ((h2 << 5) | (h2 >>> 27)) >>> 0;
  }
  return `pp1$${h1.toString(16).padStart(8, "0")}${h2.toString(16).padStart(8, "0")}`;
}

const LOCAL_KEY = "patchproof.users";

function readLocal(): Account[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(LOCAL_KEY) ?? "[]") as Account[];
  } catch {
    return [];
  }
}
function writeLocal(accounts: Account[]) {
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify(accounts));
}

function seedLocal(): Account[] {
  return readLocal();
}

export async function findAccountByEmail(email: string): Promise<Account | null> {
  const normalised = email.trim().toLowerCase();
  if (await ensureRemote()) {
    try {
      const snap = await withTimeout(
        getDocs(query(collection(getDb(), "users"), where("email", "==", normalised))),
      );
      const found = snap.docs[0];
      return found ? ({ id: found.id, ...found.data() } as Account) : null;
    } catch (err) {
      markRemoteDown(err);
    }
  }
  return seedLocal().find((a) => a.email === normalised) ?? null;
}

export async function createAccount(input: {
  fullName: string;
  agencyName: string;
  email: string;
  password: string;
}): Promise<Account> {
  const account: Account = {
    id: crypto.randomUUID(),
    fullName: input.fullName.trim(),
    agencyName: input.agencyName.trim(),
    email: input.email.trim().toLowerCase(),
    passwordHash: hashPassword(input.password),
    createdAt: new Date().toISOString(),
  };
  if (await ensureRemote()) {
    try {
      await withTimeout(setDoc(doc(getDb(), "users", account.id), account));
      return account;
    } catch (err) {
      markRemoteDown(err);
    }
  }
  writeLocal([...seedLocal(), account]);
  return account;
}

export async function updateAccount(
  id: string,
  changes: Partial<Pick<Account, "fullName" | "agencyName" | "email">>,
): Promise<void> {
  const patch = { ...changes };
  if (patch.email) patch.email = patch.email.trim().toLowerCase();
  if (await ensureRemote()) {
    try {
      await withTimeout(updateDoc(doc(getDb(), "users", id), patch));
      return;
    } catch (err) {
      markRemoteDown(err);
    }
  }
  writeLocal(seedLocal().map((a) => (a.id === id ? { ...a, ...patch } : a)));
}

export async function deleteAccount(id: string): Promise<void> {
  if (await ensureRemote()) {
    try {
      await withTimeout(deleteDoc(doc(getDb(), "users", id)));
      return;
    } catch (err) {
      markRemoteDown(err);
    }
  }
  writeLocal(seedLocal().filter((a) => a.id !== id));
}
