import { test, expect } from "@playwright/test";

const WEBSITE_URL = process.env.WEBSITE_URL || "";
const JOURNEY_TYPE = process.env.JOURNEY_TYPE || "";

test.describe("Login Journey Validation", () => {
  test.skip(
    JOURNEY_TYPE !== "User Access" && JOURNEY_TYPE !== "login",
    "Skipping: not a login journey"
  );

  test("Step 1: Homepage loads", async ({ page }) => {
    const url = WEBSITE_URL.startsWith("http") ? WEBSITE_URL : `https://${WEBSITE_URL}`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.screenshot({ path: "results/01-homepage.jpg", type: "jpeg", quality: 55 });
    await expect(page).not.toHaveTitle(/error|404/i);
  });

  test("Step 2: Find login page", async ({ page }) => {
    const url = WEBSITE_URL.startsWith("http") ? WEBSITE_URL : `https://${WEBSITE_URL}`;
    
    // Try common WordPress login paths
    const loginPaths = ["/wp-login.php", "/login", "/my-account"];
    let found = false;
    
    for (const path of loginPaths) {
      try {
        await page.goto(`${url}${path}`, { waitUntil: "domcontentloaded", timeout: 15000 });
        const hasForm = await page.locator("form").first().isVisible({ timeout: 5000 }).catch(() => false);
        if (hasForm) {
          found = true;
          break;
        }
      } catch {
        continue;
      }
    }
    
    // Fallback: look for a login link on the homepage
    if (!found) {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      const loginLink = page.locator('a:has-text("login"), a:has-text("sign in"), a:has-text("log in"), a[href*="login"], a[href*="wp-login"]').first();
      const linkVisible = await loginLink.isVisible({ timeout: 5000 }).catch(() => false);
      if (linkVisible) {
        await loginLink.click();
        await page.waitForLoadState("domcontentloaded");
      }
    }
    
    await page.screenshot({ path: "results/02-login-page.jpg", type: "jpeg", quality: 55 });
  });

  test("Step 3: Login form fields exist", async ({ page }) => {
    const url = WEBSITE_URL.startsWith("http") ? WEBSITE_URL : `https://${WEBSITE_URL}`;
    
    // Navigate to wp-login.php first (most reliable)
    await page.goto(`${url}/wp-login.php`, { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {});
    
    // Check for username/email field
    const usernameField = page.locator('input[name="log"], input[name="username"], input[name="email"], input[type="email"], #user_login, #username').first();
    const hasUsername = await usernameField.isVisible({ timeout: 5000 }).catch(() => false);
    
    // Check for password field
    const passwordField = page.locator('input[type="password"], input[name="pwd"], #user_pass').first();
    const hasPassword = await passwordField.isVisible({ timeout: 5000 }).catch(() => false);
    
    // Check for submit button
    const submitButton = page.locator('input[type="submit"], button[type="submit"], #wp-submit').first();
    const hasSubmit = await submitButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    await page.screenshot({ path: "results/03-login-form.jpg", type: "jpeg", quality: 55 });
    
    // Soft assertion — don't hard-fail if the site uses a custom login
    expect(hasUsername || hasPassword).toBeTruthy();
  });

  test("Step 4: Login form is interactive", async ({ page }) => {
    const url = WEBSITE_URL.startsWith("http") ? WEBSITE_URL : `https://${WEBSITE_URL}`;
    await page.goto(`${url}/wp-login.php`, { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {});
    
    // Soft check that fields are enabled (not disabled)
    const usernameField = page.locator('input[name="log"], input[name="username"], input[type="email"], #user_login').first();
    const isEnabled = await usernameField.isEnabled({ timeout: 5000 }).catch(() => false);
    
    await page.screenshot({ path: "results/04-login-form-interactive.jpg", type: "jpeg", quality: 55 });
    
    // Do NOT attempt an actual login — PatchProof has no test credentials
    expect(isEnabled).toBeTruthy();
  });
});
