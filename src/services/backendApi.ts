/**
 * PatchProof Backend API Client
 *
 * Communicates with the Node.js backend server hosted on Render.com.
 * All calls are optional — if VITE_BACKEND_URL is not set, the app
 * continues to work in mock/demo mode using the existing frontend engine.
 */

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string | undefined)?.trim().replace(/\/$/, "") || "";
const API_KEY = (import.meta.env.VITE_BACKEND_API_KEY as string | undefined)?.trim() || "";

// Module-level auth token storage
let _authToken: string | null = null;

/** Set the JWT auth token for all subsequent API calls. */
export function setAuthToken(token: string | null): void {
  _authToken = token;
}

/** Get the current auth token. */
export function getAuthToken(): string | null {
  return _authToken;
}

/** Returns true if a real backend server is configured. */
export function isBackendConfigured(): boolean {
  return Boolean(BACKEND_URL);
}

async function apiCall<T>(
  method: "GET" | "POST",
  path: string,
  body?: Record<string, unknown>,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  if (!BACKEND_URL) {
    return { ok: false, error: "Backend server is not configured. Set VITE_BACKEND_URL in your .env file." };
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    };

    // Attach JWT Bearer token if available
    if (_authToken) {
      headers["Authorization"] = `Bearer ${_authToken}`;
    }

    const response = await fetch(`${BACKEND_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        ok: false,
        error: (json as { error?: string }).error || `Server returned ${response.status}`,
      };
    }

    return { ok: true, data: json as T };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    // Friendly error for common issues
    if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
      return {
        ok: false,
        error: "Cannot reach the PatchProof backend server. It may be starting up — please try again in 30 seconds.",
      };
    }

    return { ok: false, error: message };
  }
}

// ─── API Functions ──────────────────────────────────────────────────────────

export type LoginResult = {
  token: string;
  account: {
    id: string;
    fullName: string;
    agencyName: string;
    email: string;
  };
};

/** Authenticate with the backend and receive a JWT token. */
export async function login(
  email: string,
  password: string,
): Promise<{ ok: true; data: LoginResult } | { ok: false; error: string }> {
  return apiCall<LoginResult>("POST", "/api/auth/login", { email, password });
}

export type ScanResult = {
  issuesFound: number;
  pluginsScanned: number;
  vulnerablePlugins: string[];
};

/** Triggers a real WordPress website scan via the backend. */
export async function scanWebsite(
  websiteId: string,
  accountId: string,
): Promise<{ ok: true; data: ScanResult } | { ok: false; error: string }> {
  return apiCall<ScanResult>("POST", `/api/scan/${websiteId}`, { accountId });
}

export type RepairResult = {
  success: boolean;
  backupId: string;
  message: string;
  canUndo: boolean;
  manualInstructions?: string;
};

/** Applies a low-risk repair (plugin update) via the backend. */
export async function applyRepair(
  issueId: string,
  accountId: string,
  wpPassword?: string,
): Promise<{ ok: true; data: RepairResult } | { ok: false; error: string }> {
  return apiCall<RepairResult>("POST", `/api/repair/${issueId}`, { accountId, wpPassword });
}

/** Undoes a previously applied repair by restoring the backup. */
export async function undoRepair(
  issueId: string,
  accountId: string,
  wpPassword?: string,
): Promise<{ ok: true; data: { success: boolean; message: string } } | { ok: false; error: string }> {
  return apiCall<{ success: boolean; message: string }>("POST", `/api/undo/${issueId}`, { accountId, wpPassword });
}

export type ValidateResult = {
  triggered: boolean;
  message: string;
};

/** Triggers a real Playwright journey validation via GitHub Actions. */
export async function triggerValidation(
  journeyId: string,
  accountId: string,
): Promise<{ ok: true; data: ValidateResult } | { ok: false; error: string }> {
  return apiCall<ValidateResult>("POST", `/api/validate/${journeyId}`, { accountId });
}

/** Checks if the backend server is reachable. */
export async function checkBackendHealth(): Promise<boolean> {
  if (!BACKEND_URL) return false;
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`, { method: "GET" });
    return response.ok;
  } catch {
    return false;
  }
}
