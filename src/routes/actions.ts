/**
 * Actions API Routes
 *
 * Routes for managing Auth0 actions deployment.
 */

import type { Request, Response } from 'express';
import type { ActionsManager } from '../management/actions.js';
import type { TriggersManager } from '../management/triggers.js';

/**
 * Create actions route handlers
 */
export function createActionsRoutes(
  actionsManager: ActionsManager,
  triggersManager: TriggersManager
) {
  return {
    /**
     * GET /api/auth0/actions
     * List deployed QwickApps actions
     */
    async listActions(_req: Request, res: Response) {
      try {
        const actions = await actionsManager.getDeployedActions();
        res.json({ actions });
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Failed to list actions',
        });
      }
    },

    /**
     * POST /api/auth0/actions/deploy
     * Deploy the post-login action
     */
    async deployAction(req: Request, res: Response) {
      try {
        const { skipBanCheck, skipEntitlementsSync, bindToTrigger = true } = req.body || {};

        // Deploy the action
        const result = await actionsManager.deployPostLoginAction({
          skipBanCheck,
          skipEntitlementsSync,
        });

        if (!result.success) {
          res.status(500).json({ error: result.error });
          return;
        }

        // Bind to trigger if requested
        if (bindToTrigger && result.actionId) {
          try {
            await triggersManager.bindToPostLogin(result.actionId, 'QwickApps Post-Login', 0);
            result.boundToTrigger = true;
          } catch (bindError) {
            // Log but don't fail - action is deployed
            console.error('Failed to bind action to trigger:', bindError);
            result.boundToTrigger = false;
          }
        }

        res.json(result);
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Failed to deploy action',
        });
      }
    },

    /**
     * DELETE /api/auth0/actions/:actionId
     * Undeploy an action
     */
    async undeployAction(_req: Request, res: Response) {
      try {
        const result = await actionsManager.undeployPostLoginAction();

        if (!result.success) {
          res.status(500).json({ error: result.error });
          return;
        }

        res.json(result);
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Failed to undeploy action',
        });
      }
    },
  };
}
