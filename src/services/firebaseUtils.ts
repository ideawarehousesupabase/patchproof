import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { getDb } from "../lib/firebase";

export type CollectionName = "websites" | "changes" | "issues" | "journeys" | "evidence";
export type Unsubscribe = () => void;

/**
 * Ensures Firebase calls have a timeout so they don't hang indefinitely if offline
 */
export function withTimeout<T>(op: Promise<T>, ms = 10000): Promise<T> {
  return Promise.race([
    op,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("firestore-timeout")), ms)),
  ]);
}

/** Subscribe to a collection for a specific account. */
export function subscribeCollection<T extends { id: string }>(
  accountId: string,
  name: CollectionName,
  onData: (rows: T[]) => void,
  onError: (message: string) => void,
): Unsubscribe {
  return onSnapshot(
    collection(getDb(), "users", accountId, name),
    (snap) => {
      onData(snap.docs.map((d) => ({ ...(d.data() as object), id: d.id }) as T));
    },
    (err) => {
      console.error(`[patchproof] Firestore subscription error on ${name}:`, err);
      onError(err.message);
    },
  );
}

/** Save a single record. */
export async function saveRecord<T extends { id: string }>(
  accountId: string,
  name: CollectionName,
  record: T,
): Promise<void> {
  const { id, ...data } = record;
  await withTimeout(setDoc(doc(getDb(), "users", accountId, name, id), data));
}

/** Save multiple records in a batch. */
export async function saveMany<T extends { id: string }>(
  accountId: string,
  name: CollectionName,
  records: T[],
): Promise<void> {
  if (!records.length) return;
  const batch = writeBatch(getDb());
  for (const record of records) {
    const { id, ...data } = record;
    batch.set(doc(getDb(), "users", accountId, name, id), data);
  }
  await withTimeout(batch.commit());
}

/** Update specific fields of a record. */
export async function patchRecord(
  accountId: string,
  name: CollectionName,
  id: string,
  patch: Record<string, unknown>,
): Promise<void> {
  await withTimeout(updateDoc(doc(getDb(), "users", accountId, name, id), patch));
}

/** Delete a single record. */
export async function removeRecord(
  accountId: string,
  name: CollectionName,
  id: string,
): Promise<void> {
  await withTimeout(deleteDoc(doc(getDb(), "users", accountId, name, id)));
}

/** Delete multiple records in a batch. */
export async function removeMany(
  accountId: string,
  name: CollectionName,
  ids: string[],
): Promise<void> {
  if (!ids.length) return;
  const batch = writeBatch(getDb());
  for (const id of ids) {
    batch.delete(doc(getDb(), "users", accountId, name, id));
  }
  await withTimeout(batch.commit());
}

/** Used when an account is deleted — removes every record it owns. */
export async function removeAllData(accountId: string): Promise<void> {
  const names: CollectionName[] = ["websites", "changes", "issues", "journeys", "evidence"];
  for (const name of names) {
    try {
      const snap = await withTimeout(getDocs(collection(getDb(), "users", accountId, name)));
      await removeMany(
        accountId,
        name,
        snap.docs.map((d) => d.id),
      );
    } catch (err) {
      console.error(`[patchproof] Firestore removeAllData error on ${name}:`, err);
    }
  }
}

/** Generate a random ID with a prefix. */
export function newId(prefix: string): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(16).slice(2, 10);
  return `${prefix}-${rand}`;
}
