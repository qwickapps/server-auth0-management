/**
 * Auth0 Settings Routes
 *
 * API routes for managing Auth0 tenant configuration.
 */

import type { Request, Response } from 'express';
import type { Auth0SettingsService } from '../settings/index.js';

/**
 * Validate Auth0 domain format
 * Valid formats: tenant.auth0.com, tenant.us.auth0.com, tenant.eu.auth0.com, custom domains
 */
function isValidAuth0Domain(domain: string): boolean {
  // Standard Auth0 domains
  if (/^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.auth0\.com$/.test(domain)) {
    return true;
  }
  // Custom domains (any valid hostname)
  if (/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9](\.[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])*\.[a-zA-Z]{2,}$/.test(domain)) {
    return true;
  }
  return false;
}

/**
 * Create settings route handlers
 */
export function createSettingsRoutes(settingsService: Auth0SettingsService) {
  return {
    /**
     * GET /api/auth0/settings/status
     * Get current configuration status
     */
    getStatus: async (_req: Request, res: Response) => {
      try {
        const status = await settingsService.getStatus();
        res.json(status);
      } catch (err) {
        console.error('Failed to get Auth0 status:', err);
        res.status(500).json({ error: 'Failed to get Auth0 status' });
      }
    },

    /**
     * GET /api/auth0/settings/config
     * Get current configuration (masked secrets)
     */
    getConfig: async (_req: Request, res: Response) => {
      try {
        const config = await settingsService.getConfig();
        res.json({
          domain: config.domain,
          client_id: config.client_id,
          client_secret_set: !!config.client_secret,
          audience: config.audience,
          name: config.name,
          source: config.source,
        });
      } catch (err) {
        console.error('Failed to get Auth0 config:', err);
        res.status(500).json({ error: 'Failed to get Auth0 config' });
      }
    },

    /**
     * GET /api/auth0/settings/m2m-configs
     * Get all stored M2M configurations
     */
    getM2MConfigs: async (_req: Request, res: Response) => {
      try {
        const configs = await settingsService.getM2MConfigs();

        // Mask secrets
        const maskedConfigs = configs.map(c => ({
          id: c.id,
          name: c.name,
          domain: c.domain,
          client_id: c.client_id,
          client_secret_set: !!c.client_secret,
          audience: c.audience,
          scope: c.scope,
          is_active: c.is_active,
          last_validated: c.last_validated,
          validation_error: c.validation_error,
          created_at: c.created_at,
          updated_at: c.updated_at,
        }));

        res.json({ configs: maskedConfigs });
      } catch (err) {
        console.error('Failed to get M2M configs:', err);
        res.status(500).json({ error: 'Failed to get M2M configs' });
      }
    },

    /**
     * POST /api/auth0/settings/m2m-config
     * Save a new M2M configuration
     */
    saveM2MConfig: async (req: Request, res: Response) => {
      try {
        const { name, domain, client_id, client_secret, audience, scope } = req.body;

        if (!domain || !client_id || !client_secret) {
          res.status(400).json({
            error: 'domain, client_id, and client_secret are required',
          });
          return;
        }

        // Validate domain format
        if (!isValidAuth0Domain(domain)) {
          res.status(400).json({
            error: 'Invalid Auth0 domain format. Expected format: tenant.auth0.com or custom domain',
          });
          return;
        }

        const result = await settingsService.saveM2MConfig({
          name,
          domain,
          client_id,
          client_secret,
          audience,
          scope,
        });

        if (!result.success) {
          res.status(400).json({ error: result.error });
          return;
        }

        res.json({
          message: 'M2M configuration saved successfully',
          id: result.id,
        });
      } catch (err) {
        console.error('Failed to save M2M config:', err);
        res.status(500).json({ error: 'Failed to save M2M config' });
      }
    },

    /**
     * DELETE /api/auth0/settings/m2m-config/:id
     * Delete an M2M configuration
     */
    deleteM2MConfig: async (req: Request, res: Response) => {
      try {
        const { id } = req.params;

        const result = await settingsService.deleteM2MConfig(parseInt(id, 10));

        if (!result.success) {
          res.status(400).json({ error: result.error });
          return;
        }

        res.json({ message: 'M2M configuration deleted' });
      } catch (err) {
        console.error('Failed to delete M2M config:', err);
        res.status(500).json({ error: 'Failed to delete M2M config' });
      }
    },

    /**
     * POST /api/auth0/settings/test
     * Test current configuration
     */
    testCurrentConfig: async (_req: Request, res: Response) => {
      try {
        const result = await settingsService.testCurrentConfig();
        res.json(result);
      } catch (err) {
        console.error('Failed to test Auth0 config:', err);
        res.status(500).json({ error: 'Failed to test Auth0 config' });
      }
    },

    /**
     * POST /api/auth0/settings/test-credentials
     * Test specific credentials without saving
     */
    testCredentials: async (req: Request, res: Response) => {
      try {
        const { domain, client_id, client_secret, audience } = req.body;

        if (!domain || !client_id || !client_secret) {
          res.status(400).json({
            error: 'domain, client_id, and client_secret are required',
          });
          return;
        }

        // Validate domain format
        if (!isValidAuth0Domain(domain)) {
          res.status(400).json({
            error: 'Invalid Auth0 domain format. Expected format: tenant.auth0.com or custom domain',
          });
          return;
        }

        const result = await settingsService.testCredentials(
          domain,
          client_id,
          client_secret,
          audience
        );

        res.json(result);
      } catch (err) {
        console.error('Failed to test credentials:', err);
        res.status(500).json({ error: 'Failed to test credentials' });
      }
    },

    /**
     * GET /api/auth0/settings/connections
     * Get social connections from Auth0
     */
    getConnections: async (_req: Request, res: Response) => {
      try {
        const connections = await settingsService.getSocialConnections();
        res.json({ connections });
      } catch (err) {
        console.error('Failed to get social connections:', err);
        res.status(500).json({ error: 'Failed to get social connections' });
      }
    },

    /**
     * GET /api/auth0/settings/urls
     * Get callback URLs for Auth0 setup
     */
    getUrls: async (req: Request, res: Response) => {
      try {
        const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
        const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3100';
        const baseUrl = `${protocol}://${host}`;

        res.json({
          callback_url: `${baseUrl}/auth/callback`,
          logout_url: baseUrl,
          web_origins: baseUrl,
        });
      } catch (err) {
        console.error('Failed to generate URLs:', err);
        res.status(500).json({ error: 'Failed to generate URLs' });
      }
    },
  };
}
