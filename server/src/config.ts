import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const requiredEnvVars = [
  'FIREBASE_SERVICE_ACCOUNT_PATH',
  'WPSCAN_API_TOKEN',
  'API_SECRET_KEY',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const config = {
  firebaseServiceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH as string,
  wpscanApiToken: process.env.WPSCAN_API_TOKEN as string,
  githubToken: process.env.GITHUB_TOKEN || '',
  githubRepoOwner: process.env.GITHUB_REPO_OWNER || '',
  githubRepoName: process.env.GITHUB_REPO_NAME || '',
  apiSecretKey: process.env.API_SECRET_KEY as string,
  port: parseInt(process.env.PORT || '3001', 10),
};
