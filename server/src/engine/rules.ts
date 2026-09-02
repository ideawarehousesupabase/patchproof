// server/src/engine/rules.ts

export type ImpactLevel = 'High' | 'Medium' | 'Low' | 'Critical';
export type Confidence = 'High' | 'Medium' | 'Low';

export interface ChangeRule {
  id: string;
  category: string;
  keywords: string[];
  severity: number;
  confidence: Confidence;
  impactLevel: ImpactLevel;
  description: string;
}

export const CHANGE_RULES: ChangeRule[] = [
  {
    id: "RULE-PAY-01",
    category: "Payment",
    keywords: ["stripe", "woocommerce", "paypal", "gateway", "checkout", "cart", "payment", "crypto", "pos"],
    severity: 90,
    confidence: "High",
    impactLevel: "Critical",
    description: "Modifies payment processing logic"
  },
  {
    id: "RULE-EML-01",
    category: "Email",
    keywords: ["smtp", "mail", "sendgrid", "mailchimp", "newsletter", "contact", "form", "notification", "wp_mail"],
    severity: 75,
    confidence: "High",
    impactLevel: "High",
    description: "Modifies email delivery systems"
  },
  {
    id: "RULE-PLG-01",
    category: "Plugin Core",
    keywords: ["update", "core", "functions.php", "wp-config", "database", "migration", "schema", "mu-plugins"],
    severity: 85,
    confidence: "Medium",
    impactLevel: "High",
    description: "Core structural modifications"
  },
  {
    id: "RULE-SEC-01",
    category: "Security",
    keywords: ["auth", "login", "register", "password", "captcha", "firewall", "waf", "xss", "sql", "vulnerability"],
    severity: 95,
    confidence: "High",
    impactLevel: "Critical",
    description: "Security or authentication changes"
  },
  {
    id: "RULE-ANA-01",
    category: "Analytics",
    keywords: ["ga4", "gtm", "pixel", "tracking", "analytics", "seo", "sitemap", "meta", "schema"],
    severity: 40,
    confidence: "High",
    impactLevel: "Medium",
    description: "Tracking and SEO modifications"
  },
  {
    id: "RULE-CON-01",
    category: "Content",
    keywords: ["css", "theme", "style", "font", "color", "layout", "elementor", "divi", "gutenberg", "widget"],
    severity: 20,
    confidence: "High",
    impactLevel: "Low",
    description: "Visual or layout adjustments"
  },
  {
    id: "RULE-PER-01",
    category: "Performance",
    keywords: ["cache", "minify", "cdn", "lazy", "optimize", "speed", "redis", "memcached"],
    severity: 60,
    confidence: "Medium",
    impactLevel: "Medium",
    description: "Performance and caching configuration"
  }
];

export const FALLBACK_RULE: ChangeRule = {
  id: "RULE-UNK-01",
  category: "General Update",
  keywords: [],
  severity: 50,
  confidence: "Low",
  impactLevel: "Medium",
  description: "General system update"
};

export const matchRule = (text: string): ChangeRule => {
  if (!text) return FALLBACK_RULE;
  const lowerText = text.toLowerCase();
  for (const rule of CHANGE_RULES) {
    if (rule.keywords.some(keyword => lowerText.includes(keyword))) {
      return rule;
    }
  }
  return FALLBACK_RULE;
};

export interface JourneyTemplate {
  type: string;
  name: string;
  steps: string[];
}

export const JOURNEY_TEMPLATES: JourneyTemplate[] = [
  {
    type: 'checkout',
    name: 'Checkout Flow',
    steps: ['Add to Cart', 'View Cart', 'Enter Shipping', 'Payment', 'Order Confirmation']
  },
  {
    type: 'contact',
    name: 'Contact Form Submission',
    steps: ['Load Contact Page', 'Fill Form Fields', 'Submit Form', 'Verify Success Message']
  },
  {
    type: 'login',
    name: 'User Authentication',
    steps: ['Load Login Page', 'Enter Credentials', 'Submit Login', 'Verify Dashboard Access']
  },
  {
    type: 'search',
    name: 'Search Functionality',
    steps: ['Enter Search Query', 'Submit Search', 'Verify Results Page', 'Click Result']
  },
  {
    type: 'blog_navigation',
    name: 'Blog Navigation',
    steps: ['Load Blog Archive', 'Click Post Title', 'Verify Single Post', 'Test Comment Form']
  }
];

export const normalise = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

export const stableHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).substring(0, 8);
};

export const stableHashNum = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

export const titleCase = (str: string) => str.replace(/\b\w/g, l => l.toUpperCase());

export const bumpSeverity = (score: number, factor: number = 1.2) => Math.min(100, Math.round(score * factor));

export const impactLevel = (score: number): ImpactLevel => {
  if (score >= 90) return 'Critical';
  if (score >= 70) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
};

export const journeySlug = (journeyType: string) => `journey-${normalise(journeyType)}`;

export const deriveJourneys = (ruleCategory: string): string[] => {
  switch (ruleCategory) {
    case 'Payment': return ['checkout'];
    case 'Email': return ['contact'];
    case 'Security': return ['login', 'checkout'];
    case 'Performance': return ['blog_navigation', 'search'];
    default: return ['blog_navigation'];
  }
};

export const templateFor = (type: string) => JOURNEY_TEMPLATES.find(t => t.type === type) || JOURNEY_TEMPLATES[4];

export const processChange = (changeDescription: string, websiteUrl: string) => {
  const rule = matchRule(changeDescription);
  const journeyTypes = deriveJourneys(rule.category);
  
  return {
    rule,
    journeyTypes,
    impact: impactLevel(rule.severity),
    journeys: journeyTypes.map(t => templateFor(t))
  };
};

export const JOURNEY_TYPE_MATCH: Record<string, { frontendTypes: string[]; nameKeywords: string[] }> = {
  checkout:        { frontendTypes: ['Transactional'],                nameKeywords: ['checkout', 'cart', 'donation', 'purchase', 'order'] },
  contact:         { frontendTypes: ['Lead Generation'],              nameKeywords: ['contact', 'enquiry', 'inquiry', 'lead'] },
  login:           { frontendTypes: ['User Access'],                  nameKeywords: ['login', 'sign in', 'account', 'registration', 'signup'] },
  search:          { frontendTypes: ['Discovery'],                    nameKeywords: ['search'] },
  blog_navigation: { frontendTypes: ['Content', 'Business Function'], nameKeywords: ['blog', 'article', 'news', 'content'] },
};

export function matchJourneyId(
  journeys: { id: string; type?: string; name?: string; websiteId: string }[],
  backendJourneyType: string,
  websiteId: string,
): string | undefined {
  const candidates = journeys.filter(j => j.websiteId === websiteId);
  const spec = JOURNEY_TYPE_MATCH[backendJourneyType];
  if (!spec) return undefined;
  const byType = candidates.find(j => spec.frontendTypes.includes(j.type ?? ''));
  if (byType) return byType.id;
  const norm = (s: string) => s.toLowerCase().trim();
  const byName = candidates.find(j => spec.nameKeywords.some(k => norm(j.name ?? '').includes(k)));
  return byName?.id;
}
