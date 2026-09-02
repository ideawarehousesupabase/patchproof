import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Websites are stored without a protocol (see app-state.tsx's addWebsite,
 * which strips it before saving), so anywhere the raw url is used as a link
 * target it needs the protocol added back. Mirrors the heuristic already used
 * when a website is first added (websites.index.tsx) and on the backend
 * (server/src/services/journey-detect.ts's toBaseUrl).
 */
export function toWebsiteHref(url: string): string {
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  const isLocal =
    trimmed.includes("localhost") ||
    trimmed.includes("127.0.0.1") ||
    trimmed.endsWith(".local") ||
    trimmed.endsWith(".test");
  return `${isLocal ? "http://" : "https://"}${trimmed}`;
}
