import axios from 'axios';
import semver from 'semver';
import { config } from '../config.js';

export const checkVulnerabilities = async (plugins: { slug: string, version: string }[]) => {
  const results = [];
  
  for (const plugin of plugins) {
    try {
      // WPScan plugin slug is usually just the folder name, so split by '/' if needed
      const slug = plugin.slug.split('/')[0];
      
      const response = await axios.get(`https://wpscan.com/api/v3/plugins/${slug}`, {
        headers: {
          Authorization: `Token token=${config.wpscanApiToken}`
        },
        validateStatus: () => true
      });

      if (response.status === 429) {
        throw new Error('WPScan API rate limit hit (50 requests/day). Please upgrade your WPScan account or try again tomorrow.');
      }
      
      if (response.status === 401 || response.status === 403) {
        throw new Error('WPScan API Token is invalid or unauthorized.');
      }

      if (response.status === 404) {
        // Plugin not found in WPScan db
        results.push({
          slug: plugin.slug,
          version: plugin.version,
          vulnerabilities: [],
          is_vulnerable: false
        });
        continue;
      }

      const pluginData = response.data[slug];
      if (!pluginData || !pluginData.vulnerabilities) {
        results.push({
          slug: plugin.slug,
          version: plugin.version,
          vulnerabilities: [],
          is_vulnerable: false
        });
        continue;
      }

      const vulns = pluginData.vulnerabilities.filter((v: any) => {
        if (!v.fixed_in) return true;
        try {
          const currentVersion = semver.coerce(plugin.version);
          const fixedVersion = semver.coerce(v.fixed_in);
          if (currentVersion && fixedVersion) {
            return semver.lt(currentVersion, fixedVersion);
          }
          // Fallback to string compare if semver coercion fails
          return v.fixed_in > plugin.version;
        } catch {
          return v.fixed_in > plugin.version;
        }
      });

      results.push({
        slug: plugin.slug,
        version: plugin.version,
        vulnerabilities: vulns.map((v: any) => ({
          title: v.title,
          severity: v.cvss?.score >= 7 ? 'High' : 'Medium', // Approximation
          fixed_in: v.fixed_in
        })),
        is_vulnerable: vulns.length > 0
      });

    } catch (error: any) {
      console.error(`WPScan API error for ${plugin.slug}:`, error.message);
      // Re-throw critical API errors so the scan aborts properly
      if (error.message.includes('WPScan API')) {
        throw error;
      }
      // Gracefully continue
      results.push({
        slug: plugin.slug,
        version: plugin.version,
        vulnerabilities: [],
        is_vulnerable: false
      });
    }
  }

  return results;
};
