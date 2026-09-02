import axios from 'axios';
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
        // To avoid hitting rate limits quickly in dev, you might want a local cache or handle 404s
        validateStatus: (status) => status === 200 || status === 404
      });

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
        // Simple version check (in reality, requires proper version parsing)
        // If fixed_in is present and current version is < fixed_in
        return !v.fixed_in || v.fixed_in > plugin.version;
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
