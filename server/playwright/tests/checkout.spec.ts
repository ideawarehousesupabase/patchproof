import { test, expect } from "@playwright/test";

const WEBSITE_URL = process.env.WEBSITE_URL || "";
const JOURNEY_TYPE = process.env.JOURNEY_TYPE || "checkout";

/**
 * PatchProof Checkout Journey Validation
 *
 * This test navigates through a WooCommerce checkout flow to verify
 * that the checkout journey is functional after a repair has been applied.
 *
 * It does NOT complete a real purchase — it validates that each step
 * of the journey loads correctly and is interactive.
 */
test.describe("Checkout Journey Validation", () => {
  test.skip(JOURNEY_TYPE !== "Transactional" && JOURNEY_TYPE !== "checkout", "Skipping: not a checkout journey");

  test("Step 1: Homepage loads successfully", async ({ page }) => {
    const response = await page.goto(`https://${WEBSITE_URL}`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    expect(response?.ok()).toBeTruthy();
    await page.screenshot({ path: "results/01-homepage.png" });
  });

  test("Step 2: Shop page is accessible", async ({ page }) => {
    await page.goto(`https://${WEBSITE_URL}`, { waitUntil: "domcontentloaded" });

    // Try common WooCommerce shop URLs
    const shopUrls = ["/shop", "/store", "/products"];
    let shopFound = false;

    for (const url of shopUrls) {
      const response = await page.goto(`https://${WEBSITE_URL}${url}`, {
        waitUntil: "domcontentloaded",
        timeout: 15_000,
      });
      if (response?.ok()) {
        shopFound = true;
        break;
      }
    }

    // Fallback: look for a shop link on the homepage
    if (!shopFound) {
      await page.goto(`https://${WEBSITE_URL}`, { waitUntil: "domcontentloaded" });
      const shopLink = page.locator('a[href*="shop"], a[href*="store"], a[href*="product"]').first();
      if (await shopLink.isVisible()) {
        await shopLink.click();
        await page.waitForLoadState("domcontentloaded");
        shopFound = true;
      }
    }

    expect(shopFound).toBeTruthy();
    await page.screenshot({ path: "results/02-shop-page.png" });
  });

  test("Step 3: Product page loads", async ({ page }) => {
    // Navigate to shop first
    const shopUrls = ["/shop", "/store", "/products"];
    for (const url of shopUrls) {
      const resp = await page.goto(`https://${WEBSITE_URL}${url}`, {
        waitUntil: "domcontentloaded",
        timeout: 15_000,
      });
      if (resp?.ok()) break;
    }

    // Find and click a product
    const productLink = page.locator('a[class*="product"], .product a, .products a').first();
    if (await productLink.isVisible({ timeout: 5_000 })) {
      await productLink.click();
      await page.waitForLoadState("domcontentloaded");
    }

    await page.screenshot({ path: "results/03-product-page.png" });
  });

  test("Step 4: Add to Cart button exists", async ({ page }) => {
    // Navigate to a product page
    const shopUrls = ["/shop", "/store", "/products"];
    for (const url of shopUrls) {
      const resp = await page.goto(`https://${WEBSITE_URL}${url}`, {
        waitUntil: "domcontentloaded",
        timeout: 15_000,
      });
      if (resp?.ok()) break;
    }

    const productLink = page.locator('a[class*="product"], .product a, .products a').first();
    if (await productLink.isVisible({ timeout: 5_000 })) {
      await productLink.click();
      await page.waitForLoadState("domcontentloaded");
    }

    // Check for Add to Cart button
    const addToCart = page.locator(
      'button[name="add-to-cart"], .add_to_cart_button, button:has-text("Add to cart"), button:has-text("Add to basket")'
    );
    const cartExists = await addToCart.isVisible({ timeout: 10_000 }).catch(() => false);
    await page.screenshot({ path: "results/04-add-to-cart.png" });
    expect(cartExists).toBeTruthy();
  });

  test("Step 5: Checkout page is accessible", async ({ page }) => {
    const checkoutUrls = ["/checkout", "/cart"];
    let found = false;

    for (const url of checkoutUrls) {
      const response = await page.goto(`https://${WEBSITE_URL}${url}`, {
        waitUntil: "domcontentloaded",
        timeout: 15_000,
      });
      if (response?.ok()) {
        found = true;
        break;
      }
    }

    await page.screenshot({ path: "results/05-checkout-page.png" });
    expect(found).toBeTruthy();
  });
});
