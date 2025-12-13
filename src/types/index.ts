/**
 * Type definitions for @qwickapps/server-auth0-management
 *
 * Re-exports core types from @qwickapps/auth0-management-client
 * plus plugin-specific types.
 */

// Re-export types from shared client (except Auth0ManagementConfig which we override)
export type {
  Auth0ManagementConfig as BaseAuth0ManagementConfig,
  TokenResponse,
  Auth0Action,
  CreateActionRequest,
  UpdateActionRequest,
  TriggerBinding,
  TriggerBindingUpdate,
} from '@qwickapps/auth0-management-client';

// Plugin-specific types

/**
 * Plugin configuration for Auth0 Management
 *
 * All product-specific naming is configurable - this library does not
 * impose any particular naming conventions.
 */
export interface Auth0ManagementPluginConfig {
  /** Auth0 tenant domain (e.g., 'tenant.auth0.com') */
  domain: string;

  /** M2M application client ID */
  clientId: string;

  /** M2M application client secret */
  clientSecret: string;

  /** Management API audience (defaults to https://{domain}/api/v2/) */
  audience?: string;

  /** Callback URL that deployed actions will call (e.g., 'https://api.example.com/api/v1') */
  callbackUrl: string;

  /** API key for authenticating action callbacks */
  callbackApiKey: string;

  /** Prefix for action names (e.g., 'myapp-' creates 'myapp-post-login') */
  actionNamePrefix: string;

  /** Key for storing metadata in Auth0 user_metadata (e.g., 'myapp') */
  metadataKey: string;

  /** Namespace for custom claims in tokens (e.g., 'https://myapp.com') */
  claimsNamespace: string;

  /** Environment variable name for callback URL in actions (e.g., 'MYAPP_API_URL') */
  callbackUrlSecretName?: string;

  /** Environment variable name for API key in actions (e.g., 'MYAPP_API_KEY') */
  callbackApiKeySecretName?: string;

  /** Default timeout for action API calls (default: 5000) */
  defaultTimeoutMs?: number;
}

// Alias for convenience
export type Auth0ManagementConfig = Auth0ManagementPluginConfig;

/**
 * Deploy action result
 */
export interface DeployResult {
  success: boolean;
  actionId?: string;
  deployed?: boolean;
  boundToTrigger?: boolean;
  error?: string;
}

/**
 * Action bundle for manual deployment
 */
export interface ActionBundle {
  filename: string;
  code: string;
  secrets: Array<{
    name: string;
    description: string;
    required: boolean;
    default?: string;
  }>;
  instructions: string;
}
