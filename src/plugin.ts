/**
 * Auth0 Management Plugin
 *
 * QwickApps Server plugin for managing Auth0 Actions programmatically.
 */

import type {
  Plugin,
  PluginConfig,
  PluginRegistry,
  HealthCheck,
} from '@qwickapps/server';
import type { Auth0ManagementConfig } from './types/index.js';
import { Auth0ManagementClient, ActionsManager, TriggersManager } from './management/index.js';
import { createActionsRoutes, createTriggersRoutes, createBundleRoutes } from './routes/index.js';

const PLUGIN_ID = 'auth0-management';

/**
 * Auth0 Management Plugin
 *
 * Provides API routes for deploying and managing Auth0 actions.
 *
 * Configuration:
 * - domain: Auth0 tenant domain
 * - clientId: M2M app client ID
 * - clientSecret: M2M app client secret
 * - qwickappsApiUrl: URL for actions to call back
 * - qwickappsApiKey: API key for action authentication
 */
export const auth0ManagementPlugin: Plugin = {
  id: PLUGIN_ID,
  name: 'Auth0 Management',
  version: '1.0.0',

  async onStart(pluginConfig: PluginConfig, registry: PluginRegistry) {
    const config = pluginConfig as unknown as Auth0ManagementConfig;
    const logger = registry.getLogger(PLUGIN_ID);

    // Validate required configuration
    if (!config.domain) {
      logger.warn('[auth0-management] Missing domain configuration - plugin disabled');
      return;
    }

    if (!config.clientId || !config.clientSecret) {
      logger.warn('[auth0-management] Missing M2M credentials - plugin disabled');
      return;
    }

    if (!config.callbackUrl || !config.callbackApiKey) {
      logger.warn('[auth0-management] Missing callback URL/API key configuration - plugin disabled');
      return;
    }

    if (!config.actionNamePrefix || !config.metadataKey || !config.claimsNamespace) {
      logger.warn('[auth0-management] Missing actionNamePrefix, metadataKey, or claimsNamespace - plugin disabled');
      return;
    }

    // Initialize management client
    const managementClient = new Auth0ManagementClient({
      domain: config.domain,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      audience: config.audience,
    });

    // Initialize managers
    const actionsManager = new ActionsManager(managementClient, config);
    const triggersManager = new TriggersManager(managementClient);

    // Create route handlers
    const actionsRoutes = createActionsRoutes(actionsManager, triggersManager);
    const triggersRoutes = createTriggersRoutes(triggersManager);
    const bundleRoutes = createBundleRoutes(actionsManager);

    // Register routes

    // Actions routes
    registry.addRoute({
      method: 'get',
      path: '/api/auth0/actions',
      pluginId: PLUGIN_ID,
      handler: actionsRoutes.listActions,
    });

    registry.addRoute({
      method: 'post',
      path: '/api/auth0/actions/deploy',
      pluginId: PLUGIN_ID,
      handler: actionsRoutes.deployAction,
    });

    registry.addRoute({
      method: 'delete',
      path: '/api/auth0/actions/:actionId',
      pluginId: PLUGIN_ID,
      handler: actionsRoutes.undeployAction,
    });

    // Triggers routes
    registry.addRoute({
      method: 'get',
      path: '/api/auth0/triggers/post-login',
      pluginId: PLUGIN_ID,
      handler: triggersRoutes.listPostLoginBindings,
    });

    registry.addRoute({
      method: 'post',
      path: '/api/auth0/triggers/post-login/bind',
      pluginId: PLUGIN_ID,
      handler: triggersRoutes.bindAction,
    });

    registry.addRoute({
      method: 'delete',
      path: '/api/auth0/triggers/post-login/:actionId',
      pluginId: PLUGIN_ID,
      handler: triggersRoutes.unbindAction,
    });

    registry.addRoute({
      method: 'put',
      path: '/api/auth0/triggers/post-login/reorder',
      pluginId: PLUGIN_ID,
      handler: triggersRoutes.reorderBindings,
    });

    // Bundle routes
    registry.addRoute({
      method: 'get',
      path: '/api/auth0/bundle/post-login',
      pluginId: PLUGIN_ID,
      handler: bundleRoutes.getPostLoginBundle,
    });

    registry.addRoute({
      method: 'get',
      path: '/api/auth0/bundle/post-login/download',
      pluginId: PLUGIN_ID,
      handler: bundleRoutes.downloadPostLoginBundle,
    });

    // Config route (masked secrets)
    registry.addRoute({
      method: 'get',
      path: '/api/auth0/config',
      pluginId: PLUGIN_ID,
      handler: async (_req, res) => {
        res.json({
          domain: config.domain,
          clientId: config.clientId,
          clientSecretSet: !!config.clientSecret,
          callbackUrl: config.callbackUrl,
          callbackApiKeySet: !!config.callbackApiKey,
          actionNamePrefix: config.actionNamePrefix,
          metadataKey: config.metadataKey,
          claimsNamespace: config.claimsNamespace,
          callbackUrlSecretName: config.callbackUrlSecretName,
          callbackApiKeySecretName: config.callbackApiKeySecretName,
          defaultTimeoutMs: config.defaultTimeoutMs || 5000,
        });
      },
    });

    // Test connection route
    registry.addRoute({
      method: 'post',
      path: '/api/auth0/config/test',
      pluginId: PLUGIN_ID,
      handler: async (_req, res) => {
        const result = await managementClient.testConnection();
        res.json(result);
      },
    });

    // Register health check
    const healthCheck: HealthCheck = {
      name: 'auth0-management',
      type: 'custom',
      check: async () => {
        try {
          const result = await managementClient.testConnection();
          return {
            healthy: result.success,
            details: { message: result.success ? 'Connected to Auth0' : result.error },
          };
        } catch (error) {
          return {
            healthy: false,
            details: { message: error instanceof Error ? error.message : 'Unknown error' },
          };
        }
      },
    };
    registry.registerHealthCheck(healthCheck);

    // Register menu item for control panel
    registry.addMenuItem({
      id: 'auth0-actions',
      label: 'Auth0 Actions',
      icon: 'Shield',
      route: '/auth0/actions',
      order: 80,
      pluginId: PLUGIN_ID,
    });

    // Register page contribution for control panel
    // Note: The actual React component must be registered by the consumer app
    // using the exported Auth0ActionsPage from '@qwickapps/server-auth0-management/ui'
    registry.addPage({
      id: 'auth0-actions-page',
      route: '/auth0/actions',
      component: 'Auth0ActionsPage',
      title: 'Auth0 Actions',
      pluginId: PLUGIN_ID,
    });

    // Register widget contribution for dashboard
    // Note: The actual React component must be registered by the consumer app
    // using getAuth0WidgetComponents() from '@qwickapps/server-auth0-management/ui'
    registry.addWidget({
      id: 'auth0-status-widget',
      title: 'Auth0 Actions',
      component: 'Auth0StatusWidget',
      priority: 80,
      showByDefault: true,
      pluginId: PLUGIN_ID,
    });

    logger.info(`[auth0-management] Plugin started for domain: ${config.domain}`);
  },

  async onStop() {
    // No cleanup needed
  },
};

export default auth0ManagementPlugin;
