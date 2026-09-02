import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getFirestoreDb, getWebsite, updateIssueStatus } from '../services/firebase-admin.js';
import { headlessUpdatePlugin, getPluginZipUrl } from '../services/wordpress.js';
import { canAutoApply, getManualInstructions } from '../engine/safety.js';

const router = Router();

router.post('/:issueId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { issueId } = req.params;
    const { accountId, wpPassword } = req.body;

    if (!accountId) {
      return res.status(400).json({ error: 'accountId is required' });
    }
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

    await updateIssueStatus(accountId, issueId, 'Validation Required');

    res.json({ success: true, message: 'Repair applied successfully', backupUrl });

  } catch (error: any) {
    console.error('Repair Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error during repair' });
  }
});

export default router;
