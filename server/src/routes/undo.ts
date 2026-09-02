import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getFirestoreDb, getWebsite, updateIssueStatus } from '../services/firebase-admin.js';
import { headlessExecuteRollback } from '../services/wordpress.js';

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

    // Extract the previous version from the patch preview data saved during the scan
    const currentProps = issue.patchPreview?.current || [];
    const versionProp = currentProps.find((c: any) => c.label === 'Version');
    const previousVersion = versionProp ? versionProp.value : 'latest';

    if (previousVersion === 'latest' || previousVersion === 'unknown') {
       return res.status(400).json({ error: 'Could not determine the previous version of the plugin to rollback to.' });
    }

    // Execute universal zip rollback using WordPress core functionality
    await headlessExecuteRollback(website.url, website.wpUsername, wpPassword, issue.componentName, previousVersion);

    await updateIssueStatus(accountId, issueId, 'Awaiting Approval');

    res.json({ success: true, message: 'Undo successful. Plugin restored to previous version.' });

  } catch (error: any) {
    console.error('Undo Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error during undo' });
  }
});

export default router;
