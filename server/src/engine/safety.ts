export const CRITICAL_PLUGIN_SLUGS = new Set([
  'woocommerce',
  'stripe-gateway',
  'woocommerce-payments',
  'paypal-checkout',
  'wpforms',
  'contact-form-7',
  'gravityforms',
  'elementor',
  'wordpress-seo',
  'updraftplus'
]);

export const isCriticalPlugin = (slug: string): boolean => {
  const normalizedSlug = slug.split('/')[0].toLowerCase();
  return CRITICAL_PLUGIN_SLUGS.has(normalizedSlug);
};

export const canAutoApply = (safetyScore: number, pluginSlug: string): boolean => {
  return safetyScore >= 85 && !isCriticalPlugin(pluginSlug);
};

export const getManualInstructions = (pluginSlug: string, currentVersion: string, newVersion: string): string => {
  return `Manual Update Instructions for ${pluginSlug}:
1. Backup your website database and files.
2. Log into your WordPress admin dashboard.
3. Navigate to Plugins > Installed Plugins.
4. Locate '${pluginSlug}' (Currently v${currentVersion}).
5. Click 'Update Now' to install v${newVersion}.
6. Verify critical functionalities (e.g. checkout, contact forms) are working properly.`;
};
