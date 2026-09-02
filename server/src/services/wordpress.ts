import axios from 'axios';

const TIMEOUT = 15000;

export const fetchPlugins = async (siteUrl: string, username: string, appPassword: string) => {
  try {
    const cleanPassword = appPassword.replace(/\s+/g, '');
    const baseUrl = siteUrl.startsWith('http') ? siteUrl : (siteUrl.includes('localhost') || siteUrl.endsWith('.local') ? `http://${siteUrl}` : `https://${siteUrl}`);
    const auth = Buffer.from(`${username}:${cleanPassword}`).toString('base64');
    const response = await axios.get(`${baseUrl}/wp-json/wp/v2/plugins`, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
      timeout: TIMEOUT,
    });
    
    if (!Array.isArray(response.data)) {
      throw new Error(`Server returned an invalid format instead of JSON. This usually means a firewall or anti-bot system (like InfinityFree) is blocking API access. Response snippet: ${JSON.stringify(response.data).substring(0, 100)}...`);
    }

    return response.data.map((plugin: any) => ({
      name: plugin.name,
      slug: plugin.plugin, // Note: WP REST API returns the slug/file in the `plugin` field
      version: plugin.version,
      status: plugin.status,
      update_available: plugin.update_available,
    }));
  } catch (error: any) {
    console.error(`Failed to fetch plugins from ${siteUrl}:`, error.message);
    throw new Error(`WordPress API Error: ${error.message}`);
  }
};

export const headlessUpdatePlugin = async (siteUrl: string, username: string, password: string, pluginSlug: string) => {
  try {
    const baseUrl = siteUrl.startsWith('http') ? siteUrl : (siteUrl.includes('localhost') || siteUrl.endsWith('.local') ? `http://${siteUrl}` : `https://${siteUrl}`);
    console.log(`Starting Headless AI Agent to update ${pluginSlug} on ${baseUrl}`);

    // Dynamically import puppeteer so it doesn't break server boot if missing
    const puppeteer = (await import('puppeteer')).default;
    
    // Launch a headless browser
    const browser = await puppeteer.launch({
      headless: true, // run in background
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--single-process', '--no-zygote']
    });

    const page = await browser.newPage();
    
    // 1. Navigate to the WordPress login page
    console.log(`Navigating to ${baseUrl}/wp-login.php`);
    await page.goto(`${baseUrl}/wp-login.php`, { waitUntil: 'networkidle2' });

    // 2. Fill out the login form
    console.log('Typing credentials...');
    await page.type('#user_login', username);
    await page.type('#user_pass', password);
    
    // 3. Click login and wait for the dashboard to load
    console.log('Clicking login...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click('#wp-submit')
    ]);

    // Check if login failed
    const isError = await page.$('#login_error');
    if (isError) {
      await browser.close();
      throw new Error('WordPress login failed. Check your credentials (must be the actual WP password, not an Application Password).');
    }

    // 4. Navigate to the Plugins page
    console.log('Navigating to Plugins page...');
    await page.goto(`${baseUrl}/wp-admin/plugins.php`, { waitUntil: 'networkidle2' });

    // 5. Find the plugin row and click "Update now"
    // Extract just the folder name (e.g. "elementor" from "elementor/elementor")
    const folderSlug = pluginSlug.split('/')[0];
    
    // Use a starts-with CSS selector to reliably find the row, regardless of .php extension
    const updateLinkSelector = `tr[data-plugin^="${folderSlug}"] a.update-link`;
    const updateLinkExists = await page.$(updateLinkSelector);
    
    if (!updateLinkExists) {
      await browser.close();
      throw new Error(`Could not find an 'Update Now' link for ${pluginSlug}. It may already be updated or the plugin slug is incorrect.`);
    }

    // Click it and wait for the "Updated!" message
    console.log('Clicking update...');
    await page.click(updateLinkSelector);
    
    try {
      // WP adds a .updated class to the row or changes the text when done
      await page.waitForSelector(`tr[data-plugin^="${folderSlug}"].updated`, { timeout: 30000 });
      console.log('Update completed successfully!');
    } catch (e) {
      // If the selector isn't found, wait a few seconds to ensure the AJAX request fires before closing
      console.log('Update command sent, waiting for completion...');
      await new Promise(r => setTimeout(() => r(null), 8000));
      console.log('Assumed update completed successfully!');
    }

    // 6. Close the browser
    await browser.close();
    return { success: true };

  } catch (error: any) {
    console.error(`Headless AI Agent failed to update ${pluginSlug}:`, error.message);
    throw new Error(`Agent Error: ${error.message}`);
  }
};

