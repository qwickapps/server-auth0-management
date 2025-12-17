/**
 * Auth0 Management API Client
 *
 * Typed fetch wrapper for Auth0 management API endpoints.
 *
 * Copyright (c) 2025 QwickApps.com. All rights reserved.
 */

import type {
  Auth0Config,
  TestConnectionResult,
  ActionsResponse,
  DeployOptions,
  DeployResult,
  UndeployResult,
  TriggerBindingsResponse,
  BindResult,
  UnbindResult,
  ReorderResult,
} from '../types';

/**
 * API Error class
 */
export class Auth0ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'Auth0ApiError';
  }
}

/**
 * Auth0 Management API Client
 */
class Auth0ApiClient {
  private baseUrl = '';

  /**
   * Set the base URL for API calls
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * Generic fetch wrapper with error handling
   */
  private async fetch<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      let details: unknown;

      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
        details = errorData;
      } catch {
        // Ignore JSON parse errors
      }

      throw new Auth0ApiError(errorMessage, response.status, details);
    }

    return response.json();
  }

  // ==========================================================================
  // Config & Status
  // ==========================================================================

  /**
   * Get Auth0 configuration (secrets are masked)
   */
  async getConfig(): Promise<Auth0Config> {
    return this.fetch<Auth0Config>('/api/auth0/config');
  }

  /**
   * Test Auth0 connection
   */
  async testConnection(): Promise<TestConnectionResult> {
    return this.fetch<TestConnectionResult>('/api/auth0/config/test', {
      method: 'POST',
    });
  }

  // ==========================================================================
  // Actions
  // ==========================================================================

  /**
   * Get deployed actions
   */
  async getActions(): Promise<ActionsResponse> {
    return this.fetch<ActionsResponse>('/api/auth0/actions');
  }

  /**
   * Deploy the post-login action
   */
  async deployAction(options?: DeployOptions): Promise<DeployResult> {
    return this.fetch<DeployResult>('/api/auth0/actions/deploy', {
      method: 'POST',
      body: JSON.stringify(options || {}),
    });
  }

  /**
   * Undeploy the post-login action
   */
  async undeployAction(): Promise<UndeployResult> {
    // The backend route is DELETE /api/auth0/actions/:actionId
    // but the handler ignores the actionId and undeploys the post-login action
    return this.fetch<UndeployResult>('/api/auth0/actions/post-login', {
      method: 'DELETE',
    });
  }

  // ==========================================================================
  // Triggers
  // ==========================================================================

  /**
   * Get post-login trigger bindings
   */
  async getTriggerBindings(): Promise<TriggerBindingsResponse> {
    return this.fetch<TriggerBindingsResponse>('/api/auth0/triggers/post-login');
  }

  /**
   * Bind an action to post-login trigger
   */
  async bindAction(
    actionId: string,
    displayName: string,
    position?: number
  ): Promise<BindResult> {
    return this.fetch<BindResult>('/api/auth0/triggers/post-login/bind', {
      method: 'POST',
      body: JSON.stringify({ actionId, displayName, position }),
    });
  }

  /**
   * Unbind an action from post-login trigger
   */
  async unbindAction(actionId: string): Promise<UnbindResult> {
    return this.fetch<UnbindResult>(`/api/auth0/triggers/post-login/${actionId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Reorder post-login trigger bindings
   */
  async reorderBindings(actionIds: string[]): Promise<ReorderResult> {
    return this.fetch<ReorderResult>('/api/auth0/triggers/post-login/reorder', {
      method: 'PUT',
      body: JSON.stringify({ actionIds }),
    });
  }

  // ==========================================================================
  // Bundle
  // ==========================================================================

  /**
   * Get the URL for downloading the action bundle
   */
  getBundleUrl(): string {
    return `${this.baseUrl}/api/auth0/bundle/post-login/download`;
  }
}

/**
 * Singleton API client instance
 */
export const auth0Api = new Auth0ApiClient();
