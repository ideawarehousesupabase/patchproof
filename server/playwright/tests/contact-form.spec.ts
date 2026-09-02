import { test, expect } from "@playwright/test";

const WEBSITE_URL = process.env.WEBSITE_URL || "";
const JOURNEY_TYPE = process.env.JOURNEY_TYPE || "";

/**
 * PatchProof Contact Form Journey Validation
 *
 * This test verifies that the contact form on a website is accessible
 * and functional after a repair has been applied.
 *
 * It does NOT submit real form data — it validates that the form
 * loads correctly and all required fields are present.
 */
test.describe("Contact Form Journey Validation", () => {
  test.skip(
    JOURNEY_TYPE !== "Lead Generation" && JOURNEY_TYPE !== "contact",
    "Skipping: not a contact form journey"
  );

  test("Step 1: Homepage loads successfully", async ({ page }) => {
    const response = await page.goto(`https://${WEBSITE_URL}`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    expect(response?.ok()).toBeTruthy();
    await page.screenshot({ path: "results/01-homepage.jpg", type: "jpeg", quality: 55 });
  });

  test("Step 2: Contact page is accessible", async ({ page }) => {
    // Try common contact page URLs
    const contactUrls = ["/contact", "/contact-us", "/get-in-touch"];
    let found = false;

    for (const url of contactUrls) {
      const response = await page.goto(`https://${WEBSITE_URL}${url}`, {
        waitUntil: "domcontentloaded",
        timeout: 15_000,
      });
      if (response?.ok()) {
        found = true;
        break;
      }
    }

    // Fallback: look for a contact link on the homepage
    if (!found) {
      await page.goto(`https://${WEBSITE_URL}`, { waitUntil: "domcontentloaded" });
      const contactLink = page
        .locator('a[href*="contact"], a:has-text("Contact"), a:has-text("Get in touch")')
        .first();
      if (await contactLink.isVisible()) {
        await contactLink.click();
        await page.waitForLoadState("domcontentloaded");
        found = true;
      }
    }

    await page.screenshot({ path: "results/02-contact-page.jpg", type: "jpeg", quality: 55 });
    expect(found).toBeTruthy();
  });

  test("Step 3: Contact form exists and has required fields", async ({ page }) => {
    // Navigate to contact page
    const contactUrls = ["/contact", "/contact-us", "/get-in-touch"];
    for (const url of contactUrls) {
      const resp = await page.goto(`https://${WEBSITE_URL}${url}`, {
        waitUntil: "domcontentloaded",
        timeout: 15_000,
      });
      if (resp?.ok()) break;
    }

    // Look for a form element
    const form = page.locator("form").first();
    const formExists = await form.isVisible({ timeout: 10_000 }).catch(() => false);

    if (formExists) {
      // Check for common form fields
      const hasNameField = await page
        .locator('input[name*="name"], input[placeholder*="name" i]')
        .isVisible({ timeout: 5_000 })
        .catch(() => false);

      const hasEmailField = await page
        .locator('input[type="email"], input[name*="email"]')
        .isVisible({ timeout: 5_000 })
        .catch(() => false);

      const hasSubmitButton = await page
        .locator('input[type="submit"], button[type="submit"], button:has-text("Send"), button:has-text("Submit")')
        .isVisible({ timeout: 5_000 })
        .catch(() => false);

      await page.screenshot({ path: "results/03-contact-form.jpg", type: "jpeg", quality: 55 });

      // At minimum, we expect a form with an email field and a submit button
      expect(hasEmailField || hasNameField).toBeTruthy();
      expect(hasSubmitButton).toBeTruthy();
    } else {
      await page.screenshot({ path: "results/03-no-form-found.jpg", type: "jpeg", quality: 55 });
      expect(formExists).toBeTruthy();
    }
  });
});
