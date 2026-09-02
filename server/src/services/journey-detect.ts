/**
 * Journey presence detection.
 *
 * Before a journey can meaningfully be validated, the feature it describes has
 * to actually exist on the website. A blank WordPress install has a login page,
 * a search form and a blog, but no checkout and no contact form — running a
 * Playwright validation against those absent features would always "fail" and
 * would never resolve the linked issue.
 *
 * This module probes the live site and decides, per journey, whether the
 * feature is present. It is deliberately generic: each probe is a small,
 * declarative descriptor (markers in the page HTML, REST collections, candidate
 * paths). Supporting a new journey type means adding one entry to the table
 * below — nothing here is specific to any single customer website.
 */
import axios from 'axios';
import { updateJourneyStatus } from './firebase-admin.js';

const TIMEOUT = 10000;
const UA = 'PatchProofAI-JourneyDetect/1.0';

type JourneyProbe = {
  id: string;
  /** Journey name/type keywords this probe applies to (lowercased substring match). */
  match: string[];
  /** Regexes tested against the HTML of the homepage and any `markerPaths`. */
  markers?: RegExp[];
  /** Extra pages whose HTML is also scanned for `markers`. */
  markerPaths?: string[];
  /** REST collections that indicate presence when they return a non-empty array. */
  restCollections?: string[];
  /** Candidate paths — the feature is present if any resolves to a real page. */
  paths?: string[];
};

