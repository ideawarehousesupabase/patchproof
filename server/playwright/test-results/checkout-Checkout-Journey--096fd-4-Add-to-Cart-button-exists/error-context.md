# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: checkout.spec.ts >> Checkout Journey Validation >> Step 4: Add to Cart button exists
- Location: tests\checkout.spec.ts:83:3

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Page snapshot

```yaml
- generic [active] [ref=f1e1]: Sorry, this product is currently unavailable.
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | 
  3   | const WEBSITE_URL = process.env.WEBSITE_URL || "";
  4   | const JOURNEY_TYPE = process.env.JOURNEY_TYPE || "";
  5   | 
  6   | // Same guard used by every other journey spec — if WEBSITE_URL is ever passed
  7   | // with a scheme already included, bare `https://${WEBSITE_URL}` would build an
  8   | // invalid `https://https://...` URL.
  9   | const BASE_URL = WEBSITE_URL.startsWith("http") ? WEBSITE_URL : `https://${WEBSITE_URL}`;
  10  | 
  11  | const SHOP_PATHS = ["/shop", "/store", "/products"];
  12  | 
  13  | /**
  14  |  * Navigates to the shop if one exists — tries common WooCommerce-style URLs,
  15  |  * then falls back to a homepage link. Returns whether a shop was found; the
  16  |  * page is left on the shop page when it was.
  17  |  */
  18  | async function goToShop(page: import("@playwright/test").Page): Promise<boolean> {
  19  |   for (const path of SHOP_PATHS) {
  20  |     const response = await page
  21  |       .goto(`${BASE_URL}${path}`, { waitUntil: "domcontentloaded", timeout: 15_000 })
  22  |       .catch(() => null);
  23  |     if (response?.ok()) return true;
  24  |   }
  25  | 
  26  |   await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  27  |   const shopLink = page.locator('a[href*="shop"], a[href*="store"], a[href*="product"]').first();
  28  |   if (await shopLink.isVisible().catch(() => false)) {
  29  |     await shopLink.click();
  30  |     await page.waitForLoadState("domcontentloaded");
  31  |     return true;
  32  |   }
  33  | 
  34  |   return false;
  35  | }
  36  | 
  37  | /**
  38  |  * PatchProof Checkout Journey Validation
  39  |  *
  40  |  * This test navigates through a WooCommerce checkout flow to verify
  41  |  * that the checkout journey is functional after a repair has been applied.
  42  |  *
  43  |  * It does NOT complete a real purchase — it validates that each step
  44  |  * of the journey loads correctly and is interactive.
  45  |  *
  46  |  * A site that has no shop at all (no WooCommerce, no products) is a valid,
  47  |  * common case — every step below skips rather than fails when the shop
  48  |  * genuinely isn't present, and only hard-fails once a shop has actually been
  49  |  * found but a specific piece of it (add-to-cart, checkout page) is broken.
  50  |  */
  51  | test.describe("Checkout Journey Validation", () => {
  52  |   test.skip(JOURNEY_TYPE !== "Transactional" && JOURNEY_TYPE !== "checkout", "Skipping: not a checkout journey");
  53  | 
  54  |   test("Step 1: Homepage loads successfully", async ({ page }) => {
  55  |     const response = await page.goto(BASE_URL, {
  56  |       waitUntil: "domcontentloaded",
  57  |       timeout: 30_000,
  58  |     });
  59  |     expect(response?.ok()).toBeTruthy();
  60  |     await page.screenshot({ path: "results/01-homepage.jpg", type: "jpeg", quality: 55 });
  61  |   });
  62  | 
  63  |   test("Step 2: Shop page is accessible", async ({ page }) => {
  64  |     const shopFound = await goToShop(page);
  65  |     test.skip(!shopFound, "Shop not present on this website");
  66  |     await page.screenshot({ path: "results/02-shop-page.jpg", type: "jpeg", quality: 55 });
  67  |   });
  68  | 
  69  |   test("Step 3: Product page loads", async ({ page }) => {
  70  |     const shopFound = await goToShop(page);
  71  |     test.skip(!shopFound, "Shop not present on this website");
  72  | 
  73  |     // Find and click a product
  74  |     const productLink = page.locator('a[class*="product"], .product a, .products a').first();
  75  |     if (await productLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
  76  |       await productLink.click();
  77  |       await page.waitForLoadState("domcontentloaded");
  78  |     }
  79  | 
  80  |     await page.screenshot({ path: "results/03-product-page.jpg", type: "jpeg", quality: 55 });
  81  |   });
  82  | 
  83  |   test("Step 4: Add to Cart button exists", async ({ page }) => {
  84  |     const shopFound = await goToShop(page);
  85  |     test.skip(!shopFound, "Shop not present on this website");
  86  | 
  87  |     const productLink = page.locator('a[class*="product"], .product a, .products a').first();
  88  |     if (await productLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
  89  |       await productLink.click();
  90  |       await page.waitForLoadState("domcontentloaded");
  91  |     }
  92  | 
  93  |     // Shop confirmed present — a missing Add to Cart button here is a real signal
  94  |     // worth failing on, not something to skip past.
  95  |     const addToCart = page.locator(
  96  |       'button[name="add-to-cart"], .add_to_cart_button, button:has-text("Add to cart"), button:has-text("Add to basket")'
  97  |     );
  98  |     const cartExists = await addToCart.isVisible({ timeout: 10_000 }).catch(() => false);
  99  |     await page.screenshot({ path: "results/04-add-to-cart.jpg", type: "jpeg", quality: 55 });
> 100 |     expect(cartExists).toBeTruthy();
      |                        ^ Error: expect(received).toBeTruthy()
  101 |   });
  102 | 
  103 |   test("Step 5: Checkout page is accessible", async ({ page }) => {
  104 |     const shopFound = await goToShop(page);
  105 |     test.skip(!shopFound, "Shop not present on this website");
  106 | 
  107 |     // Shop confirmed present — an unreachable checkout/cart page here is a real
  108 |     // signal worth failing on, not something to skip past.
  109 |     const checkoutUrls = ["/checkout", "/cart"];
  110 |     let found = false;
  111 | 
  112 |     for (const url of checkoutUrls) {
  113 |       const response = await page
  114 |         .goto(`${BASE_URL}${url}`, { waitUntil: "domcontentloaded", timeout: 15_000 })
  115 |         .catch(() => null);
  116 |       if (response?.ok()) {
  117 |         found = true;
  118 |         break;
  119 |       }
  120 |     }
  121 | 
  122 |     await page.screenshot({ path: "results/05-checkout-page.jpg", type: "jpeg", quality: 55 });
  123 |     expect(found).toBeTruthy();
  124 |   });
  125 | });
  126 | 
```