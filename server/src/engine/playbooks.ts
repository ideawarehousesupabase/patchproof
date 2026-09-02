export const generateRepairPlaybook = (pluginSlug: string, currentVersion: string, newVersion: string, vulnerability: any) => {
  return {
    rootCause: `Vulnerability found in ${pluginSlug} version ${currentVersion}: ${vulnerability?.title || 'Known security issue'}.`,
    proposedRepair: `Update ${pluginSlug} to version ${newVersion || 'the latest secure version'}.`,
    components: [
      `Plugin: ${pluginSlug}`,
      `Current: v${currentVersion}`,
      `Target: v${newVersion || 'latest'}`
    ],
    expectedOutcome: `Vulnerability patched successfully with no impact on core functionality.`,
    validationRequired: true,
    rollbackPlan: `1. Disable plugin.\n2. Restore v${currentVersion} from backup via WP-CLI or FTP.`
  };
};
