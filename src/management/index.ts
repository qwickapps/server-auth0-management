/**
 * Auth0 Management module exports
 */

export { Auth0ManagementClient } from './client.js';
export { ActionsManager } from './actions.js';
export { TriggersManager } from './triggers.js';
export { getPostLoginActionCode, getPostLoginActionMetadata } from './action-templates.js';
export type { ActionMetadata, ActionTemplateConfig } from './action-templates.js';
