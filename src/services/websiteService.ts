import type { WebsiteRecord } from "../lib/types";
import { removeMany, removeRecord, saveRecord, subscribeCollection, type Unsubscribe } from "./firebaseUtils";

export const websiteService = {
  subscribe(
    accountId: string,
    onData: (data: WebsiteRecord[]) => void,
    onError: (err: string) => void,
  ): Unsubscribe {
    return subscribeCollection<WebsiteRecord>(accountId, "websites", onData, onError);
  },

  async add(accountId: string, website: WebsiteRecord): Promise<void> {
    await saveRecord(accountId, "websites", website);
  },

  async update(accountId: string, website: WebsiteRecord): Promise<void> {
    await saveRecord(accountId, "websites", website);
  },

  async remove(accountId: string, websiteId: string): Promise<void> {
    await removeRecord(accountId, "websites", websiteId);
  },

  async removeMultiple(accountId: string, websiteIds: string[]): Promise<void> {
    await removeMany(accountId, "websites", websiteIds);
  },
};
