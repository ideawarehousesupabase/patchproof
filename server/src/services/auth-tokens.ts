import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export function signAccountToken(accountId: string): string {
  return jwt.sign({ accountId }, config.jwtSecret, { expiresIn: '7d' });
}

export function verifyAccountToken(token: string): { accountId: string } | null {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { accountId: string };
    return { accountId: decoded.accountId };
  } catch {
    return null;
  }
}
