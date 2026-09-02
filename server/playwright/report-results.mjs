/**
 * report-results.mjs
 *
 * Runs inside GitHub Actions after Playwright tests complete.
 * Reads the test results and updates Firebase Firestore with the outcome.
 */
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync, existsSync } from "fs";

const ACCOUNT_ID = process.env.ACCOUNT_ID;
const JOURNEY_ID = process.env.JOURNEY_ID;
const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!ACCOUNT_ID || !JOURNEY_ID || !FIREBASE_SERVICE_ACCOUNT) {
  console.error("Missing required environment variables: ACCOUNT_ID, JOURNEY_ID, FIREBASE_SERVICE_ACCOUNT");
  process.exit(1);
}

// Initialize Firebase Admin
const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Read test results
let passed = false;
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

const reportPath = "results/report.json";
if (existsSync(reportPath)) {
  try {
    const report = JSON.parse(readFileSync(reportPath, "utf-8"));
    const suites = report.suites || [];

    for (const suite of suites) {
      for (const spec of suite.specs || []) {
        for (const testResult of spec.tests || []) {
          totalTests++;
          if (testResult.status === "expected" || testResult.status === "passed") {
            passedTests++;
          } else if (testResult.status === "unexpected" || testResult.status === "failed") {
            failedTests++;
          }
        }
      }
    }

    passed = failedTests === 0 && passedTests > 0;
  } catch (err) {
    console.error("Failed to parse test report:", err.message);
  }
} else {
  console.warn("No test report found at", reportPath);
}

const journeyStatus = passed ? "Passed" : "Failed";

console.log(`Test Results: ${passedTests}/${totalTests} passed, ${failedTests} failed`);
console.log(`Journey Status: ${journeyStatus}`);

// Update the journey document in Firestore
try {
  const journeyRef = db.doc(`users/${ACCOUNT_ID}/journeys/${JOURNEY_ID}`);
  await journeyRef.update({ status: journeyStatus });
  console.log(`Updated journey ${JOURNEY_ID} status to ${journeyStatus}`);

  // If passed, also resolve any linked issues and create evidence
  if (passed) {
    const issuesSnap = await db
      .collection(`users/${ACCOUNT_ID}/issues`)
      .where("journeyId", "==", JOURNEY_ID)
      .where("status", "==", "Validation Required")
      .get();

    for (const issueDoc of issuesSnap.docs) {
      await issueDoc.ref.update({ status: "Resolved" });
      console.log(`Resolved issue ${issueDoc.id}`);

      // Create evidence record
      const issue = issueDoc.data();
      const now = new Date().toISOString();
      const evidenceId = `PR-${Date.now().toString(36).toUpperCase()}`;
      const journeyDoc = await journeyRef.get();
      const journey = journeyDoc.data();

      await db.doc(`users/${ACCOUNT_ID}/evidence/${evidenceId}`).set({
        websiteId: issue.websiteId,
        issueId: issueDoc.id,
        issue: issue.title,
        risk: issue.severity,
        outcome: "Resolved",
        date: now.split("T")[0],
        createdAt: now,
        status: "Verified",
        businessImpact: issue.businessImpact,
        dependencyChain: (issue.dependencies || []).map((d) => d.label).join(" → "),
        proposedRepair: issue.repair?.proposedRepair || "",
        safety: `${issue.safety?.riskLevel || "Medium"} Risk — ${issue.safety?.decision || "Reviewed"}`,
        approval: "Approved",
        patchPreview: "Reviewed",
        repairStatus: "Applied",
        validationPerformed: journey?.name ? `${journey.name} Journey` : "Component checks",
        validationOutcome: "Passed",
        rollback: "Not required",
        before: [
          { label: journey?.name ? `${journey.name} Journey` : "Component", value: "At Risk" },
          ...(issue.patchPreview?.current || []),
        ],
        after: [
          { label: journey?.name ? `${journey.name} Journey` : "Component", value: "Passed" },
          ...(issue.patchPreview?.proposed || []),
        ],
        timeline: [
          { stage: "Issue detected", time: issue.detected || now },
          { stage: "Dependencies analysed", time: issue.detected || now },
          { stage: "Repair proposed", time: issue.detected || now },
          { stage: "Repair approved", time: now },
          { stage: "Repair applied", time: now },
          { stage: "Journey validated (Playwright)", time: now },
          { stage: "Evidence verified", time: now },
        ],
      });
      console.log(`Created evidence record ${evidenceId}`);
    }
  }

  console.log("Firebase update complete.");
} catch (err) {
  console.error("Failed to update Firebase:", err.message);
  process.exit(1);
}
