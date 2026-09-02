import type { ChangeEvent, Issue, IssueStatus } from "../lib/types";
import {
  patchRecord,
  removeMany,
  removeRecord,
  saveMany,
  saveRecord,
  subscribeCollection,
  type Unsubscribe,
} from "./firebaseUtils";

export const issueService = {
  subscribeIssues(
    accountId: string,
    onData: (data: Issue[]) => void,
    onError: (err: string) => void,
  ): Unsubscribe {
    return subscribeCollection<Issue>(accountId, "issues", onData, onError);
  },

  subscribeChanges(
    accountId: string,
    onData: (data: ChangeEvent[]) => void,
    onError: (err: string) => void,
  ): Unsubscribe {
    return subscribeCollection<ChangeEvent>(accountId, "changes", onData, onError);
  },

  async addChange(accountId: string, change: ChangeEvent): Promise<void> {
    await saveRecord(accountId, "changes", change);
  },

  async addIssue(accountId: string, issue: Issue): Promise<void> {
    await saveRecord(accountId, "issues", issue);
  },

  async addMultiple(
    accountId: string,
    changes: ChangeEvent[],
    issues: Issue[],
  ): Promise<void> {
    await saveMany(accountId, "changes", changes);
    await saveMany(accountId, "issues", issues);
  },

  async setStatus(accountId: string, issueId: string, status: IssueStatus): Promise<void> {
    await patchRecord(accountId, "issues", issueId, { status });
  },

  async removeIssue(accountId: string, issueId: string): Promise<void> {
    await removeRecord(accountId, "issues", issueId);
  },

  async removeChange(accountId: string, changeId: string): Promise<void> {
    await removeRecord(accountId, "changes", changeId);
  },

  async removeMultipleIssues(accountId: string, issueIds: string[]): Promise<void> {
    await removeMany(accountId, "issues", issueIds);
  },

  async removeMultipleChanges(accountId: string, changeIds: string[]): Promise<void> {
    await removeMany(accountId, "changes", changeIds);
  },
};
