import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getFirestoreDb, getWebsite, updateJourneyStatus } from '../services/firebase-admin.js';
import { triggerValidation } from '../services/github.js';

const router = Router();

router.post('/:journeyId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { journeyId } = req.params;
    const accountId = (req as any).accountId;

    const db = getFirestoreDb();
    const journeyDoc = await db.collection('users').doc(accountId).collection('journeys').doc(journeyId).get();
    
    if (!journeyDoc.exists) {
      return res.status(404).json({ error: 'Journey not found' });
    }
    
    const journey = journeyDoc.data()!;
    const website = await getWebsite(accountId, journey.websiteId);

    // Trigger first, mark Pending only once GitHub actually confirms the dispatch.
    // Writing "Validation Pending" before this could succeed left journeys stuck
    // there forever whenever the trigger failed (missing GitHub config, API error,
    // network blip) — the UI showed "running" for a validation that never started.
    // The only place that ever writes Passed/Failed is report-results.mjs inside
    // the real GitHub Actions run, so gating Pending on trigger success keeps every
    // "Pending" journey backed by an actual in-flight run.
    await triggerValidation(website.url, journey.type, journeyId, accountId);

    await updateJourneyStatus(accountId, journeyId, 'Validation Pending');

    res.json({ success: true, message: 'Validation triggered successfully' });

  } catch (error: any) {
    console.error('Validate Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error during validation' });
  }
});

export default router;