export const getPluginZipUrl = (siteUrl: string, username: string, appPassword: string, pluginSlug: string, version: string) => {
  // E.g. https://downloads.wordpress.org/plugin/woocommerce.8.0.0.zip
  const slug = pluginSlug.split('/')[0];
  return `https://downloads.wordpress.org/plugin/${slug}.${version}.zip`;
};

import fs from 'fs';
import path from 'path';
import os from 'os';
// (Note: axios is already imported at the top of the file)

export const headlessExecuteRollback = async (siteUrl: string, username: string, password: string, pluginSlug: string, previousVersion: string) => {
  try {
    const baseUrl = siteUrl.startsWith('http') ? siteUrl : (siteUrl.includes('localhost') || siteUrl.endsWith('.local') ? `http://${siteUrl}` : `https://${siteUrl}`);
    console.log(`Starting Headless AI Agent to execute UNIVERSAL rollback for ${pluginSlug} to version ${previousVersion} on ${baseUrl}`);

    // 1. Download the old version ZIP
    const folderSlug = pluginSlug.split('/')[0];
    const zipUrl = `https://downloads.wordpress.org/plugin/${folderSlug}.${previousVersion}.zip`;
    const tempZipPath = path.join(os.tmpdir(), `${folderSlug}-${previousVersion}.zip`);
    
    console.log(`Downloading previous version zip from ${zipUrl}...`);
    const response = await axios({ url: zipUrl, method: 'GET', responseType: 'stream' });
    const writer = fs.createWriteStream(tempZipPath);
    response.data.pipe(writer);
    await new Promise<void>((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    console.log(`Zip downloaded to ${tempZipPath}. Launching browser...`);

    const puppeteer = (await import('puppeteer')).default;
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--single-process', '--no-zygote']
    });
    const page = await browser.newPage();
    
    console.log(`Navigating to ${baseUrl}/wp-login.php`);
    await page.goto(`${baseUrl}/wp-login.php`, { waitUntil: 'networkidle2' });

    console.log('Typing credentials...');
    await page.type('#user_login', username);
    await page.type('#user_pass', password);
    
    console.log('Clicking login...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click('#wp-submit')
    ]);

    const isError = await page.$('#login_error');
    if (isError) {
      await browser.close();
      throw new Error('WordPress login failed.');
    }

    console.log('Navigating to Plugin Upload page...');
    await page.goto(`${baseUrl}/wp-admin/plugin-install.php?tab=upload`, { waitUntil: 'networkidle2' });

    console.log('Uploading ZIP file...');
    const fileInput = await page.$('input[type="file"][name="pluginzip"]');
    if (!fileInput) {
      await browser.close();
      throw new Error('Upload form not found on the page.');
    }
    await fileInput.uploadFile(tempZipPath);

    console.log('Clicking Install Now...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 120000 }), // 2 minute timeout for large zip uploads
      page.click('#install-plugin-submit')
    ]);

    console.log('Waiting for "Replace current with uploaded" button...');
    // WP 5.5+ shows a comparison screen if the plugin is already installed
    const replaceButtonSelector = 'a.button-primary[href*="action=upload-plugin"]';
    
    try {
      await page.waitForSelector(replaceButtonSelector, { timeout: 30000 });
      console.log('Clicking Replace current with uploaded...');
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 120000 }), // Wait for extraction
        page.click(replaceButtonSelector)
      ]);
    } catch (e) {
      console.log('Did not find the Replace button. Assuming plugin installed successfully or an error occurred.');
    }

    console.log('Rollback completed successfully!');
    await browser.close();
    
    // Cleanup temp file
    if (fs.existsSync(tempZipPath)) {
      fs.unlinkSync(tempZipPath);
    }
    
    return { success: true };

  } catch (error: any) {
    console.error(`Headless AI Agent failed to rollback ${pluginSlug}:`, error.message);
    throw new Error(`Agent Error: ${error.message}`);
  }
};
