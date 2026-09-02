import axios from 'axios';
import { config } from '../config.js';

export const triggerValidation = async (websiteUrl: string, journeyType: string, journeyId: string, accountId: string) => {
  if (!config.githubToken || !config.githubRepoOwner || !config.githubRepoName) {
    throw new Error('GitHub configuration is missing. Cannot trigger validation.');
  }

  try {
    const url = `https://api.github.com/repos/${config.githubRepoOwner}/${config.githubRepoName}/dispatches`;
    
    await axios.post(
      url,
      {
        event_type: 'validate-journey',
        client_payload: {
          website_url: websiteUrl,
          journey_type: journeyType,
          journey_id: journeyId,
          account_id: accountId
        }
      },
      {
        headers: {
          Authorization: `Bearer ${config.githubToken}`,
          Accept: 'application/vnd.github.v3+json',
        }
      }
    );
    console.log(`Triggered GitHub action for validation ${journeyId}`);
    return true;
  } catch (error: any) {
    console.error('Failed to trigger GitHub Actions:', error.response?.data || error.message);
    throw new Error(`GitHub API Error: ${error.message}`);
  }
};
