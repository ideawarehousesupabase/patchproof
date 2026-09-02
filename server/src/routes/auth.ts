import { Router, Request, Response } from 'express';
import { config } from '../config.js';
import { getFirestoreDb } from '../services/firebase-admin.js';
import { hashPassword } from '../services/password-hash.js';
import { signAccountToken } from '../services/auth-tokens.js';

const router = Router();

// API key check only (no JWT — this is how you obtain a token)
const apiKeyCheck = (req: Request, res: Response, next: Function) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== config.apiSecretKey) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing x-api-key header' });
  }
  next();
};

router.post('/login', apiKeyCheck, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = getFirestoreDb();
    const snap = await db.collection('users')
      .where('email', '==', email.toLowerCase().trim())
      .get();

    if (snap.empty) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const userDoc = snap.docs[0];
    const userData = userDoc.data();
    const computedHash = hashPassword(password);

    if (computedHash !== userData.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signAccountToken(userDoc.id);

    res.json({
      token,
      account: {
        id: userDoc.id,
        fullName: userData.fullName,
        agencyName: userData.agencyName,
        email: userData.email,
      }
    });

  } catch (error: any) {
    console.error('Auth Error:', error);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
});

export default router;
