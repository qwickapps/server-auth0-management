/**
 * Action Templates
 *
 * Pre-built action code templates for Auth0 deployment.
 * These are embedded as strings to avoid runtime bundling dependencies.
 *
 * All product-specific naming is configurable via ActionTemplateConfig.
 */

/** Action template version - update when action code changes */
export const ACTION_TEMPLATE_VERSION = '1.0.0';

/** Build timestamp for tracking deployments */
export const ACTION_TEMPLATE_BUILD_DATE = '2025-12-11';

/**
 * Get the current action template version
 */
export function getActionTemplateVersion(): string {
  return ACTION_TEMPLATE_VERSION;
}

/**
 * Configuration for action templates - allows customizing all naming
 */
export interface ActionTemplateConfig {
  /** Prefix for action names (e.g., 'myapp-' creates 'myapp-post-login') */
  actionNamePrefix: string;

  /** Key for storing metadata in Auth0 user_metadata (e.g., 'myapp') */
  metadataKey: string;

  /** Namespace for custom claims in tokens (e.g., 'https://myapp.com') */
  claimsNamespace: string;

  /** Secret name for callback URL (e.g., 'MYAPP_API_URL') */
  callbackUrlSecretName: string;

  /** Secret name for API key (e.g., 'MYAPP_API_KEY') */
  callbackApiKeySecretName: string;
}

/**
 * Post-login action metadata
 */
export interface ActionMetadata {
  name: string;
  displayName: string;
  description: string;
  runtime: string;
  trigger: string;
  version: string;
  buildDate: string;
  secrets: Array<{
    name: string;
    description: string;
    required: boolean;
    default?: string;
  }>;
}

/**
 * Get the post-login action code
 *
 * @param config - Configuration for customizing action naming
 */
