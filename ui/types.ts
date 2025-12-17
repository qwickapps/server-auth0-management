/**
 * Type definitions for Auth0 Management UI
 *
 * Copyright (c) 2025 QwickApps.com. All rights reserved.
 */

/**
 * Auth0 configuration (from GET /api/auth0/config)
 */
export interface Auth0Config {
  domain: string;
  clientId: string;
  clientSecretSet: boolean;
  callbackUrl: string;
  callbackApiKeySet: boolean;
  actionNamePrefix: string;
  metadataKey: string;
  claimsNamespace: string;
  callbackUrlSecretName?: string;
  callbackApiKeySecretName?: string;
  defaultTimeoutMs: number;
}

/**
 * Test connection result (from POST /api/auth0/config/test)
 */
export interface TestConnectionResult {
  success: boolean;
  error?: string;
}

/**
 * Auth0 action (from GET /api/auth0/actions)
 */
export interface Auth0Action {
  id: string;
  name: string;
  status: 'built' | 'deployed';
  createdAt: string;
  updatedAt: string;
}

/**
 * Actions response
 */
export interface ActionsResponse {
  actions: Auth0Action[];
}

/**
 * Deploy options for POST /api/auth0/actions/deploy
 */
export interface DeployOptions {
  skipBanCheck?: boolean;
  skipEntitlementsSync?: boolean;
  bindToTrigger?: boolean;
}

/**
 * Deploy result
 */
export interface DeployResult {
  success: boolean;
  actionId?: string;
  deployed?: boolean;
  boundToTrigger?: boolean;
  error?: string;
}

/**
 * Undeploy result
 */
export interface UndeployResult {
  success: boolean;
  error?: string;
}

/**
 * Trigger binding
 */
export interface TriggerBinding {
  id: string;
  display_name: string;
  action: {
    id: string;
    name: string;
  };
}

/**
 * Trigger bindings response
 */
export interface TriggerBindingsResponse {
  bindings: TriggerBinding[];
}

/**
 * Bind action result
 */
export interface BindResult {
  bindings: TriggerBinding[];
}

/**
 * Unbind action result
 */
export interface UnbindResult {
  bindings: TriggerBinding[];
}

/**
 * Reorder bindings result
 */
export interface ReorderResult {
  bindings: TriggerBinding[];
}

/**
 * Combined status for the widget
 */
export interface Auth0Status {
  connected: boolean;
  config: Auth0Config | null;
  deployedActionsCount: number;
  error?: string;
}
