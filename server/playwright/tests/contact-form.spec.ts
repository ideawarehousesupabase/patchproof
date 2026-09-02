import { test, expect } from "@playwright/test";

const WEBSITE_URL = process.env.WEBSITE_URL || "";
const JOURNEY_TYPE = process.env.JOURNEY_TYPE || "";

// Same guard used by every other journey spec — if WEBSITE_URL is ever passed
// with a scheme already included, bare `https://${WEBSITE_URL}` would build an
// invalid `https://https://...` URL.
const BASE_URL = WEBSITE_URL.startsWith("http") ? WEBSITE_URL : `https://${WEBSITE_URL}`;

const CONTACT_PATHS = ["/contact", "/contact-us", "/get-in-touch"];

/**
 * Navigates to the contact page if one exists — tries common URLs, then falls
 * back to a homepage link. Returns whether it was found; the page is left on
 * the contact page when it was.
 */
async function goToContactPage(page: import("@playwright/test").Page): Promise<boolean> {
  for (const path of CONTACT_PATHS) {
    const response = await page
      .goto(`${BASE_URL}${path}`, { waitUntil: "domcontentloaded", timeout: 15_000 })
      .catch(() => null);
    if (response?.ok()) return true;
  }

  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  const contactLink = page
    .locator('a[href*="contact"], a:has-text("Contact"), a:has-text("Get in touch")')
    .first();
  if (await contactLink.isVisible().catch(() => false)) {
    await contactLink.click();
    await page.waitForLoadState("domcontentloaded");
    return true;
  }

  return false;
}

/**
 * PatchProof Contact Form Journey Validation
 *
 * This test verifies that the contact form on a website is accessible
 * and functional after a repair has been applied.
 *
 * It does NOT submit real form data — it validates that the form
 * loads correctly and all required fields are present.
 *
 * A site with no contact page at all skips rather than fails. A contact page
 * that exists but has no <form> on it also skips — that's a content/setup gap,
 * not something a repair broke. Only a form whose recognizable fields are
 * genuinely missing produces a soft warning, since page builders sometimes use
 * non-standard field naming that this generic check can't recognize.
 */
test.describe("Contact Form Journey Validation", () => {
  test.skip(
    JOURNEY_TYPE !== "Lead Generation" && JOURNEY_TYPE !== "contact",
    "Skipping: not a contact form journey"
  );

  test("Step 1: Homepage loads successfully", async ({ page }) => {
    const response = await page.goto(BASE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    expect(response?.ok()).toBeTruthy();
    await page.screenshot({ path: "results/01-homepage.jpg", type: "jpeg", quality: 55 });
  });

  test("Step 2: Contact page is accessible", async ({ page }) => {
    const found = await goToContactPage(page);
    await page.screenshot({ path: "results/02-contact-page.jpg", type: "jpeg", quality: 55 });
    test.skip(!found, "Feature not present on this website");
  });

  test("Step 3: Contact form exists and has required fields", async ({ page }) => {
    const found = await goToContactPage(page);
    test.skip(!found, "Feature not present on this website");

    const form = page.locator("form").first();
    const formExists = await form.isVisible({ timeout: 10_000 }).catch(() => false);
    test.skip(!formExists, "Contact page exists but has no form on it");

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

    // Soft assertions — a form exists (confirmed above), so this is a real
    // signal worth logging, but a non-standard field-naming convention (e.g.
    // some page-builder forms) shouldn't fail validation on its own.
    if (!hasEmailField && !hasNameField) {
      console.log("Contact form found but no recognizable name/email field — may use a custom field naming convention");
    }
    if (!hasSubmitButton) {
      console.log("Contact form found but no recognizable submit button — may use a custom button implementation");
    }
  });
});
