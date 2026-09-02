# Headless AI Agent Implementation Plan

This plan will convert PatchProof into a 100% agentless patching system using Headless Browser automation.

## Goal
Implement a Puppeteer-based headless browser agent on the Node.js backend. When you approve a repair, PatchProof will spin up a hidden Chrome browser, navigate to your WordPress login screen, log in as an administrator, and physically click the "Update" button on the vulnerable plugin.

## User Review Required

> [!IMPORTANT]
> **Password Requirement Change**
> WordPress "Application Passwords" (like the one you generated earlier) are strictly limited to API access. They cannot be used to log into the visual `wp-login.php` screen. 
> To use the Headless AI Agent, you will need to edit your website in PatchProof and provide your **ACTUAL WordPress Admin Password** instead of the Application Password.

## Proposed Changes

### Backend Dependencies
#### [NEW] `server/package.json`
- Install `puppeteer` to power the headless browser.

### WordPress Service
#### [MODIFY] `server/src/services/wordpress.ts`
- Remove the REST API update call we added earlier.
- Add a new `headlessUpdatePlugin` function that:
  1. Launches a hidden Chromium browser.
  2. Navigates to `your-site.com/wp-login.php`.
  3. Fills in the actual username and password.
  4. Bypasses InfinityFree's security challenges (since it's a real browser, it handles JS challenges automatically!).
  5. Navigates to the Plugins page and simulates a click on the "Update Now" button for the specific vulnerable plugin.

### API Routes
#### [MODIFY] `server/src/routes/repair.ts`
- Wire the "Approve Repair" endpoint to trigger the new `headlessUpdatePlugin` function.

### Cleanup
#### [DELETE] `patchproof-agent/`
- Delete the custom WordPress plugin folder we made earlier. We are officially going 100% Agentless.

## Verification Plan

### Manual Verification
1. You will update your website credentials in PatchProof to use your real WP Admin password.
2. You will click "Approve Repair" on the Elementor issue.
3. You will watch the progress bar while the backend hidden browser does the work, and then check your actual WordPress site to confirm Elementor has updated to the latest version.
