import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const requiredEnvVars = [
  'WPSCAN_API_TOKEN',
  'API_SECRET_KEY',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

if (!process.env.FIREBASE_SERVICE_ACCOUNT && !process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
  throw new Error(`Missing required environment variable: Either FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_PATH must be provided`);
}

export const config = {
  firebaseServiceAccount: process.env.FIREBASE_SERVICE_ACCOUNT,
  firebaseServiceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
  wpscanApiToken: process.env.WPSCAN_API_TOKEN as string,
  githubToken: process.env.GITHUB_TOKEN || '',
  githubRepoOwner: process.env.GITHUB_REPO_OWNER || '',
  githubRepoName: process.env.GITHUB_REPO_NAME || '',
  apiSecretKey: process.env.API_SECRET_KEY as string,
  port: parseInt(process.env.PORT || '3001', 10),
};
