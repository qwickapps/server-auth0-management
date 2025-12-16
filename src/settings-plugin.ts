/**
 * Auth0 Settings Plugin
 *
 * QwickApps Server plugin for managing Auth0 tenant configuration.
 * Provides database storage for M2M credentials with environment fallback.
 */

import type {
  Plugin,
  PluginConfig,
  PluginRegistry,
  HealthCheck,
} from '@qwickapps/server';
import type { Pool } from 'pg';
import { Auth0SettingsService } from './settings/index.js';
import { createSettingsRoutes } from './routes/settings.js';

const PLUGIN_ID = 'auth0-settings';

/**
 * Configuration for Auth0 Settings Plugin
 */
export interface Auth0SettingsPluginConfig {
  /** PostgreSQL pool or function that returns one */
  pool: Pool | (() => Pool);

  /** Environment variable fallback configuration */
  envConfig: {
    domain: string;
    clientId: string;
    clientSecret: string;
    audience?: string;
  };

  /** Database table name for storing configs (default: 'auth0_m2m_config') */
  tableName?: string;

  /** Whether to auto-create the table if it doesn't exist (default: true) */
  autoCreateTable?: boolean;

  /** API route prefix (default: '/api/auth0/settings') */
  routePrefix?: string;
}

/**
 * Create Auth0 Settings Plugin
 *
 * Provides API routes for managing Auth0 tenant configuration:
 * - Store M2M credentials in database
 * - Test credentials
 * - Get social connections
 * - Status endpoint
 *
 * @example
 * ```typescript
 * import { createAuth0SettingsPlugin } from '@qwickapps/server-auth0-management';
 * import { getPostgres } from '@qwickapps/server';
 *
 * {
 *   plugin: createAuth0SettingsPlugin({
 *     pool: () => getPostgres().getPool(),
 *     envConfig: {
 *       domain: process.env.AUTH0_DOMAIN || '',
 *       clientId: process.env.AUTH0_M2M_CLIENT_ID || '',
 *       clientSecret: process.env.AUTH0_M2M_CLIENT_SECRET || '',
 *       audience: process.env.AUTH0_M2M_AUDIENCE,
 *     },
 *   }),
 * }
 * ```
 */
export function createAuth0SettingsPlugin(options: Auth0SettingsPluginConfig): Plugin {
  const {
    pool,
    envConfig,
    tableName = 'auth0_m2m_config',
    autoCreateTable = true,
    routePrefix = '/api/auth0/settings',
  } = options;

  return {
    id: PLUGIN_ID,
    name: 'Auth0 Settings',
    version: '1.0.0',

    async onStart(_pluginConfig: PluginConfig, registry: PluginRegistry) {
      const logger = registry.getLogger(PLUGIN_ID);

      // Create settings service
      const settingsService = new Auth0SettingsService({
        pool,
        envConfig,
        tableName,
      });

      // Auto-create table if enabled
      if (autoCreateTable) {
        try {
          await settingsService.ensureTable();
          logger.debug('[auth0-settings] Database table ensured');
        } catch (err) {
          logger.error(`[auth0-settings] Failed to create table: ${err instanceof Error ? err.message : String(err)}`);
        }
      }

      // Create route handlers
      const routes = createSettingsRoutes(settingsService);

      // Register routes
      registry.addRoute({
        method: 'get',
        path: `${routePrefix}/status`,
        pluginId: PLUGIN_ID,
        handler: routes.getStatus,
      });

      registry.addRoute({
        method: 'get',
        path: `${routePrefix}/config`,
        pluginId: PLUGIN_ID,
        handler: routes.getConfig,
      });

      registry.addRoute({
        method: 'get',
        path: `${routePrefix}/m2m-configs`,
        pluginId: PLUGIN_ID,
        handler: routes.getM2MConfigs,
      });

      registry.addRoute({
        method: 'post',
        path: `${routePrefix}/m2m-config`,
        pluginId: PLUGIN_ID,
        handler: routes.saveM2MConfig,
      });

      registry.addRoute({
        method: 'delete',
        path: `${routePrefix}/m2m-config/:id`,
        pluginId: PLUGIN_ID,
        handler: routes.deleteM2MConfig,
      });

      registry.addRoute({
        method: 'post',
        path: `${routePrefix}/test`,
        pluginId: PLUGIN_ID,
        handler: routes.testCurrentConfig,
      });

      registry.addRoute({
        method: 'post',
        path: `${routePrefix}/test-credentials`,
        pluginId: PLUGIN_ID,
        handler: routes.testCredentials,
      });

      registry.addRoute({
        method: 'get',
        path: `${routePrefix}/connections`,
        pluginId: PLUGIN_ID,
        handler: routes.getConnections,
      });

      registry.addRoute({
        method: 'get',
        path: `${routePrefix}/urls`,
        pluginId: PLUGIN_ID,
        handler: routes.getUrls,
      });

      // Register health check
      const healthCheck: HealthCheck = {
        name: 'auth0-settings',
        type: 'custom',
        check: async () => {
          try {
            const status = await settingsService.getStatus();
            if (!status.configured) {
              return {
                healthy: true,
                details: { message: 'Auth0 not configured' },
              };
            }

            const testResult = await settingsService.testCurrentConfig();
            return {
              healthy: testResult.valid,
              details: {
                message: testResult.valid
                  ? `Connected to ${status.domain}`
                  : testResult.error,
                domain: status.domain,
                source: status.source,
              },
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

      // Log status
      const status = await settingsService.getStatus();
      if (status.configured) {
        logger.info(`[auth0-settings] Configured for domain: ${status.domain} (source: ${status.source})`);
      } else {
        logger.debug('[auth0-settings] Not configured - set credentials via control panel or environment');
      }
    },

    async onStop() {
      // No cleanup needed
    },
  };
}
