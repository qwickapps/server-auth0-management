/**
 * @qwickapps/server-auth0-management
 *
 * QwickApps Server plugin for managing Auth0 Actions programmatically.
 *
 * This package provides:
 * - Auth0 Management API client for deploying actions
 * - Server plugin with API routes for action management
 * - Downloadable action bundles for manual deployment
 *
 * @example
 * ```typescript
 * import { createServer } from '@qwickapps/server';
 * import { auth0ManagementPlugin } from '@qwickapps/server-auth0-management';
 *
 * const server = createServer({
 *   plugins: [auth0ManagementPlugin],
 *   pluginConfig: {
 *     'auth0-management': {
 *       domain: 'tenant.auth0.com',
 *       clientId: 'xxx',
 *       clientSecret: 'xxx',
 *       qwickappsApiUrl: 'https://api.example.com',
 *       qwickappsApiKey: 'xxx',
 *     },
 *   },
 * });
 * ```
 */

// Export plugin
export { auth0ManagementPlugin, default } from './plugin.js';

// Export types
export type {
  Auth0ManagementConfig,
  Auth0ManagementPluginConfig,
  Auth0Action,
  CreateActionRequest,
  UpdateActionRequest,
  TriggerBinding,
  TriggerBindingUpdate,
  DeployResult,
  ActionBundle,
  TokenResponse,
} from './types/index.js';

// Export management classes
export {
  Auth0ManagementClient,
  ActionsManager,
  TriggersManager,
  getPostLoginActionCode,
  getPostLoginActionMetadata,
} from './management/index.js';
export type { ActionMetadata } from './management/index.js';
