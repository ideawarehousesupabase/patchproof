/**
 * Demo dataset — realistic primary data (websites + changes) that is pushed
 * through the same deterministic engine the app uses for real input, so every
 * section (Websites, Issues, Journeys, Evidence) is populated consistently.
 *
 * Everything produced here is written to Firebase through the normal data
 * store, exactly like user-entered data.
 */
import { buildEvidence, deriveJourneys, processChange } from "./engine";
import type { ChangeEvent, EvidenceRecord, Issue, Journey, WebsiteRecord } from "./types";

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

type Seed = {
  site: Omit<WebsiteRecord, "createdAt">;
  changes: { component: string; description: string; hoursAgo: number }[];
  /** Indexes of the site's changes whose issue should be completed (evidence). */
  resolve: number[];
};

const SEEDS: Seed[] = [
  {
    site: {
      id: "demo-brightcart",
      name: "BrightCart UK",
      client: "BrightCart Retail Ltd",
      url: "brightcart.co.uk",
      platform: "WooCommerce",
      type: "E-commerce",
      businessFunctions: ["Checkout", "Contact Form", "Account Registration"],
    },
    changes: [
      {
        component: "payments.js",
        description:
          "Payment provider script updated to an unverified version on the checkout page.",
        hoursAgo: 6,
      },
      {
        component: "Contact form plugin",
        description: "Contact form plugin updated, SMTP email routing configuration changed.",
        hoursAgo: 52,
      },
    ],
    resolve: [1],
  },
  {
    site: {
      id: "demo-greenclinic",
      name: "Green Clinic",
      client: "Green Clinic Group",
      url: "greenclinic.co.uk",
      platform: "WordPress",
      type: "Healthcare",
      businessFunctions: ["Appointment Booking", "Contact Form"],
    },
    changes: [
      {
        component: "Booking calendar plugin",
        description: "Booking calendar plugin upgraded; availability slots API endpoint changed.",
        hoursAgo: 20,
      },
    ],
    resolve: [],
  },
  {
    site: {
      id: "demo-harbourtrust",
      name: "Harbour Trust",
      client: "Harbour Community Trust",
      url: "harbourtrust.org.uk",
      platform: "Drupal",
      type: "Charity",
      businessFunctions: ["Donation", "Contact Form"],
    },
    changes: [
      {
        component: "SSL certificate",
        description: "SSL certificate renewed with a new issuer chain on the donation subdomain.",
        hoursAgo: 96,
      },
    ],
    resolve: [0],
  },
];

export type DemoDataset = {
  websites: WebsiteRecord[];
  changes: ChangeEvent[];
  issues: Issue[];
  journeys: Journey[];
  evidence: EvidenceRecord[];
};

export function buildDemoDataset(): DemoDataset {
  const websites: WebsiteRecord[] = [];
  const changes: ChangeEvent[] = [];
  const issues: Issue[] = [];
  const journeys: Journey[] = [];
  const evidence: EvidenceRecord[] = [];

  for (const seed of SEEDS) {
    const website: WebsiteRecord = { ...seed.site, createdAt: hoursAgo(24 * 30) };
    websites.push(website);

    const siteJourneys = deriveJourneys(website);
    journeys.push(...siteJourneys);

    seed.changes.forEach((c, index) => {
      const change: ChangeEvent = {
        id: `${website.id}-chg-${index + 1}`,
        websiteId: website.id,
        component: c.component,
        description: c.description,
        detectedAt: hoursAgo(c.hoursAgo),
        source: "Manual",
      };
      changes.push(change);

      const resolved = seed.resolve.includes(index);
      const base = processChange(change, website);
      const issue: Issue = {
        id: `${website.id.toUpperCase()}-ISS-${index + 1}`,
        ...base,
        status: resolved ? "Resolved" : base.status,
      };
      issues.push(issue);

      if (resolved) {
        const journey = siteJourneys.find((j) => j.id === issue.journeyId);
        const completedAt = hoursAgo(Math.max(1, c.hoursAgo - 4));
        evidence.push({
          id: `PR-${website.id.slice(5).toUpperCase()}-${index + 1}`,
          ...buildEvidence(issue, journey, completedAt),
        });
        if (journey) journey.status = "Passed";
      }
    });
  }

  return { websites, changes, issues, journeys, evidence };
}
