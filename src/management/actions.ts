/**
 * Auth0 Actions Manager
 *
 * Handles deploying, updating, and managing Auth0 actions.
 */

import type {
  Auth0ManagementPluginConfig,
  Auth0Action,
  DeployResult,
  ActionBundle,
} from '../types/index.js';
import { Auth0ManagementClient } from './client.js';
import {
  getPostLoginActionCode,
  getPostLoginActionMetadata,
  type ActionTemplateConfig,
} from './action-templates.js';

const POST_LOGIN_TRIGGER = {
  id: 'post-login',
  version: 'v3',
};

/**
 * Default secret names (can be overridden via config)
 */
const DEFAULT_CALLBACK_URL_SECRET_NAME = 'API_URL';
const DEFAULT_CALLBACK_API_KEY_SECRET_NAME = 'API_KEY';

/**
 * Actions Manager for deploying and managing Auth0 actions
 */
export class ActionsManager {
  private client: Auth0ManagementClient;
  private config: Auth0ManagementPluginConfig;
  private templateConfig: ActionTemplateConfig;

  constructor(client: Auth0ManagementClient, config: Auth0ManagementPluginConfig) {
    this.client = client;
    this.config = config;

    // Build template config from plugin config
    this.templateConfig = {
      actionNamePrefix: config.actionNamePrefix,
      metadataKey: config.metadataKey,
      claimsNamespace: config.claimsNamespace,
      callbackUrlSecretName: config.callbackUrlSecretName || DEFAULT_CALLBACK_URL_SECRET_NAME,
      callbackApiKeySecretName: config.callbackApiKeySecretName || DEFAULT_CALLBACK_API_KEY_SECRET_NAME,
    };
  }

  /**
   * Deploy the post-login action
   */
  async deployPostLoginAction(options?: {
    skipBanCheck?: boolean;
    skipEntitlementsSync?: boolean;
  }): Promise<DeployResult> {
    try {
      // Get action code and metadata using template config
      const code = getPostLoginActionCode(this.templateConfig);
      const metadata = getPostLoginActionMetadata(this.templateConfig);

      // Build secrets array with configurable names
      const secrets = [
        { name: this.templateConfig.callbackUrlSecretName, value: this.config.callbackUrl },
        { name: this.templateConfig.callbackApiKeySecretName, value: this.config.callbackApiKey },
        { name: 'TIMEOUT_MS', value: String(this.config.defaultTimeoutMs || 5000) },
      ];

      if (options?.skipBanCheck) {
        secrets.push({ name: 'SKIP_BAN_CHECK', value: 'true' });
      }

      if (options?.skipEntitlementsSync) {
        secrets.push({ name: 'SKIP_ENTITLEMENTS_SYNC', value: 'true' });
      }

      // Check if action already exists
      const existingActions = await this.client.listActions();
      const existingAction = existingActions.find(a => a.name === metadata.name);

      let action: Auth0Action;

      if (existingAction) {
        // Update existing action
        action = await this.client.updateAction(existingAction.id, {
          code,
          secrets,
          runtime: 'node18',
        });
      } else {
        // Create new action
        action = await this.client.createAction({
          name: metadata.name,
          supported_triggers: [POST_LOGIN_TRIGGER],
          code,
          runtime: 'node18',
          secrets,
        });
      }

      // Deploy the action
      await this.client.deployAction(action.id);

      return {
        success: true,
        actionId: action.id,
        deployed: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Undeploy (delete) the post-login action
   */
  async undeployPostLoginAction(): Promise<DeployResult> {
    try {
      const metadata = getPostLoginActionMetadata(this.templateConfig);

      // Find the action
      const existingActions = await this.client.listActions();
      const existingAction = existingActions.find(a => a.name === metadata.name);

      if (!existingAction) {
        return {
          success: true,
          deployed: false,
        };
      }

      // Remove from trigger bindings first
      const bindings = await this.client.getTriggerBindings('post-login');
      const filteredBindings = bindings
        .filter(b => b.action.id !== existingAction.id)
        .map(b => ({
          ref: { type: 'action_id' as const, value: b.action.id },
          display_name: b.display_name || b.action.name,
        }));

      if (filteredBindings.length !== bindings.length) {
        await this.client.updateTriggerBindings('post-login', filteredBindings);
      }

      // Delete the action
      await this.client.deleteAction(existingAction.id);

      return {
        success: true,
        actionId: existingAction.id,
        deployed: false,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get deployed actions
   */
  async getDeployedActions(): Promise<Auth0Action[]> {
    const actions = await this.client.listActions();
    // Filter to only actions with our configured prefix
    return actions.filter(a => a.name.startsWith(this.templateConfig.actionNamePrefix));
  }

  /**
   * Get action bundle for manual deployment
   */
  async getActionBundle(actionName: string = 'post-login'): Promise<ActionBundle> {
    if (actionName !== 'post-login') {
      throw new Error(`Unknown action: ${actionName}`);
    }

    const code = getPostLoginActionCode(this.templateConfig);
    const metadata = getPostLoginActionMetadata(this.templateConfig);

    return {
      filename: `${metadata.name}.js`,
      code,
      secrets: metadata.secrets.map(s => ({
        name: s.name,
        description: s.description,
        required: s.required,
        default: s.default,
      })),
      instructions: `
## Manual Deployment Instructions

1. Go to Auth0 Dashboard → Actions → Library → Build Custom

2. Click "Build from scratch"

3. Set the following:
   - Name: ${metadata.displayName}
   - Trigger: ${metadata.trigger}
   - Runtime: ${metadata.runtime}

4. Replace the code with the contents of ${metadata.name}.js

5. Add the following secrets in the "Secrets" tab:
${metadata.secrets.map(s => `   - ${s.name}: ${s.description}${s.required ? ' (required)' : ''}`).join('\n')}

6. Click "Deploy"

7. Go to Actions → Flows → Login → Add the action to the flow
`.trim(),
    };
  }
}
