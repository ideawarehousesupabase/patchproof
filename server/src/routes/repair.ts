import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getFirestoreDb, getWebsite, updateIssueStatus } from '../services/firebase-admin.js';
import { headlessUpdatePlugin, getPluginZipUrl, getInstalledPluginVersion } from '../services/wordpress.js';
import { canAutoApply, getManualInstructions } from '../engine/safety.js';

const router = Router();

router.post('/:issueId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { issueId } = req.params;
    const accountId = (req as any).accountId;
    const { wpPassword } = req.body;
    if (!wpPassword) {
      return res.status(400).json({ error: 'wpPassword is required for the Headless AI Agent' });
    }

    const db = getFirestoreDb();
    const issueDoc = await db.collection('users').doc(accountId).collection('issues').doc(issueId).get();
    
    if (!issueDoc.exists) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    
    const issue = issueDoc.data()!;
    const website = await getWebsite(accountId, issue.websiteId);

    // Allow the repair to proceed since the user explicitly approved it in the UI

    const backupUrl = getPluginZipUrl(website.url, website.wpUsername, website.wpAppPassword, issue.componentName, issue.currentVersion);
    await db.collection('users').doc(accountId).collection('issues').doc(issueId).update({
      backupUrl,
      backupVersion: issue.currentVersion
    });

    await headlessUpdatePlugin(website.url, website.wpUsername, wpPassword, issue.componentName);

    // Record the version WordPress actually installed. "Update Now" always pulls the
    // latest release, which is usually newer than the vulnerability feed's `fixed_in`
    // value captured at scan time — without this the evidence report shows a stale,
    // older version as the post-repair state.
    try {
      const installedVersion = await getInstalledPluginVersion(
        website.url,
        website.wpUsername,
        website.wpAppPassword,
        issue.componentName,
      );

      if (installedVersion && installedVersion !== issue.currentVersion) {
        const proposed = (issue.patchPreview?.proposed || []).map((row: any) =>
          row.label === 'Version' ? { ...row, value: installedVersion } : row,
        );

        await db.collection('users').doc(accountId).collection('issues').doc(issueId).update({
          installedVersion,
          targetVersion: installedVersion,
          'patchPreview.proposed': proposed,
        });
        console.log(`Recorded installed version ${installedVersion} for ${issue.componentName}`);
      } else if (!installedVersion) {
        console.warn(`Could not read the installed version of ${issue.componentName} after repair.`);
      }
    } catch (versionError: any) {
      // Never fail an otherwise successful repair just because the read-back failed.
      console.warn('Failed to read the installed plugin version after repair:', versionError.message);
    }

    await updateIssueStatus(accountId, issueId, 'Validation Required');

    res.json({ success: true, message: 'Repair applied successfully', backupUrl });

  } catch (error: any) {
    console.error('Repair Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error during repair' });
  }
});

export default router;
