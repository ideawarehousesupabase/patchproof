import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getWebsite, saveIssue, saveChange, getJourneysForWebsite } from '../services/firebase-admin.js';
import { fetchPlugins } from '../services/wordpress.js';
import { checkVulnerabilities } from '../services/scanner.js';
import { processChange, matchJourneyId, stableHashNum } from '../engine/rules.js';
import { canAutoApply, isCriticalPlugin } from '../engine/safety.js';
import { generateRepairPlaybook } from '../engine/playbooks.js';
import crypto from 'crypto';

const router = Router();

function computeSafetyScore(vulnSeverity: 'High' | 'Medium', pluginSlug: string, confidence: 'High' | 'Medium' | 'Low', currentVersion: string): number {
  let score = 90;
  score -= vulnSeverity === 'High' ? 20 : 8;
  score -= isCriticalPlugin(pluginSlug) ? 15 : 0;
  score -= confidence === 'Low' ? 10 : confidence === 'Medium' ? 5 : 0;
  const tie = stableHashNum(`${pluginSlug}|${currentVersion}`) % 5;
  return Math.max(20, Math.min(98, score + tie));
}

router.post('/:websiteId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { websiteId } = req.params;
    const { accountId } = req.body;

    if (!accountId) {
      return res.status(400).json({ error: 'accountId is required' });
    }

    const website = await getWebsite(accountId, websiteId);

    if (!website.wpUsername || !website.wpAppPassword) {
      return res.status(400).json({ error: 'WordPress credentials not found for this website' });
    }

    const plugins = await fetchPlugins(website.url, website.wpUsername, website.wpAppPassword);
    const scanResults = await checkVulnerabilities(plugins);

    // Fetch journeys once for the entire scan (same website for every plugin)
    const journeys = await getJourneysForWebsite(accountId, websiteId);

    const issues = [];
    const changes = [];

    for (const result of scanResults) {
      if (result.is_vulnerable) {
        const vuln = result.vulnerabilities[0];
        const engineResult = processChange(`${result.slug} vulnerability: ${vuln.title}`, website.url);
        
        // Deterministic safety score using real signals
        const safetyScore = computeSafetyScore(vuln.severity, result.slug, engineResult.rule.confidence, result.version);
        const autoApply = canAutoApply(safetyScore, result.slug);

        // Try to link this issue to a real Firestore journey
        let matchedJourneyId: string | undefined;
        for (const jType of engineResult.journeyTypes) {
          matchedJourneyId = matchJourneyId(journeys, jType, websiteId);
          if (matchedJourneyId) break;
        }
        if (!matchedJourneyId) {
          console.warn(`No matching journey found for issue in ${result.slug} (types: ${engineResult.journeyTypes.join(', ')})`);
        }

        const issueId = crypto.randomUUID();
        const issue: Record<string, any> = {
          id: issueId,
          changeId: crypto.randomUUID(),
          websiteId,
          title: `Vulnerability in ${result.slug}`,
          category: engineResult.rule.category,
          businessImpact: engineResult.impact,
          description: vuln.title,
          severity: vuln.severity,
          status: 'Awaiting Approval',
          component: 'Plugin',
          componentName: result.slug,
          currentVersion: result.version,
          targetVersion: vuln.fixed_in || 'latest',
          detected: new Date().toISOString(),
          detectedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          autoApplyAllowed: autoApply,
          safetyScore,
          impactCards: [
             { label: 'Security Risk', level: vuln.severity },
             { label: 'Business Journey', level: engineResult.impact }
          ],
          dependencies: [
             { label: result.slug, kind: 'technical' },
             { label: 'WordPress Core', kind: 'technical' }
          ],
          repair: generateRepairPlaybook(result.slug, result.version, vuln.fixed_in || 'latest', vuln),
          safety: {
            score: safetyScore,
            riskLevel: autoApply ? 'Low' : 'Medium',
            decision: autoApply ? 'Eligible for auto-apply' : 'Human review required',
            factors: [
              { label: 'Plugin Popularity', value: 'High' },
              { label: 'Update Scope', value: 'Minor Patch' }
            ]
          },
          patchPreview: {
            current: [
               { label: 'Version', value: result.version },
               { label: 'Status', value: 'Vulnerable' }
            ],
            proposed: [
               { label: 'Version', value: vuln.fixed_in || 'latest' },
               { label: 'Status', value: 'Secure' }
            ],
            expectedEffect: 'Secure the application without altering functionality.',
            journeyAffected: engineResult.journeys.length > 0 ? engineResult.journeys[0].name : 'Site Reliability',
            riskLevel: autoApply ? 'Low' : 'Medium',
            rollback: 'Supported',
            validationRequired: 'Automated Playwright tests'
          }
        };

        // Only add journeyId if we found a match (matches frontend convention)
        if (matchedJourneyId) {
          issue.journeyId = matchedJourneyId;
        }

        await saveIssue(accountId, issue);
        issues.push(issue);

        // Save one change doc per issue (not per journey template — fix duplicate write bug)
        const change = {
          id: crypto.randomUUID(),
          websiteId,
          issueId,
          component: result.slug,
          description: `Update ${result.slug} to patch vulnerability`,
          category: engineResult.rule.category,
          impact: engineResult.impact,
          safetyScore,
          status: 'Proposed',
          journeys: engineResult.journeyTypes,
          detectedAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
        await saveChange(accountId, change);
        changes.push(change);
      }
    }

    res.json({ success: true, issuesFound: issues.length, pluginsScanned: plugins.length, issues });

  } catch (error: any) {
    console.error('Scan Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error during scan' });
  }
});

export default router;
