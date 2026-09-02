import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Account } from "./account-store";
import {
  buildEvidence,
  deriveJourneyStatus,
  deriveJourneys,
  deriveWebsiteView,
  processChange,
} from "./engine";
import type {
  ChangeEvent,
  EvidenceRecord,
  Issue,
  IssueStatus,
  Journey,
  JourneyStatus,
  Website,
  WebsiteRecord,
} from "./types";
import { websiteService } from "../services/websiteService";
import { issueService } from "../services/issueService";
import { journeyService } from "../services/journeyService";
import { evidenceService } from "../services/evidenceService";
import { newId, removeAllData } from "../services/firebaseUtils";
import {
  isBackendConfigured,
  scanWebsite as apiScanWebsite,
  applyRepair as apiApplyRepair,
  undoRepair as apiUndoRepair,
  triggerValidation as apiTriggerValidation,
  setAuthToken,
  type ScanResult,
  type RepairResult,
  type ValidateResult,
} from "../services/backendApi";

const SESSION_KEY = "patchproof.session";

export type NewWebsite = {
  name: string;
  client: string;
  url: string;
  platform: string;
  type: string;
  businessFunctions: string[];
  wpUsername?: string;
  wpAppPassword?: string;
};

export type NewChange = {
  websiteId: string;
  component: string;
  description: string;
  detectedAt: string;
};

type AppState = {
  user: Account | null;
  sessionReady: boolean;
  signIn: (account: Account) => void;
  signOut: () => void;
  updateUser: (changes: Partial<Account>) => void;

  loading: boolean;
  error: string | null;

  websites: Website[];
  websiteRecords: WebsiteRecord[];
  changes: ChangeEvent[];
  issues: Issue[];
  journeys: Journey[];
  evidence: EvidenceRecord[];

  addWebsite: (input: NewWebsite) => Promise<void>;
  updateWebsite: (id: string, input: NewWebsite) => Promise<void>;
  deleteWebsite: (id: string) => Promise<void>;
  reportChange: (input: NewChange) => Promise<Issue | null>;
  reportChanges: (inputs: NewChange[]) => Promise<number>;
  deleteIssue: (id: string) => Promise<void>;
  setIssueStatus: (id: string, status: IssueStatus) => Promise<void>;
  setJourneyStatus: (id: string, status: JourneyStatus) => Promise<void>;

  /* ── Backend integration (optional — only available when VITE_BACKEND_URL is set) ── */
  backendAvailable: boolean;
  scanWebsite: (websiteId: string) => Promise<{ ok: true; data: ScanResult } | { ok: false; error: string }>;
  applyRepair: (issueId: string, wpPassword?: string) => Promise<{ ok: true; data: RepairResult } | { ok: false; error: string }>;
  undoRepair: (issueId: string, wpPassword?: string) => Promise<{ ok: true; data: { success: boolean; message: string } } | { ok: false; error: string }>;
  triggerLiveValidation: (journeyId: string) => Promise<{ ok: true; data: ValidateResult } | { ok: false; error: string }>;
};

const Ctx = createContext<AppState | null>(null);

