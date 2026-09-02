import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getWebsite, saveIssue, saveChange } from '../services/firebase-admin.js';
import { fetchPlugins } from '../services/wordpress.js';
import { checkVulnerabilities } from '../services/scanner.js';
import { processChange } from '../engine/rules.js';
import { canAutoApply } from '../engine/safety.js';
import crypto from 'crypto';

const router = Router();

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

    const issues = [];
    const changes = [];

    for (const result of scanResults) {
      if (result.is_vulnerable) {
        const vuln = result.vulnerabilities[0];
        const engineResult = processChange(`${result.slug} vulnerability: ${vuln.title}`, website.url);
        
        // Mock safety score logic (in real world, base on tests & community data)
        const safetyScore = 80 + Math.floor(Math.random() * 15);
        const autoApply = canAutoApply(safetyScore, result.slug);

        const issueId = crypto.randomUUID();
        const issue = {
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
          repair: {
            rootCause: `Outdated plugin ${result.slug} containing known vulnerability: ${vuln.title}`,
            proposedRepair: `Update ${result.slug} from ${result.version} to ${vuln.fixed_in || 'latest'}`,
            components: [result.slug],
            expectedOutcome: 'Vulnerability patched securely.',
            validationRequired: ['Plugin functionality', 'Core dependent journeys'],
            rollbackPlan: 'Revert to previous version using WP Rollback.'
          },
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

        await saveIssue(accountId, issue);
        issues.push(issue);

        // Save related journeys
        for (const journeyTemplate of engineResult.journeys) {
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
    }

    res.json({ success: true, issuesFound: issues.length, pluginsScanned: plugins.length, issues });

  } catch (error: any) {
    console.error('Scan Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error during scan' });
  }
});

export default router;
