import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getFirestoreDb, getWebsite, updateJourneyStatus } from '../services/firebase-admin.js';
import { triggerValidation } from '../services/github.js';

const router = Router();

router.post('/:journeyId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { journeyId } = req.params;
    const { accountId } = req.body;

    if (!accountId) {
      return res.status(400).json({ error: 'accountId is required' });
    }

    const db = getFirestoreDb();
    const journeyDoc = await db.collection('users').doc(accountId).collection('journeys').doc(journeyId).get();
    
    if (!journeyDoc.exists) {
      return res.status(404).json({ error: 'Journey not found' });
    }
    
    const journey = journeyDoc.data()!;
    const website = await getWebsite(accountId, journey.websiteId);

    await updateJourneyStatus(accountId, journeyId, 'Validation Required');

    await triggerValidation(website.url, journey.type, journeyId, accountId);

    res.json({ success: true, message: 'Validation triggered successfully' });

  } catch (error: any) {
    console.error('Validate Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error during validation' });
  }
});

export default router;