function readSession(): Account | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Account) : null;
  } catch {
    return null;
  }
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Account | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  const [websiteRecords, setWebsiteRecords] = useState<WebsiteRecord[]>([]);
  const [changes, setChanges] = useState<ChangeEvent[]>([]);
  const [storedIssues, setStoredIssues] = useState<Issue[]>([]);
  const [storedJourneys, setStoredJourneys] = useState<Journey[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const seedingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUser(readSession());
    setAuthToken(window.sessionStorage.getItem("patchproof.token"));
    setSessionReady(true);
  }, []);

  const accountId = user?.id ?? null;

  useEffect(() => {
    if (!accountId) {
      setWebsiteRecords([]);
      setChanges([]);
      setStoredIssues([]);
      setStoredJourneys([]);
      setEvidence([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const done = new Set<string>();
    const ready = (name: string) => {
      done.add(name);
      if (done.size >= 5) setLoading(false);
    };
    const fail = (message: string) => setError(message);

    const unsubs = [
      websiteService.subscribe(
        accountId,
        (rows) => {
          setWebsiteRecords(rows);
          ready("websites");
        },
        fail,
      ),
      issueService.subscribeChanges(
        accountId,
        (rows) => {
          setChanges(rows);
          ready("changes");
        },
        fail,
      ),
      issueService.subscribeIssues(
        accountId,
        (rows) => {
          setStoredIssues(rows);
          ready("issues");
        },
        fail,
      ),
      journeyService.subscribe(
        accountId,
        (rows) => {
          setStoredJourneys(rows);
          ready("journeys");
        },
        fail,
      ),
      evidenceService.subscribe(
        accountId,
        (rows) => {
          setEvidence(rows);
          ready("evidence");
        },
        fail,
      ),
    ];
    return () => unsubs.forEach((u) => u());
  }, [accountId]);

  /* ------------------------------------------------------------- session */

  const signIn = useCallback((account: Account) => {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(account));
    setUser(account);
  }, []);

  const signOut = useCallback(() => {
    window.sessionStorage.removeItem(SESSION_KEY);
    window.sessionStorage.removeItem("patchproof.token");
    setAuthToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((patch: Partial<Account>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  /* ---------------------------------------------------- derived selectors */

  const issues = useMemo(
    () => [...storedIssues].sort((a, b) => +new Date(b.detectedAt) - +new Date(a.detectedAt)),
    [storedIssues],
  );

  const journeys = useMemo(
    () =>
      storedJourneys
        .map((j) => ({ ...j, status: deriveJourneyStatus(j.status, storedIssues, j.id) }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [storedJourneys, storedIssues],
  );

  const websites = useMemo(
    () =>
      websiteRecords
        .map((w) => deriveWebsiteView(w, storedIssues, storedJourneys, changes))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [websiteRecords, storedIssues, storedJourneys, changes],
  );

  const sortedEvidence = useMemo(
    () => [...evidence].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [evidence],
  );

  /* --------------------------------------------------------------- writes */

  const addWebsite = useCallback(
    async (input: NewWebsite) => {
      if (!accountId) return;
      const record: WebsiteRecord = {
        id: newId("site"),
        name: input.name.trim(),
        client: input.client.trim(),
        url: input.url.trim().replace(/^https?:\/\//, "").replace(/\/$/, ""),
        platform: input.platform.trim(),
        type: input.type.trim() || "Website",
        businessFunctions: input.businessFunctions.map((f) => f.trim()).filter(Boolean),
        createdAt: new Date().toISOString(),
        ...(input.wpUsername ? { wpUsername: input.wpUsername.trim() } : {}),
        ...(input.wpAppPassword ? { wpAppPassword: input.wpAppPassword.trim() } : {}),
      };
      await websiteService.add(accountId, record);
      await journeyService.addMultiple(accountId, deriveJourneys(record));
    },
    [accountId],
  );

  const updateWebsite = useCallback(
    async (id: string, input: NewWebsite) => {
      if (!accountId) return;
      const existing = websiteRecords.find((w) => w.id === id);
      if (!existing) return;
      const record: WebsiteRecord = {
        ...existing,
        name: input.name.trim(),
        client: input.client.trim(),
        url: input.url.trim().replace(/^https?:\/\//, "").replace(/\/$/, ""),
        platform: input.platform.trim(),
        type: input.type.trim() || "Website",
        businessFunctions: input.businessFunctions.map((f) => f.trim()).filter(Boolean),
      };
      await websiteService.update(accountId, record);

      // Re-derive journeys: add new ones, drop journeys whose function was removed.
      const derived = deriveJourneys(record);
      const derivedIds = new Set(derived.map((d) => d.id));
      const current = storedJourneys.filter((j) => j.websiteId === id);
      const toAdd = derived.filter((d) => !current.some((c) => c.id === d.id));
      const toRemove = current.filter((c) => !derivedIds.has(c.id)).map((c) => c.id);
      
      await journeyService.addMultiple(accountId, toAdd);
      await journeyService.removeMultiple(accountId, toRemove);
    },
    [accountId, websiteRecords, storedJourneys],
  );

  const deleteWebsite = useCallback(
    async (id: string) => {
      if (!accountId) return;
      await issueService.removeMultipleChanges(
        accountId,
        changes.filter((c) => c.websiteId === id).map((c) => c.id),
      );
      await issueService.removeMultipleIssues(
        accountId,
        storedIssues.filter((i) => i.websiteId === id).map((i) => i.id),
      );
      await journeyService.removeMultiple(
        accountId,
        storedJourneys.filter((j) => j.websiteId === id).map((j) => j.id),
      );
      await evidenceService.removeMultiple(
        accountId,
        evidence.filter((e) => e.websiteId === id).map((e) => e.id),
      );
      await websiteService.remove(accountId, id);
    },
    [accountId, changes, storedIssues, storedJourneys, evidence],
  );

  /** Primary input -> Firebase -> engine -> derived issue -> Firebase. */
  const reportChange = useCallback(
    async (input: NewChange): Promise<Issue | null> => {
      if (!accountId) return null;
      const website = websiteRecords.find((w) => w.id === input.websiteId);
      if (!website) return null;

      const change: ChangeEvent = {
        id: newId("chg"),
        websiteId: website.id,
        component: input.component.trim(),
        description: input.description.trim(),
        detectedAt: input.detectedAt,
        source: "Manual",
      };
      await issueService.addChange(accountId, change);

      const issue: Issue = { id: newId("ISS"), ...processChange(change, website) };
      await issueService.addIssue(accountId, issue);
      return issue;
    },
    [accountId, websiteRecords],
  );

  const reportChanges = useCallback(
    async (inputs: NewChange[]): Promise<number> => {
      if (!accountId) return 0;
      const newChanges: ChangeEvent[] = [];
      const newIssues: Issue[] = [];
      for (const input of inputs) {
        const website = websiteRecords.find((w) => w.id === input.websiteId);
        if (!website) continue;
        const change: ChangeEvent = {
          id: newId("chg"),
          websiteId: website.id,
          component: input.component.trim(),
          description: input.description.trim(),
          detectedAt: input.detectedAt,
          source: "CSV",
        };
        newChanges.push(change);
        newIssues.push({ id: newId("ISS"), ...processChange(change, website) });
      }
      await issueService.addMultiple(accountId, newChanges, newIssues);
      return newIssues.length;
    },
    [accountId, websiteRecords],
  );

  const deleteIssue = useCallback(
    async (id: string) => {
      if (!accountId) return;
      const issue = storedIssues.find((i) => i.id === id);
      await issueService.removeIssue(accountId, id);
      if (issue) await issueService.removeChange(accountId, issue.changeId);
    },
    [accountId, storedIssues],
  );

  const setIssueStatus = useCallback(
    async (id: string, status: IssueStatus) => {
      if (!accountId) return;
      await issueService.setStatus(accountId, id, status);
    },
    [accountId],
  );

  const setJourneyStatus = useCallback(
    async (id: string, status: JourneyStatus) => {
      if (!accountId) return;
      await journeyService.setStatus(accountId, id, status);
    },
    [accountId],
  );





  const purgeAccountData = useCallback(async () => {
    if (!accountId) return;
    window.localStorage.removeItem(`patchproof.seeded.${accountId}`);
    seedingRef.current = false;
    await removeAllData(accountId);
  }, [accountId]);

  /* ── Backend integration callbacks ── */

  const backendAvailable = isBackendConfigured();

  const scanWebsiteFn = useCallback(
    async (websiteId: string) => {
      if (!accountId) return { ok: false as const, error: "Not logged in" };
      return apiScanWebsite(websiteId, accountId);
    },
    [accountId],
  );

  const applyRepair = useCallback(
    async (issueId: string, wpPassword?: string) => {
      if (!accountId) return { ok: false as const, error: "Not signed in" };
      return apiApplyRepair(issueId, accountId, wpPassword);
    },
    [accountId],
  );

  const undoRepair = useCallback(
    async (issueId: string, wpPassword?: string) => {
      if (!accountId) return { ok: false as const, error: "Not signed in" };
      return apiUndoRepair(issueId, accountId, wpPassword);
    },
    [accountId],
  );

  const triggerLiveValidationFn = useCallback(
    async (journeyId: string) => {
      if (!accountId) return { ok: false as const, error: "Not logged in" };
      return apiTriggerValidation(journeyId, accountId);
    },
    [accountId],
  );



  const value: AppState = {
    user,
    sessionReady,
    signIn,
    signOut,
    updateUser,
    loading: Boolean(accountId) && loading,
    error,
    websites,
    websiteRecords,
    changes,
    issues,
    journeys,
    evidence: sortedEvidence,
    addWebsite,
    updateWebsite,
    deleteWebsite,
    reportChange,
    reportChanges,
    deleteIssue,
    setIssueStatus,
    setJourneyStatus,
    purgeAccountData,
    backendAvailable,
    scanWebsite: scanWebsiteFn,
    applyRepair,
    undoRepair,
    triggerLiveValidation: triggerLiveValidationFn,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used within AppStateProvider");
  return ctx;
}