export const JOURNEY_PROBES: JourneyProbe[] = [
  {
    id: 'donation',
    match: ['donation', 'donate', 'fundrais'],
    markers: [/givewp|give-form|donorbox|justgiving|charitable|gofundme/i],
    paths: ['/donate', '/donation', '/donations'],
  },
  {
    id: 'checkout',
    match: ['checkout', 'cart', 'purchase', 'order', 'shop', 'ecommerce', 'e-commerce', 'transactional'],
    markers: [/woocommerce/i, /add[-_]to[-_]cart/i, /wc-ajax/i, /easy-digital-downloads|bigcommerce|snipcart/i],
    restCollections: ['/wp-json/wc/store/v1/products'],
    paths: ['/checkout', '/cart', '/shop', '/basket', '/store'],
  },
  {
    id: 'booking',
    match: ['booking', 'appointment', 'reservation', 'schedul'],
    markers: [/bookly|amelia|calendly|wc-bookings|booking[-_]form/i],
    paths: ['/booking', '/bookings', '/appointments', '/book-now', '/book'],
  },
  {
    id: 'contact',
    match: ['contact', 'enquiry', 'inquiry', 'lead'],
    markers: [/wpcf7|contact-form-7|gform_wrapper|gravity_form|wpforms|ninja-forms|formidable|hs-form/i],
    paths: ['/contact', '/contact-us', '/get-in-touch', '/enquiry', '/enquiries'],
  },
  {
    id: 'newsletter',
    match: ['newsletter', 'subscribe', 'mailing', 'marketing'],
    markers: [/mailchimp|mc4wp|klaviyo|convertkit|newsletter[-_]form|tnp-subscription/i],
  },
  {
    id: 'login',
    match: ['login', 'sign in', 'signin', 'account', 'member', 'registration', 'signup', 'sign up', 'user access'],
    markers: [/wp-login\.php/i],
    paths: ['/wp-login.php', '/login', '/my-account', '/signin', '/account'],
  },
  {
    id: 'search',
    match: ['search', 'discovery'],
    markers: [
      /role=["']search["']/i,
      /<input[^>]+type=["']search["']/i,
      /<input[^>]+name=["']s["']/i,
      /class=["'][^"']*search-(field|form|submit)/i,
    ],
    markerPaths: ['/?s=patchproof-detection-probe'],
  },
  {
    id: 'blog',
    match: ['blog', 'article', 'news', 'post', 'content'],
    restCollections: ['/wp-json/wp/v2/posts'],
    paths: ['/blog', '/news', '/articles'],
  },
];

const norm = (value: string) => (value || '').toLowerCase().trim();

export const toBaseUrl = (siteUrl: string) =>
  (siteUrl.startsWith('http')
    ? siteUrl
    : siteUrl.includes('localhost') || siteUrl.endsWith('.local')
      ? `http://${siteUrl}`
      : `https://${siteUrl}`
  ).replace(/\/$/, '');

/** Name is matched before type, so "Donation" wins over its "Transactional" type. */
function probeFor(journey: { name?: string; type?: string }): JourneyProbe | undefined {
  const name = norm(journey.name || '');
  const type = norm(journey.type || '');
  return (
    JOURNEY_PROBES.find((p) => p.match.some((m) => name.includes(m))) ??
    JOURNEY_PROBES.find((p) => p.match.some((m) => type.includes(m)))
  );
}

const NOT_FOUND_MARKERS =
  /error404|page not found|nothing found|<title>[^<]*\b404\b/i;

async function fetchHtml(url: string): Promise<{ status: number; html: string; finalUrl: string }> {
  try {
    const res = await axios.get(url, {
      timeout: TIMEOUT,
      maxRedirects: 5,
      validateStatus: () => true,
      headers: { 'User-Agent': UA, Accept: 'text/html,*/*' },
      responseType: 'text',
      transformResponse: [(d) => d],
    });
    const finalUrl = ((res.request as any)?.res?.responseUrl as string) || url;
    return { status: res.status, html: typeof res.data === 'string' ? res.data : '', finalUrl };
  } catch {
    return { status: 0, html: '', finalUrl: url };
  }
}

/** A path counts as present only when it resolves to a real page (not a 404, not a redirect home). */
async function pathExists(baseUrl: string, path: string): Promise<boolean> {
  const { status, html, finalUrl } = await fetchHtml(`${baseUrl}${path}`);
  if (status !== 200) return false;
  if (NOT_FOUND_MARKERS.test(html)) return false;
  // Guard against soft-404s that silently redirect back to the homepage.
  const landedOnRoot = finalUrl.replace(/\/$/, '') === baseUrl;
  const askedForRoot = path === '/' || path.startsWith('/?');
  if (landedOnRoot && !askedForRoot) return false;
  return true;
}

async function restCollectionHasItems(baseUrl: string, path: string): Promise<boolean> {
  try {
    const res = await axios.get(`${baseUrl}${path}`, {
      timeout: TIMEOUT,
      validateStatus: () => true,
      headers: { 'User-Agent': UA, Accept: 'application/json' },
    });
    return res.status === 200 && Array.isArray(res.data) && res.data.length > 0;
  } catch {
    return false;
  }
}

export type JourneyPresence = Record<string, boolean>;

/**
 * Returns a map of journeyId -> present. Journeys with no matching probe are
 * reported as present: absence has to be proven, never assumed.
 */
export async function detectJourneyPresence(
  siteUrl: string,
  journeys: { id: string; name?: string; type?: string }[],
): Promise<JourneyPresence> {
  const baseUrl = toBaseUrl(siteUrl);
  const presence: JourneyPresence = {};
  if (!journeys.length) return presence;

  const probes = journeys.map((journey) => ({ journey, probe: probeFor(journey) }));

  // Collect every distinct request the matched probes need, then issue them all
  // at once. Probing serially would add a multiple of the per-request timeout to
  // every scan; this keeps the whole detection pass close to a single round trip.
  const htmlSources = new Set<string>(['/']);
  const restPaths = new Set<string>();
  const candidatePaths = new Set<string>();

  for (const { probe } of probes) {
    if (!probe) continue;
    if (probe.markers?.length) (probe.markerPaths || []).forEach((p) => htmlSources.add(p));
    (probe.restCollections || []).forEach((p) => restPaths.add(p));
    (probe.paths || []).forEach((p) => candidatePaths.add(p));
  }

  const htmlCache = new Map<string, string>();
  const restCache = new Map<string, boolean>();
  const pathCache = new Map<string, boolean>();

  await Promise.all([
    ...[...htmlSources].map(async (source) => {
      const url = `${baseUrl}${source === '/' ? '' : source}`;
      htmlCache.set(source, (await fetchHtml(url)).html);
    }),
    ...[...restPaths].map(async (path) => {
      restCache.set(path, await restCollectionHasItems(baseUrl, path));
    }),
    ...[...candidatePaths].map(async (path) => {
      pathCache.set(path, await pathExists(baseUrl, path));
    }),
  ]);

  for (const { journey, probe } of probes) {
    if (!probe) {
      presence[journey.id] = true; // custom business function — nothing to probe against
      continue;
    }

    const markerHit =
      !!probe.markers?.length &&
      ['/', ...(probe.markerPaths || [])].some((source) => {
        const html = htmlCache.get(source) || '';
        return html !== '' && probe.markers!.some((m) => m.test(html));
      });

    const restHit = (probe.restCollections || []).some((c) => restCache.get(c) === true);
    const pathHit = (probe.paths || []).some((p) => pathCache.get(p) === true);

    presence[journey.id] = markerHit || restHit || pathHit;
  }

  return presence;
}

/**
 * Decides the status a journey should carry once presence is known.
 * Terminal outcomes of a real validation run (Passed / Failed / Validation
 * Required) are preserved for features that still exist.
 */
export function nextJourneyStatus(current: string | undefined, present: boolean): string {
  if (!present) return 'Not Present';
  if (!current || current === 'Not Present' || current === 'Healthy') return 'Validation Pending';
  return current;
}

/** Probes the site and writes the resulting statuses back to Firestore. Never throws. */
export async function syncJourneyPresence(
  accountId: string,
  siteUrl: string,
  journeys: { id: string; name?: string; type?: string; status?: string }[],
): Promise<void> {
  try {
    const presence = await detectJourneyPresence(siteUrl, journeys);
    for (const journey of journeys) {
      const next = nextJourneyStatus(journey.status, presence[journey.id] !== false);
      if (next !== journey.status) {
        await updateJourneyStatus(accountId, journey.id, next);
        console.log(`Journey ${journey.id} (${journey.name}) -> ${next}`);
      }
    }
  } catch (error: any) {
    console.warn('Journey presence detection failed:', error.message);
  }
}
