/**
 * Triggers API Routes
 *
 * Routes for managing Auth0 trigger bindings.
 */

import type { Request, Response } from 'express';
import type { TriggersManager } from '../management/triggers.js';

/**
 * Create triggers route handlers
 */
export function createTriggersRoutes(triggersManager: TriggersManager) {
  return {
    /**
     * GET /api/auth0/triggers/post-login
     * List post-login trigger bindings
     */
    async listPostLoginBindings(_req: Request, res: Response) {
      try {
        const bindings = await triggersManager.getPostLoginBindings();
        res.json({ bindings });
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Failed to list bindings',
        });
      }
    },

    /**
     * POST /api/auth0/triggers/post-login/bind
     * Bind an action to post-login trigger
     */
    async bindAction(req: Request, res: Response) {
      try {
        const { actionId, displayName, position } = req.body;

        if (!actionId) {
          res.status(400).json({ error: 'actionId is required' });
          return;
        }

        const bindings = await triggersManager.bindToPostLogin(
          actionId,
          displayName,
          position
        );

        res.json({ bindings });
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Failed to bind action',
        });
      }
    },

    /**
     * DELETE /api/auth0/triggers/post-login/:actionId
     * Unbind an action from post-login trigger
     */
    async unbindAction(req: Request, res: Response) {
      try {
        const { actionId } = req.params;

        if (!actionId) {
          res.status(400).json({ error: 'actionId is required' });
          return;
        }

        const bindings = await triggersManager.unbindFromPostLogin(actionId);
        res.json({ bindings });
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Failed to unbind action',
        });
      }
    },

    /**
     * PUT /api/auth0/triggers/post-login/reorder
     * Reorder post-login trigger bindings
     */
    async reorderBindings(req: Request, res: Response) {
      try {
        const { actionIds } = req.body;

        if (!Array.isArray(actionIds)) {
          res.status(400).json({ error: 'actionIds array is required' });
          return;
        }

        const bindings = await triggersManager.reorderPostLoginBindings(actionIds);
        res.json({ bindings });
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Failed to reorder bindings',
        });
      }
    },
  };
}
