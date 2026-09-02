import { Request, Response, NextFunction } from 'express';
import { config } from '../config.js';
import { verifyAccountToken } from '../services/auth-tokens.js';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Layer 1: shared API key check
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== config.apiSecretKey) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing x-api-key header' });
  }

  // Layer 2: JWT verification
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid Authorization header' });
  }

  const token = authHeader.slice(7);
  const decoded = verifyAccountToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }

  // Set accountId from verified token — never trust the body
  (req as any).accountId = decoded.accountId;
  next();
};
