/**
 * Auth0 Triggers Manager
 *
 * Handles binding and unbinding actions to Auth0 triggers.
 */

import type { TriggerBinding } from '../types/index.js';
import { Auth0ManagementClient } from './client.js';

/**
 * Triggers Manager for managing Auth0 trigger bindings
 */
export class TriggersManager {
  private client: Auth0ManagementClient;

  constructor(client: Auth0ManagementClient) {
    this.client = client;
  }

  /**
   * Get post-login trigger bindings
   */
  async getPostLoginBindings(): Promise<TriggerBinding[]> {
    return this.client.getTriggerBindings('post-login');
  }

  /**
   * Bind an action to the post-login trigger
   */
  async bindToPostLogin(
    actionId: string,
    displayName?: string,
    position?: number
  ): Promise<TriggerBinding[]> {
    // Get current bindings
    const currentBindings = await this.client.getTriggerBindings('post-login');

    // Check if already bound
    if (currentBindings.some(b => b.action.id === actionId)) {
      return currentBindings;
    }

    // Build new binding
    const newBinding = {
      ref: { type: 'action_id' as const, value: actionId },
      display_name: displayName || 'QwickApps Post-Login',
    };

    // Build new bindings array
    const newBindings = currentBindings.map(b => ({
      ref: { type: 'action_id' as const, value: b.action.id },
      display_name: b.display_name || b.action.name,
    }));

    // Insert at position or append
    if (position !== undefined && position >= 0 && position <= newBindings.length) {
      newBindings.splice(position, 0, newBinding);
    } else {
      newBindings.push(newBinding);
    }

    // Update bindings
    return this.client.updateTriggerBindings('post-login', newBindings);
  }

  /**
   * Unbind an action from the post-login trigger
   */
  async unbindFromPostLogin(actionId: string): Promise<TriggerBinding[]> {
    // Get current bindings
    const currentBindings = await this.client.getTriggerBindings('post-login');

    // Filter out the action
    const newBindings = currentBindings
      .filter(b => b.action.id !== actionId)
      .map(b => ({
        ref: { type: 'action_id' as const, value: b.action.id },
        display_name: b.display_name || b.action.name,
      }));

    // If nothing changed, return current bindings
    if (newBindings.length === currentBindings.length) {
      return currentBindings;
    }

    // Update bindings
    return this.client.updateTriggerBindings('post-login', newBindings);
  }

  /**
   * Reorder post-login trigger bindings
   */
  async reorderPostLoginBindings(actionIds: string[]): Promise<TriggerBinding[]> {
    // Get current bindings to get display names
    const currentBindings = await this.client.getTriggerBindings('post-login');
    const bindingMap = new Map(currentBindings.map(b => [b.action.id, b]));

    // Build new bindings in specified order
    const newBindings = actionIds
      .filter(id => bindingMap.has(id))
      .map(id => {
        const binding = bindingMap.get(id)!;
        return {
          ref: { type: 'action_id' as const, value: id },
          display_name: binding.display_name || binding.action.name,
        };
      });

    // Update bindings
    return this.client.updateTriggerBindings('post-login', newBindings);
  }

  /**
   * Check if an action is bound to post-login
   */
  async isActionBound(actionId: string): Promise<boolean> {
    const bindings = await this.client.getTriggerBindings('post-login');
    return bindings.some(b => b.action.id === actionId);
  }
}
