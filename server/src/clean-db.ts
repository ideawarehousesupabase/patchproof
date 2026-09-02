import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase
import { getFirestoreDb } from './services/firebase-admin.js';

const db = getFirestoreDb();

async function cleanBadIssues() {
  console.log('Fetching issues...');
  const snapshot = await db.collectionGroup('issues').get();
  
  let deleted = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    // If it is missing detectedAt or patchPreview, it is malformed and causes UI crashes
    if (!data.detectedAt || !data.patchPreview) {
      console.log(`Deleting malformed issue: ${doc.id}`);
      await doc.ref.delete();
      deleted++;
    }
  }
  
  console.log(`Cleaned up ${deleted} malformed issues.`);
  process.exit(0);
}

cleanBadIssues().catch(console.error);
