import type { Journey, JourneyStatus } from "../lib/types";
import {
  patchRecord,
  removeMany,
  saveMany,
  subscribeCollection,
  type Unsubscribe,
} from "./firebaseUtils";

export const journeyService = {
  subscribe(
    accountId: string,
    onData: (data: Journey[]) => void,
    onError: (err: string) => void,
  ): Unsubscribe {
    return subscribeCollection<Journey>(accountId, "journeys", onData, onError);
  },

  async addMultiple(accountId: string, journeys: Journey[]): Promise<void> {
    await saveMany(accountId, "journeys", journeys);
  },

  async setStatus(accountId: string, journeyId: string, status: JourneyStatus): Promise<void> {
    await patchRecord(accountId, "journeys", journeyId, { status });
  },

  async removeMultiple(accountId: string, journeyIds: string[]): Promise<void> {
    await removeMany(accountId, "journeys", journeyIds);
  },
};
