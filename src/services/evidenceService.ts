import type { EvidenceRecord } from "../lib/types";
import { removeMany, saveRecord, subscribeCollection, type Unsubscribe } from "./firebaseUtils";

export const evidenceService = {
  subscribe(
    accountId: string,
    onData: (data: EvidenceRecord[]) => void,
    onError: (err: string) => void,
  ): Unsubscribe {
    return subscribeCollection<EvidenceRecord>(accountId, "evidence", onData, onError);
  },

  async add(accountId: string, evidence: EvidenceRecord): Promise<void> {
    await saveRecord(accountId, "evidence", evidence);
  },

  async removeMultiple(accountId: string, evidenceIds: string[]): Promise<void> {
    await removeMany(accountId, "evidence", evidenceIds);
  },
};
