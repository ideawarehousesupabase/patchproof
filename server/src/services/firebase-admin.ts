import admin from 'firebase-admin';
import { config } from '../config.js';
import fs from 'fs';

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    let serviceAccount;
    if (config.firebaseServiceAccount) {
      // In production (Render/Vercel), parse the JSON string directly from the environment variable
      serviceAccount = JSON.parse(config.firebaseServiceAccount);
    } else if (config.firebaseServiceAccountPath) {
      // In local development, read from the JSON file
      serviceAccount = JSON.parse(fs.readFileSync(config.firebaseServiceAccountPath, 'utf8'));
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    // Do not throw to allow the server to start even if firebase is not configured properly in dev, 
    // but actual DB calls will fail later if not configured.
  }
}

export const getFirestoreDb = () => {
  return admin.firestore();
};

export const saveIssue = async (accountId: string, issue: any) => {
  const db = getFirestoreDb();
  await db.collection('users').doc(accountId).collection('issues').doc(issue.id).set(issue);
};

export const saveChange = async (accountId: string, change: any) => {
  const db = getFirestoreDb();
  await db.collection('users').doc(accountId).collection('changes').doc(change.id).set(change);
};

export const updateIssueStatus = async (accountId: string, issueId: string, status: string) => {
  const db = getFirestoreDb();
  await db.collection('users').doc(accountId).collection('issues').doc(issueId).update({ status, updatedAt: new Date().toISOString() });
};

export const getWebsite = async (accountId: string, websiteId: string) => {
  const db = getFirestoreDb();
  const doc = await db.collection('users').doc(accountId).collection('websites').doc(websiteId).get();
  if (!doc.exists) {
    throw new Error('Website not found');
  }
  return doc.data()!;
};

export const saveEvidence = async (accountId: string, evidence: any) => {
  const db = getFirestoreDb();
  await db.collection('users').doc(accountId).collection('evidence').doc(evidence.id).set(evidence);
};

export const updateJourneyStatus = async (accountId: string, journeyId: string, status: string) => {
  const db = getFirestoreDb();
  await db.collection('users').doc(accountId).collection('journeys').doc(journeyId).update({ status, updatedAt: new Date().toISOString() });
};

export const getJourneysForWebsite = async (accountId: string, websiteId: string) => {
  const db = getFirestoreDb();
  const snap = await db.collection('users').doc(accountId).collection('journeys')
    .where('websiteId', '==', websiteId).get();
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
};
