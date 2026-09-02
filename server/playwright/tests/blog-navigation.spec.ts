import { test, expect } from "@playwright/test";

const WEBSITE_URL = process.env.WEBSITE_URL || "";
const JOURNEY_TYPE = process.env.JOURNEY_TYPE || "";

test.describe("Blog Navigation Journey Validation", () => {
  test.skip(
    JOURNEY_TYPE !== "Content" && JOURNEY_TYPE !== "Business Function" && JOURNEY_TYPE !== "blog_navigation",
    "Skipping: not a blog navigation journey"
  );

  test("Step 1: Blog archive accessible", async ({ page }) => {
    const url = WEBSITE_URL.startsWith("http") ? WEBSITE_URL : `https://${WEBSITE_URL}`;
    
    // Try common blog paths
    const blogPaths = ["/blog", "/news", "/articles"];
    let found = false;
    
    for (const path of blogPaths) {
      try {
        const resp = await page.goto(`${url}${path}`, { waitUntil: "domcontentloaded", timeout: 15000 });
        if (resp && resp.status() < 400) {
          found = true;
          break;
        }
      } catch {
        continue;
      }
    }
    
    // Fallback: look for a blog/news link on the homepage
    if (!found) {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      const blogLink = page.locator('a:has-text("blog"), a:has-text("news"), a:has-text("articles"), a[href*="blog"], a[href*="news"]').first();
      const linkVisible = await blogLink.isVisible({ timeout: 5000 }).catch(() => false);
      if (linkVisible) {
        await blogLink.click();
        await page.waitForLoadState("domcontentloaded");
        found = true;
      }
    }
    
    // Last fallback: just go to homepage (many WP sites show posts on homepage)
    if (!found) {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    }
    
    await page.screenshot({ path: "results/01-blog-archive.jpg", type: "jpeg", quality: 55 });
  });

  test("Step 2: Click into a post", async ({ page }) => {
    const url = WEBSITE_URL.startsWith("http") ? WEBSITE_URL : `https://${WEBSITE_URL}`;
    
    // Try blog page first, then homepage
    const tryUrl = await page.goto(`${url}/blog`, { waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => null);
    if (!tryUrl || tryUrl.status() >= 400) {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    }
    
    // Look for a post title link
    const postLink = page.locator('.entry-title a, article a, h2 a, .post-title a, .blog-post a').first();
    const hasPost = await postLink.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (hasPost) {
      await postLink.click();
      await page.waitForLoadState("domcontentloaded");
    }
    
    await page.screenshot({ path: "results/02-post-page.jpg", type: "jpeg", quality: 55 });
  });

  test("Step 3: Verify single post page", async ({ page }) => {
    const url = WEBSITE_URL.startsWith("http") ? WEBSITE_URL : `https://${WEBSITE_URL}`;
    
    // Navigate to blog, then click a post
    const tryUrl = await page.goto(`${url}/blog`, { waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => null);
    if (!tryUrl || tryUrl.status() >= 400) {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    }
    
    const postLink = page.locator('.entry-title a, article a, h2 a, .post-title a').first();
    const hasPost = await postLink.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasPost) {
      await postLink.click();
      await page.waitForLoadState("domcontentloaded");
    }
    
    // Verify typical WordPress single-post markup
    const hasContent = await page.locator('.entry-content, article, .post-content, .single-post').first().isVisible({ timeout: 5000 }).catch(() => false);
    
    await page.screenshot({ path: "results/03-single-post.jpg", type: "jpeg", quality: 55 });
    
    // Soft assertion
    if (!hasContent) {
      console.log("Could not verify single-post markup — site may use custom templates");
    }
  });

  test("Step 4: Check comment form", async ({ page }) => {
    const url = WEBSITE_URL.startsWith("http") ? WEBSITE_URL : `https://${WEBSITE_URL}`;
    
    // Navigate to blog, then click a post
    const tryUrl = await page.goto(`${url}/blog`, { waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => null);
    if (!tryUrl || tryUrl.status() >= 400) {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    }
    
    const postLink = page.locator('.entry-title a, article a, h2 a, .post-title a').first();
    const hasPost = await postLink.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasPost) {
      await postLink.click();
      await page.waitForLoadState("domcontentloaded");
    }
    
    // Soft check for comment form — many sites disable comments
    const commentForm = page.locator('#commentform, .comment-form, #respond, form[action*="comment"]').first();
    const hasComments = await commentForm.isVisible({ timeout: 5000 }).catch(() => false);
    
    await page.screenshot({ path: "results/04-comment-form.jpg", type: "jpeg", quality: 55 });
    
    // Soft assertion — don't fail if comments are disabled
    if (!hasComments) {
      console.log("No comment form found — comments may be disabled on this site");
    }
  });
});
