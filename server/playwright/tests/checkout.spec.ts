import { test, expect } from "@playwright/test";

const WEBSITE_URL = process.env.WEBSITE_URL || "";
const JOURNEY_TYPE = process.env.JOURNEY_TYPE || "";

// Same guard used by every other journey spec — if WEBSITE_URL is ever passed
// with a scheme already included, bare `https://${WEBSITE_URL}` would build an
// invalid `https://https://...` URL.
const BASE_URL = WEBSITE_URL.startsWith("http") ? WEBSITE_URL : `https://${WEBSITE_URL}`;

const SHOP_PATHS = ["/shop", "/store", "/products"];

/**
 * Navigates to the shop if one exists — tries common WooCommerce-style URLs,
 * then falls back to a homepage link. Returns whether a shop was found; the
 * page is left on the shop page when it was.
 */
async function goToShop(page: import("@playwright/test").Page): Promise<boolean> {
  for (const path of SHOP_PATHS) {
    const response = await page
      .goto(`${BASE_URL}${path}`, { waitUntil: "domcontentloaded", timeout: 15_000 })
      .catch(() => null);
    if (response?.ok()) return true;
  }

  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  const shopLink = page.locator('a[href*="shop"], a[href*="store"], a[href*="product"]').first();
  if (await shopLink.isVisible().catch(() => false)) {
    await shopLink.click();
    await page.waitForLoadState("domcontentloaded");
    return true;
  }

  return false;
}

/**
 * PatchProof Checkout Journey Validation
 *
 * This test navigates through a WooCommerce checkout flow to verify
 * that the checkout journey is functional after a repair has been applied.
 *
 * It does NOT complete a real purchase — it validates that each step
 * of the journey loads correctly and is interactive.
 *
 * A site that has no shop at all (no WooCommerce, no products) is a valid,
 * common case — every step below skips rather than fails when the shop
 * genuinely isn't present, and only hard-fails once a shop has actually been
 * found but a specific piece of it (add-to-cart, checkout page) is broken.
 */
test.describe("Checkout Journey Validation", () => {
  test.skip(JOURNEY_TYPE !== "Transactional" && JOURNEY_TYPE !== "checkout", "Skipping: not a checkout journey");

  test("Step 1: Homepage loads successfully", async ({ page }) => {
    const response = await page.goto(BASE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    expect(response?.ok()).toBeTruthy();
    await page.screenshot({ path: "results/01-homepage.jpg", type: "jpeg", quality: 55 });
  });

  test("Step 2: Shop page is accessible", async ({ page }) => {
    const shopFound = await goToShop(page);
    test.skip(!shopFound, "Shop not present on this website");
    await page.screenshot({ path: "results/02-shop-page.jpg", type: "jpeg", quality: 55 });
  });

  test("Step 3: Product page loads", async ({ page }) => {
    const shopFound = await goToShop(page);
    test.skip(!shopFound, "Shop not present on this website");

    // Find and click a product
    const productLink = page.locator('a[class*="product"], .product a, .products a').first();
    if (await productLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await productLink.click();
      await page.waitForLoadState("domcontentloaded");
    }

    await page.screenshot({ path: "results/03-product-page.jpg", type: "jpeg", quality: 55 });
  });

  test("Step 4: Add to Cart button exists", async ({ page }) => {
    const shopFound = await goToShop(page);
    test.skip(!shopFound, "Shop not present on this website");

    const productLink = page.locator('a[class*="product"], .product a, .products a').first();
    if (await productLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await productLink.click();
      await page.waitForLoadState("domcontentloaded");
    }

    // Shop confirmed present — a missing Add to Cart button here is a real signal
    // worth failing on, not something to skip past.
    const addToCart = page.locator(
      'button[name="add-to-cart"], .add_to_cart_button, button:has-text("Add to cart"), button:has-text("Add to basket")'
    );
    const cartExists = await addToCart.isVisible({ timeout: 10_000 }).catch(() => false);
    await page.screenshot({ path: "results/04-add-to-cart.jpg", type: "jpeg", quality: 55 });
    expect(cartExists).toBeTruthy();
  });

  test("Step 5: Checkout page is accessible", async ({ page }) => {
    const shopFound = await goToShop(page);
    test.skip(!shopFound, "Shop not present on this website");

    // Shop confirmed present — an unreachable checkout/cart page here is a real
    // signal worth failing on, not something to skip past.
    const checkoutUrls = ["/checkout", "/cart"];
    let found = false;

    for (const url of checkoutUrls) {
      const response = await page
        .goto(`${BASE_URL}${url}`, { waitUntil: "domcontentloaded", timeout: 15_000 })
        .catch(() => null);
      if (response?.ok()) {
        found = true;
        break;
      }
    }

    await page.screenshot({ path: "results/05-checkout-page.jpg", type: "jpeg", quality: 55 });
    expect(found).toBeTruthy();
  });
});