export function getPostLoginActionCode(config: ActionTemplateConfig): string {
  // Escape values for safe injection into JavaScript string
  const metadataKey = config.metadataKey.replace(/'/g, "\\'");
  const claimsNamespace = config.claimsNamespace.replace(/'/g, "\\'");
  const urlSecretName = config.callbackUrlSecretName;
  const keySecretName = config.callbackApiKeySecretName;

  return `/**
 * Auth0 Post-Login Action
 * Version: ${ACTION_TEMPLATE_VERSION}
 * Build: ${ACTION_TEMPLATE_BUILD_DATE}
 *
 * Checks bans and syncs entitlements from your server.
 *
 * Required Secrets:
 * - ${urlSecretName}: Base URL of your server
 * - ${keySecretName}: API key for authentication
 */

const DEFAULT_TIMEOUT_MS = 5000;

/**
 * Fetch with timeout support
 */
async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout after ' + timeoutMs + 'ms');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Make an API request
 */
async function apiRequest(baseUrl, path, apiKey, timeoutMs) {
  const url = baseUrl.replace(/\\/$/, '') + path;

  const response = await fetchWithTimeout(
    url,
    {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Accept': 'application/json',
        'User-Agent': 'Auth0-Action/1.0',
      },
    },
    timeoutMs
  );

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error('API request failed: ' + response.status + ' ' + response.statusText + (errorBody ? ' - ' + errorBody : ''));
  }

  return response.json();
}

/**
 * Format ban denial message
 */
function formatBanMessage(banInfo) {
  let message = 'Access denied';

  if (banInfo.reason) {
    message += ': ' + banInfo.reason;
  }

  if (banInfo.expires_at && !banInfo.permanent) {
    const expiresDate = new Date(banInfo.expires_at);
    message += '. Ban expires: ' + expiresDate.toLocaleDateString();
  } else if (banInfo.permanent) {
    message += '. This ban is permanent.';
  }

  return message;
}

/**
 * Auth0 Post-Login Action Handler
 */
exports.onExecutePostLogin = async (event, api) => {
  // Configuration (injected at build time)
  const METADATA_KEY = '${metadataKey}';
  const CLAIMS_NAMESPACE = '${claimsNamespace}';

  // Extract configuration from secrets
  const apiUrl = event.secrets['${urlSecretName}'];
  const apiKey = event.secrets['${keySecretName}'];
  const timeoutMs = parseInt(event.secrets.TIMEOUT_MS || DEFAULT_TIMEOUT_MS, 10);
  const environment = event.secrets.ENVIRONMENT || 'production';
  const skipBanCheck = event.secrets.SKIP_BAN_CHECK === 'true';
  const skipEntitlementsSync = event.secrets.SKIP_ENTITLEMENTS_SYNC === 'true';

  const email = event.user.email;

  // Validate required configuration
  if (!apiUrl) {
    console.error('[auth0-action] ${urlSecretName} secret is required');
    return;
  }

  if (!apiKey) {
    console.error('[auth0-action] ${keySecretName} secret is required');
    return;
  }

  if (!email) {
    console.warn('[auth0-action] User has no email address, skipping sync');
    return;
  }

  const encodedEmail = encodeURIComponent(email);

  // Step 1: Check if user is banned
  if (!skipBanCheck) {
    try {
      const banResult = await apiRequest(apiUrl, '/api/bans/email/' + encodedEmail, apiKey, timeoutMs);

      if (banResult.banned) {
        const denyMessage = formatBanMessage(banResult);
        console.info('[auth0-action] User is banned: ' + email);
        api.access.deny(denyMessage);
        return;
      }
    } catch (error) {
      console.error('[auth0-action] Ban check failed:', error.message);

      if (environment === 'development' && event.secrets.FAIL_ON_ERROR === 'true') {
        api.access.deny('Ban check failed: ' + error.message);
        return;
      }
    }
  }

  // Step 2: Sync entitlements
  if (!skipEntitlementsSync) {
    try {
      const entitlements = await apiRequest(apiUrl, '/api/entitlements/' + encodedEmail, apiKey, timeoutMs);

      if (entitlements) {
        // Build metadata object
        const metadata = {
          entitlements: entitlements.entitlements || [],
          sync_timestamp: new Date().toISOString(),
          sync_status: 'success',
        };

        if (entitlements.metadata && entitlements.metadata.subscription_id) {
          metadata.subscription_id = String(entitlements.metadata.subscription_id);
        }

        // Store in user metadata
        api.user.setUserMetadata(METADATA_KEY, metadata);

        // Set ID token custom claims
        api.idToken.setCustomClaim(CLAIMS_NAMESPACE + '/entitlements', metadata.entitlements);

        if (metadata.subscription_id) {
          api.idToken.setCustomClaim(CLAIMS_NAMESPACE + '/subscription_id', metadata.subscription_id);
        }

        console.info('[auth0-action] Entitlements sync successful for ' + email + ': ' + metadata.entitlements.length + ' entitlements');
      }
    } catch (error) {
      console.error('[auth0-action] Entitlements sync failed:', error.message);

      // Record error in metadata
      api.user.setUserMetadata(METADATA_KEY, {
        sync_timestamp: new Date().toISOString(),
        sync_status: 'error',
        error_message: error.message,
      });

      if (environment === 'development' && event.secrets.FAIL_ON_ERROR === 'true') {
        api.access.deny('Entitlements sync failed: ' + error.message);
      }
    }
  }
};
`;
}

/**
 * Get post-login action metadata
 *
 * @param config - Configuration for customizing action naming
 */
export function getPostLoginActionMetadata(config: ActionTemplateConfig): ActionMetadata {
  return {
    name: `${config.actionNamePrefix}post-login`,
    displayName: `${config.actionNamePrefix.replace(/-$/, '')} Post-Login`,
    description: 'Check bans and sync entitlements from your server',
    runtime: 'node18',
    trigger: 'post-login',
    version: ACTION_TEMPLATE_VERSION,
    buildDate: ACTION_TEMPLATE_BUILD_DATE,
    secrets: [
      {
        name: config.callbackUrlSecretName,
        description: 'Base URL of your server (e.g., https://api.example.com)',
        required: true,
      },
      {
        name: config.callbackApiKeySecretName,
        description: 'API key for authentication',
        required: true,
      },
      {
        name: 'TIMEOUT_MS',
        description: 'Request timeout in milliseconds',
        required: false,
        default: '5000',
      },
      {
        name: 'SKIP_BAN_CHECK',
        description: 'Set to "true" to skip ban checking',
        required: false,
        default: 'false',
      },
      {
        name: 'SKIP_ENTITLEMENTS_SYNC',
        description: 'Set to "true" to skip entitlements sync',
        required: false,
        default: 'false',
      },
    ],
  };
}
