/**
 * WPScan result cache.
 *
 * The free WPScan API tier allows a small number of requests per day, and
 * `checkVulnerabilities` queries it once per installed plugin — a single scan
 * of a normal WordPress site (which usually has a handful of bundled plugins
 * even on a "blank" install) can use a large share of the daily quota by
 * itself, and re-scanning the same site minutes later re-queries the exact
 * same plugin+version pairs for no reason.
 *
 * A given plugin version's known vulnerabilities are effectively static
 * (WPScan's data for `slug@version` doesn't change minute to minute), so
 * caching the response in Firestore — shared across every account, and
 * persisting across server restarts/redeploys, unlike an in-memory cache —
 * turns N re-scans of an unchanged site into 1 real API call plus N free
 * cache hits.
 */
import { getFirestoreDb } from './firebase-admin.js';

const COLLECTION = 'wpscan_cache';
const DEFAULT_TTL_HOURS = 24;

function cacheKey(slug: string, version: string): string {
  // Firestore document IDs can't contain "/"; plugin slugs sometimes do (e.g. "akismet/akismet.php").
  const safeSlug = slug.replace(/\//g, '__');
  return `${safeSlug}@${version || 'unknown'}`;
}

export type CachedVulnerabilities = {
  vulnerabilities: { title: string; severity: 'High' | 'Medium'; fixed_in: string }[];
  is_vulnerable: boolean;
};

type CacheEntry = CachedVulnerabilities & { fetchedAt: string };

/**
 * Returns a cached entry if one exists. `allowStale: true` returns it
 * regardless of age (used as a last resort when the live API is rate
 * limited) — otherwise entries older than the TTL are treated as a miss.
 */
export async function getCachedResult(
  slug: string,
  version: string,
  opts: { allowStale?: boolean; ttlHours?: number } = {},
): Promise<CachedVulnerabilities | null> {
  try {
    const db = getFirestoreDb();
    const doc = await db.collection(COLLECTION).doc(cacheKey(slug, version)).get();
    if (!doc.exists) return null;

    const data = doc.data() as CacheEntry;
    if (!opts.allowStale) {
      const ttlHours = opts.ttlHours ?? DEFAULT_TTL_HOURS;
      const ageMs = Date.now() - new Date(data.fetchedAt).getTime();
      if (ageMs > ttlHours * 60 * 60 * 1000) return null;
    }

    return { vulnerabilities: data.vulnerabilities, is_vulnerable: data.is_vulnerable };
  } catch (err: any) {
    console.warn(`WPScan cache read failed for ${slug}@${version}:`, err.message);
    return null;
  }
}

/** Best-effort write — a cache failure should never fail the scan itself. */
export async function setCachedResult(
  slug: string,
  version: string,
  result: CachedVulnerabilities,
): Promise<void> {
  try {
    const db = getFirestoreDb();
    const entry: CacheEntry = { ...result, fetchedAt: new Date().toISOString() };
    await db.collection(COLLECTION).doc(cacheKey(slug, version)).set(entry);
  } catch (err: any) {
    console.warn(`WPScan cache write failed for ${slug}@${version}:`, err.message);
  }
}
