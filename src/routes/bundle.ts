/**
 * Bundle API Routes
 *
 * Routes for downloading action bundles for manual deployment.
 */

import type { Request, Response } from 'express';
import type { ActionsManager } from '../management/actions.js';

/**
 * Create bundle route handlers
 */
export function createBundleRoutes(actionsManager: ActionsManager) {
  return {
    /**
     * GET /api/auth0/bundle/post-login
     * Download post-login action bundle
     */
    async getPostLoginBundle(_req: Request, res: Response) {
      try {
        const bundle = await actionsManager.getActionBundle('post-login');
        res.json(bundle);
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Failed to get bundle',
        });
      }
    },

    /**
     * GET /api/auth0/bundle/post-login/download
     * Download post-login action as JavaScript file
     */
    async downloadPostLoginBundle(_req: Request, res: Response) {
      try {
        const bundle = await actionsManager.getActionBundle('post-login');

        res.setHeader('Content-Type', 'application/javascript');
        res.setHeader('Content-Disposition', `attachment; filename="${bundle.filename}"`);
        res.send(bundle.code);
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Failed to download bundle',
        });
      }
    },
  };
}
