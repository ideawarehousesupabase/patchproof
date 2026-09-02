/**
 * Centralised deterministic processing engine.
 *
 * No external AI/ML service is used. The same input always produces the same
 * output: input -> normalisation -> rule matching -> scoring -> generated output.
 *
 * When a real AI implementation is introduced later, only `processChange`
 * (and the helpers below) need to change — the UI consumes the same shapes.
 */
import type {
  ChangeEvent,
  DependencyNode,
  EvidenceRecord,
  Issue,
  Journey,
  JourneyStatus,
  Risk,
  Website,
  WebsiteRecord,
  WebsiteStatus,
} from "./types";

/* ------------------------------------------------------------------ utils */

const normalise = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim();

/** Stable, non-random hash used for deterministic tie-breaking. */
function stableHash(value: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h >>> 0;
}

const titleCase = (value: string) =>
  value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((w) => w[0]!.toUpperCase() + w.slice(1))
    .join(" ");

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function relativeTime(iso: string): string {
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return "—";
  const mins = Math.max(0, Math.round((Date.now() - d) / 60000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

/* -------------------------------------------------------- journey templates */

type JourneyTemplate = {
  match: string[];
  name: string;
  type: string;
  categories: string[];
  steps: string[];
  /** Weight used when scoring business impact. */
  weight: number;
};

export const JOURNEY_TEMPLATES: JourneyTemplate[] = [
  {
    match: ["checkout", "cart", "purchase", "order", "payment"],
    name: "Checkout",
    type: "Transactional",
    categories: ["Functional", "Transactional"],
    steps: [
      "Product Page",
      "Add to Cart",
      "Checkout",
      "Payment Gateway",
      "Payment Confirmation",
      "Order Confirmation",
    ],
    weight: 5,
  },
  {
    match: ["donation", "donate", "fundrais"],
    name: "Donation",
    type: "Transactional",
    categories: ["Functional", "Transactional"],
    steps: ["Donation Page", "Amount Selection", "Payment Gateway", "Thank You Page"],
    weight: 5,
  },
  {
    match: ["booking", "appointment", "reservation", "schedul"],
    name: "Booking",
    type: "Booking",
    categories: ["Functional"],
    steps: ["Services Page", "Slot Selection", "Details Form", "Booking Confirmation"],
    weight: 4,
  },
  {
    match: ["contact", "enquiry", "inquiry", "lead"],
    name: "Contact Form",
    type: "Lead Generation",
    categories: ["Functional", "DNS / Email"],
    steps: ["Contact Page", "Form Submit", "SMTP Handoff", "Email Delivery"],
    weight: 3,
  },
  {
    match: ["login", "sign in", "account", "member"],
    name: "Account Login",
    type: "User Access",
    categories: ["Functional", "User Access"],
    steps: ["Login Page", "Credential Submit", "Account Dashboard"],
    weight: 3,
  },
  {
    match: ["registration", "signup", "sign up", "trial"],
    name: "Registration",
    type: "User Access",
    categories: ["Functional", "User Access"],
    steps: ["Registration Page", "Details Submit", "Verification Email", "Account Created"],
    weight: 3,
  },
  {
    match: ["newsletter", "subscribe", "mailing"],
    name: "Newsletter Signup",
    type: "Marketing",
    categories: ["Functional"],
    steps: ["Signup Form", "Form Submit", "Confirmation Email"],
    weight: 2,
  },
  {
    match: ["search"],
    name: "Site Search",
    type: "Discovery",
    categories: ["Functional"],
    steps: ["Search Input", "Results Page", "Result Selection"],
    weight: 2,
  },
  {
    match: ["blog", "article", "news"],
    name: "Blog",
    type: "Content",
    categories: ["Functional"],
    steps: ["Blog Archive", "Post Page", "Comment Form"],
    weight: 2,
  },
];

function templateFor(businessFunction: string): JourneyTemplate {
  const key = normalise(businessFunction);
  const found = JOURNEY_TEMPLATES.find((t) => t.match.some((m) => key.includes(m)));
  if (found) return found;
  const label = titleCase(businessFunction);
  return {
    match: [key],
    name: label,
    type: "Business Function",
    categories: ["Functional"],
    steps: [`${label} Entry`, `${label} Submission`, `${label} Confirmation`],
    weight: 2,
  };
}

export function journeySlug(websiteId: string, businessFunction: string): string {
  return `${websiteId}--${normalise(businessFunction).replace(/[^a-z0-9]+/g, "-")}`;
}

/** DERIVED: business functions -> protected journeys. */
export function deriveJourneys(website: WebsiteRecord): Journey[] {
  return website.businessFunctions
    .map((fn) => fn.trim())
    .filter(Boolean)
    .map((fn) => {
      const t = templateFor(fn);
      return {
        id: journeySlug(website.id, fn),
        name: t.name === "Business Function" ? titleCase(fn) : t.name,
        websiteId: website.id,
        type: t.type,
        status: "Healthy" as JourneyStatus,
        categories: t.categories,
        steps: t.steps.map((name) => ({ name })),
      };
    });
}

/* ------------------------------------------------------------- change rules */

type ChangeRule = {
  id: string;
  match: string[];
  category: string;
  baseSeverity: Risk;
  impactArea: string;
  titleSuffix: string;
  technical: string[];
  business: string[];
  rootCause: string;
  proposedRepair: string;
  components: string[];
  expectedOutcome: string;
  validation: string[];
  rollbackPlan: string;
  patchLabels: { label: string; current: string; proposed: string }[];
  expectedEffect: string;
  /** Base safety score before adjustments (0-100). */
  baseScore: number;
  confidence: "High" | "Medium" | "Low";
  journeyHints: string[];
};

export const CHANGE_RULES: ChangeRule[] = [
  {
    id: "payment",
    match: ["payment", "stripe", "paypal", "checkout", "gateway", "card"],
    category: "Third-Party Integration",
    baseSeverity: "Critical",
    impactArea: "Checkout / Payment / Revenue",
    titleSuffix: "Modification Detected",
    technical: ["Payment Script", "Checkout Page", "Payment Gateway"],
    business: ["Payment Confirmation", "Order Completion", "Revenue"],
    rootCause:
      "The current payment integration configuration appears incompatible with the website's existing checkout setup.",
    proposedRepair:
      "Restore the compatible payment configuration and update the associated checkout initialisation settings.",
    components: ["Checkout integration", "Payment gateway", "Confirmation flow"],
    expectedOutcome:
      "Restore reliable payment processing without affecting other checkout functionality.",
    validation: ["Checkout initiation", "Payment processing", "Confirmation page"],
    rollbackPlan: "Restore the previous payment configuration if validation fails.",
    patchLabels: [
      { label: "Payment Script", current: "Modified Version", proposed: "Compatible Version" },
      {
        label: "Checkout Integration",
        current: "Current Configuration",
        proposed: "Updated Configuration",
      },
    ],
    expectedEffect: "Restore payment-processing reliability.",
    baseScore: 72,
    confidence: "High",
    journeyHints: ["checkout", "donation"],
  },
  {
    id: "email",
    match: ["smtp", "email", "mail", "spf", "dkim", "dmarc", "dns", "mx"],
    category: "DNS / Email",
    baseSeverity: "High",
    impactArea: "Lead Capture / Communication",
    titleSuffix: "Delivery Risk Detected",
    technical: ["Contact Form", "SMTP Relay", "DNS / Email Authentication"],
    business: ["Email Delivery", "Lead Enquiry"],
    rootCause: "The mail authentication configuration no longer matches the configured sending relay.",
    proposedRepair: "Restore an aligned mail authentication configuration for the sending relay.",
    components: ["Form handler", "SMTP relay", "Email authentication"],
    expectedOutcome: "Restore reliable delivery of outbound enquiry email.",
    validation: ["Form submission", "SMTP handoff", "Email delivery"],
    rollbackPlan: "Restore the previous mail configuration if delivery does not recover.",
    patchLabels: [
      { label: "Mail Authentication", current: "Misaligned Record", proposed: "Aligned Record" },
      { label: "SMTP Relay", current: "Current Configuration", proposed: "Verified Configuration" },
    ],
    expectedEffect: "Restore enquiry email delivery.",
    baseScore: 84,
    confidence: "High",
    journeyHints: ["contact", "newsletter", "registration"],
  },
  {
    id: "plugin",
    match: ["plugin", "module", "extension", "theme", "cms", "update", "version"],
    category: "CMS / Plugin",
    baseSeverity: "Medium",
    impactArea: "Site Functionality",
    titleSuffix: "Change Detected",
    technical: ["Updated Component", "Site Caching Layer", "Page Rendering"],
    business: ["Journey Completion", "Customer Experience"],
    rootCause:
      "A component update introduced a configuration conflict with the site's existing setup.",
    proposedRepair:
      "Adjust the conflicting configuration so the updated component behaves consistently with the baseline.",
    components: ["Updated component", "Site configuration"],
    expectedOutcome: "Restore consistent behaviour of the affected functionality.",
    validation: ["Affected page load", "Form or flow submission", "Confirmation"],
    rollbackPlan: "Restore the previous component version and configuration if validation fails.",
    patchLabels: [
      { label: "Component Configuration", current: "Conflicting", proposed: "Adjusted" },
      { label: "Caching Behaviour", current: "Default", proposed: "Scoped Exclusion" },
    ],
    expectedEffect: "Restore reliable behaviour of the affected journey.",
    baseScore: 68,
    confidence: "Medium",
    journeyHints: [],
  },
  {
    id: "security",
    match: ["ssl", "certificate", "tls", "https", "firewall", "malware", "vulnerab", "security"],
    category: "Security / Certificates",
    baseSeverity: "High",
    impactArea: "Trust and Accessibility",
    titleSuffix: "Security Change Detected",
    technical: ["Certificate / Security Layer", "Web Server", "Browser Trust"],
    business: ["Site Accessibility", "Customer Trust"],
    rootCause: "The site's security configuration diverged from the recorded assurance baseline.",
    proposedRepair: "Reinstate the compliant security configuration for the affected endpoint.",
    components: ["Security configuration", "Web server"],
    expectedOutcome: "Restore a trusted, accessible connection for all visitors.",
    validation: ["Secure connection check", "Key page load", "Journey entry point"],
    rollbackPlan: "Restore the previous security configuration if the site becomes unreachable.",
    patchLabels: [
      { label: "Security Configuration", current: "Divergent", proposed: "Baseline Compliant" },
      { label: "Connection Trust", current: "Warning", proposed: "Trusted" },
    ],
    expectedEffect: "Restore trusted access to the website.",
    baseScore: 76,
    confidence: "High",
    journeyHints: [],
  },
  {
    id: "analytics",
    match: ["analytics", "tag", "gtm", "tracking", "pixel", "consent"],
    category: "Analytics / Tracking",
    baseSeverity: "Low",
    impactArea: "Measurement and Attribution",
    titleSuffix: "Tracking Change Detected",
    technical: ["Tracking Script", "Tag Container", "Consent Layer"],
    business: ["Campaign Attribution", "Reporting Accuracy"],
    rootCause: "A measurement script changed, altering how activity is recorded.",
    proposedRepair: "Restore the expected measurement configuration and consent behaviour.",
    components: ["Tracking script", "Tag configuration"],
    expectedOutcome: "Restore accurate measurement without affecting site functionality.",
    validation: ["Page view event", "Conversion event"],
    rollbackPlan: "Restore the previous tag configuration if events do not fire.",
    patchLabels: [
      { label: "Tracking Script", current: "Modified", proposed: "Baseline Version" },
      { label: "Event Capture", current: "Partial", proposed: "Complete" },
    ],
    expectedEffect: "Restore reliable measurement and attribution.",
    baseScore: 92,
    confidence: "High",
    journeyHints: [],
  },
  {
    id: "content",
    match: ["content", "page", "copy", "image", "layout", "redirect", "url", "seo"],
    category: "Content / Structure",
    baseSeverity: "Low",
    impactArea: "Findability and Experience",
    titleSuffix: "Content Change Detected",
    technical: ["Page Template", "Internal Links", "Redirect Rules"],
    business: ["Journey Entry", "Organic Visibility"],
    rootCause: "A structural or content change altered an existing entry point.",
    proposedRepair: "Restore the expected structure and add a redirect for the previous location.",
    components: ["Page template", "Redirect rules"],
    expectedOutcome: "Preserve existing entry points and journey access.",
    validation: ["Page availability", "Redirect behaviour"],
    rollbackPlan: "Revert the structural change if traffic or journeys are affected.",
    patchLabels: [
      { label: "Page Structure", current: "Changed", proposed: "Baseline Restored" },
      { label: "Redirect", current: "Missing", proposed: "In Place" },
    ],
    expectedEffect: "Preserve access to the affected content.",
    baseScore: 90,
    confidence: "High",
    journeyHints: [],
  },
  {
    id: "performance",
    match: ["performance", "slow", "timeout", "latency", "server", "hosting", "cache", "downtime"],
    category: "Performance / Hosting",
    baseSeverity: "Medium",
    impactArea: "Journey Completion",
    titleSuffix: "Performance Change Detected",
    technical: ["Hosting Layer", "Caching Layer", "Application Response"],
    business: ["Journey Completion", "Customer Experience"],
    rootCause: "A hosting or caching change increased response times beyond the recorded baseline.",
    proposedRepair: "Restore the baseline caching and resource configuration for the affected paths.",
    components: ["Caching configuration", "Hosting resources"],
    expectedOutcome: "Return response times to the assured baseline.",
    validation: ["Key page response time", "Journey completion"],
    rollbackPlan: "Restore the previous hosting configuration if responsiveness degrades further.",
    patchLabels: [
      { label: "Caching Configuration", current: "Changed", proposed: "Baseline" },
      { label: "Response Time", current: "Degraded", proposed: "Within Baseline" },
    ],
    expectedEffect: "Restore expected responsiveness.",
    baseScore: 74,
    confidence: "Medium",
    journeyHints: [],
  },
];

const FALLBACK_RULE: ChangeRule = {
  id: "general",
  match: [],
  category: "General Website Change",
  baseSeverity: "Medium",
  impactArea: "Website Integrity",
  titleSuffix: "Change Detected",
  technical: ["Changed Component", "Dependent Pages"],
  business: ["Journey Completion", "Customer Experience"],
  rootCause: "A change was recorded against the website that diverges from its assurance baseline.",
  proposedRepair: "Restore the affected component to its recorded baseline configuration.",
  components: ["Changed component"],
  expectedOutcome: "Return the website to its assured baseline state.",
  validation: ["Affected page load", "Dependent journey"],
  rollbackPlan: "Reapply the previous configuration if validation fails.",
  patchLabels: [
    { label: "Component State", current: "Changed", proposed: "Baseline Restored" },
    { label: "Dependent Journey", current: "At Risk", proposed: "Protected" },
  ],
  expectedEffect: "Return the affected component to its assured state.",
  baseScore: 70,
  confidence: "Medium",
  journeyHints: [],
};

function matchRule(text: string): ChangeRule {
  const key = normalise(text);
  let best: { rule: ChangeRule; hits: number } | null = null;
  for (const rule of CHANGE_RULES) {
    const hits = rule.match.filter((m) => key.includes(m)).length;
    if (hits > 0 && (!best || hits > best.hits)) best = { rule, hits };
  }
  return best?.rule ?? FALLBACK_RULE;
}

const SEVERITY_ORDER: Risk[] = ["Low", "Medium", "High", "Critical"];
const bumpSeverity = (severity: Risk, by: number): Risk =>
  SEVERITY_ORDER[Math.min(SEVERITY_ORDER.length - 1, Math.max(0, SEVERITY_ORDER.indexOf(severity) + by))]!;

const impactLevel = (weight: number) =>
  weight >= 5 ? "Critical Impact" : weight >= 3 ? "High Impact" : "Medium Impact";

/* ------------------------------------------------------- primary processing */

export type ProcessedChange = Omit<Issue, "id">;

/**
 * CORE ENGINE ENTRY POINT.
 * Primary data (website + change) -> normalisation -> rule matching ->
 * scoring/prioritisation -> derived issue.
 */
export function processChange(change: ChangeEvent, website: WebsiteRecord): ProcessedChange {
  const text = `${change.component} ${change.description}`;
  const rule = matchRule(text);

  // Which protected journey does this change touch?
  const journeys = deriveJourneys(website);
  const hintMatch = journeys.find((j) => {
    const key = normalise(`${j.name} ${j.type}`);
    return (
      rule.journeyHints.some((h) => key.includes(h)) ||
      normalise(text).includes(normalise(j.name)) ||
      j.steps.some((s) => normalise(text).includes(normalise(s.name)))
    );
  });
  const journey = hintMatch ?? journeys[0];
  const journeyWeight = journey ? templateFor(journey.name).weight : 1;

  // Deterministic severity: rule baseline adjusted by the weight of the journey it touches.
  let severity = rule.baseSeverity;
  if (journeyWeight >= 5 && rule.id !== "analytics" && rule.id !== "content") {
    severity = bumpSeverity(severity, 1);
  } else if (journeyWeight <= 2) {
    severity = bumpSeverity(severity, -1);
  }

  // Deterministic safety score.
  const dependencyCount = rule.technical.length + rule.business.length;
  const severityPenalty = SEVERITY_ORDER.indexOf(severity) * 6;
  const dependencyPenalty = Math.min(15, dependencyCount * 2);
  const stability = stableHash(`${change.component}|${change.description}`) % 5; // 0-4, deterministic
  const score = Math.max(20, Math.min(98, rule.baseScore - severityPenalty - dependencyPenalty + stability));

  const riskLevel: Risk = score >= 85 ? "Low" : score >= 65 ? "Medium" : score >= 45 ? "High" : "Critical";
  const decision =
    riskLevel === "Low"
      ? "Eligible for automatic execution"
      : riskLevel === "Medium"
        ? "Human Approval Required"
        : riskLevel === "High"
          ? "Escalated for senior review"
          : "Blocked — unsafe to automate";

  const dependencies: DependencyNode[] = [
    ...rule.technical.map((label) => ({ label, kind: "technical" as const })),
    ...(journey ? [{ label: `${journey.name} Journey`, kind: "business" as const }] : []),
    ...rule.business.map((label) => ({ label, kind: "business" as const })),
  ];

  const impactCards = [
    { label: journey ? `${journey.name} Completion` : "Journey Completion", level: impactLevel(journeyWeight) },
    { label: rule.impactArea, level: impactLevel(SEVERITY_ORDER.indexOf(severity) + 2) },
    ...rule.business.slice(0, 2).map((b) => ({ label: b, level: "Medium Impact" })),
  ];

  const title = `${titleCase(change.component.replace(/\.[a-z0-9]+$/i, ""))} ${rule.titleSuffix}`;

  return {
    changeId: change.id,
    websiteId: website.id,
    title,
    category: rule.category,
    severity,
    businessImpact: journey ? `${journey.name} — ${rule.impactArea}` : rule.impactArea,
    status: riskLevel === "Low" ? "Repair Proposed" : "Awaiting Approval",
    detected: formatDateTime(change.detectedAt),
    detectedAt: change.detectedAt,
    component: change.component,
    description:
      change.description.trim() ||
      `A change was detected in ${change.component} on ${website.name}. PatchProof has analysed the affected components and dependent business journeys.`,
    impactCards,
    dependencies,
    repair: {
      rootCause: rule.rootCause,
      proposedRepair: rule.proposedRepair,
      components: rule.components,
      expectedOutcome: rule.expectedOutcome,
      validationRequired: journey
        ? [...rule.validation, `${journey.name} journey`]
        : rule.validation,
      rollbackPlan: rule.rollbackPlan,
    },
    safety: {
      score,
      riskLevel,
      decision,
      factors: [
        { label: "Repair Confidence", value: rule.confidence },
        { label: "Dependency Exposure", value: dependencyCount >= 6 ? "High" : dependencyCount >= 4 ? "Medium" : "Low" },
        { label: "Business Impact", value: journeyWeight >= 5 ? "Critical" : journeyWeight >= 3 ? "High" : "Medium" },
        { label: "Operational Uncertainty", value: riskLevel === "Low" ? "Low" : riskLevel === "Medium" ? "Medium" : "High" },
      ],
    },
    patchPreview: {
      current: rule.patchLabels.map((p) => ({ label: p.label, value: p.current })),
      proposed: rule.patchLabels.map((p) => ({ label: p.label, value: p.proposed })),
      expectedEffect: rule.expectedEffect,
      journeyAffected: journey?.name ?? "No linked journey",
      riskLevel,
      rollback: "Available",
      validationRequired: journey ? `${journey.name} journey` : "Affected component checks",
    },
    ...(journey ? { journeyId: journey.id } : {}),
  };
}

/* ------------------------------------------------------------ derived views */

const OPEN_STATUSES = new Set([
  "Detected",
  "Analysed",
  "Repair Proposed",
  "Awaiting Approval",
  "Approved",
  "Validation Required",
]);

export const isOpen = (issue: Issue) => OPEN_STATUSES.has(issue.status);

/** DERIVED: website record + related records -> the website view used by the UI. */
export function deriveWebsiteView(
  website: WebsiteRecord,
  issues: Issue[],
  journeys: Journey[],
  changes: ChangeEvent[],
): Website {
  const mine = issues.filter((i) => i.websiteId === website.id);
  const open = mine.filter(isOpen);
  const myChanges = [...changes.filter((c) => c.websiteId === website.id)].sort(
    (a, b) => +new Date(b.detectedAt) - +new Date(a.detectedAt),
  );

  let status: WebsiteStatus = "Healthy";
  if (open.some((i) => i.severity === "Critical" || i.severity === "High")) status = "Critical";
  else if (open.length > 0) status = "Attention Required";

  const lastEvent = myChanges[0]?.detectedAt ?? website.createdAt;

  const thirdParty = Array.from(
    new Set(mine.filter((i) => i.category.includes("Integration")).map((i) => i.component)),
  );

  return {
    ...website,
    status,
    openIssues: open.length,
    protectedJourneys: journeys.filter((j) => j.websiteId === website.id).length,
    lastChecked: relativeTime(lastEvent),
    baseline: {
      ssl: mine.some((i) => isOpen(i) && i.category.startsWith("Security")) ? "Attention Required" : "Active",
      dns: mine.some((i) => isOpen(i) && i.category.startsWith("DNS")) ? "Attention Required" : "Healthy",
      components: `${myChanges.length} recorded change${myChanges.length === 1 ? "" : "s"}`,
      thirdParty: thirdParty.length ? thirdParty.join(", ") : "None recorded",
      businessFunctions: website.businessFunctions.length
        ? website.businessFunctions.join(", ")
        : "None recorded",
      lastBaseline: formatDateTime(website.createdAt),
    },
    recentChanges: myChanges.slice(0, 6).map((c) => {
      const issue = mine.find((i) => i.changeId === c.id);
      return {
        change: c.component,
        when: formatDateTime(c.detectedAt),
        risk: issue?.severity ?? "Low",
        outcome: issue ? issue.status : "Recorded",
      };
    }),
  };
}

/** DERIVED: proof-of-repair evidence for a completed workflow. */
export function buildEvidence(
  issue: Issue,
  journey: Journey | undefined,
  completedAt: string,
): Omit<EvidenceRecord, "id"> {
  const chain = issue.dependencies.map((d) => d.label).join(" → ");
  return {
    websiteId: issue.websiteId,
    issueId: issue.id,
    issue: issue.title,
    risk: issue.severity,
    outcome: "Resolved",
    date: formatDate(completedAt),
    createdAt: completedAt,
    status: "Verified",
    businessImpact: issue.businessImpact,
    dependencyChain: chain,
    proposedRepair: issue.repair.proposedRepair,
    safety: `${issue.safety.riskLevel} Risk — ${issue.safety.decision}`,
    approval: "Approved",
    patchPreview: "Reviewed",
    repairStatus: "Applied",
    validationPerformed: journey ? `${journey.name} Journey` : "Component checks",
    validationOutcome: "Passed",
    rollback: "Not required",
    before: [
      { label: journey ? `${journey.name} Journey` : "Affected Component", value: "At Risk" },
      ...issue.patchPreview.current,
    ],
    after: [
      { label: journey ? `${journey.name} Journey` : "Affected Component", value: "Passed" },
      ...issue.patchPreview.proposed,
    ],
    timeline: [
      { stage: "Issue detected", time: issue.detected },
      { stage: "Dependencies analysed", time: issue.detected },
      { stage: "Repair proposed", time: issue.detected },
      { stage: "Repair approved", time: formatDateTime(completedAt) },
      { stage: "Repair applied", time: formatDateTime(completedAt) },
      { stage: "Journey validated", time: formatDateTime(completedAt) },
      { stage: "Evidence verified", time: formatDateTime(completedAt) },
    ],
  };
}

/** DERIVED: journey status from the issues that touch it. */
export function deriveJourneyStatus(base: JourneyStatus, issues: Issue[], journeyId: string): JourneyStatus {
  if (base === "Passed" || base === "Failed" || base === "Validation Required" || base === "Not Present") return base;
  const linked = issues.filter((i) => i.journeyId === journeyId && isOpen(i));
  if (linked.some((i) => i.status === "Validation Required")) return "Validation Required";
  return linked.length ? "At Risk" : base;
}

/* --------------------------------------------------------------- CSV import */

export type ParsedChangeRow = {
  websiteRef: string;
  component: string;
  description: string;
  detectedAt: string;
};

export function parseChangesCsv(text: string): { rows: ParsedChangeRow[]; errors: string[] } {
  const errors: string[] = [];
  const rows: ParsedChangeRow[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { rows, errors: ["The CSV needs a header row and at least one data row."] };
  }

  const header = splitCsvLine(lines[0]!).map((h) => normalise(h));
  const idx = (name: string) => header.indexOf(name);
  const iWebsite = idx("website");
  const iComponent = idx("component");
  const iDescription = idx("description");
  const iDetected = idx("detected_at");

  if (iWebsite < 0 || iComponent < 0) {
    return {
      rows,
      errors: ["CSV header must include at least: website, component, description, detected_at"],
    };
  }

  lines.slice(1).forEach((line, n) => {
    const cells = splitCsvLine(line);
    const websiteRef = (cells[iWebsite] ?? "").trim();
    const component = (cells[iComponent] ?? "").trim();
    if (!websiteRef || !component) {
      errors.push(`Row ${n + 2}: website and component are required.`);
      return;
    }
    const rawDate = iDetected >= 0 ? (cells[iDetected] ?? "").trim() : "";
    const parsed = rawDate ? new Date(rawDate) : new Date();
    if (rawDate && Number.isNaN(parsed.getTime())) {
      errors.push(`Row ${n + 2}: "${rawDate}" is not a valid date.`);
      return;
    }
    rows.push({
      websiteRef,
      component: component.slice(0, 160),
      description: (iDescription >= 0 ? (cells[iDescription] ?? "") : "").trim().slice(0, 1000),
      detectedAt: parsed.toISOString(),
    });
  });

  return { rows, errors };
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else current += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      out.push(current);
      current = "";
    } else current += ch;
  }
  out.push(current);
  return out;
}
