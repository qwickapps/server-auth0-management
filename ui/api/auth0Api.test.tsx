/**
 * Auth0 API Client Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { auth0Api, Auth0ApiError } from './auth0Api';

describe('Auth0ApiClient', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    auth0Api.setBaseUrl('http://localhost:3000');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe('setBaseUrl', () => {
    it('should set the base URL', () => {
      auth0Api.setBaseUrl('http://test.example.com');
      expect(auth0Api.getBundleUrl()).toBe('http://test.example.com/api/auth0/bundle/post-login/download');
    });
  });

  describe('getConfig', () => {
    it('should fetch config', async () => {
      const mockConfig = {
        domain: 'test.auth0.com',
        clientId: 'test-client',
        clientSecretSet: true,
        callbackUrl: 'http://callback.test',
        callbackApiKeySet: true,
        actionNamePrefix: 'TestApp',
        metadataKey: 'app_metadata',
        claimsNamespace: 'https://test.com',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfig,
      });

      const config = await auth0Api.getConfig();

      expect(config).toEqual(mockConfig);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth0/config',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should throw Auth0ApiError on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      });

      try {
        await auth0Api.getConfig();
        expect.fail('Expected Auth0ApiError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Auth0ApiError);
        expect((error as Auth0ApiError).status).toBe(500);
      }
    });
  });

  describe('testConnection', () => {
    it('should test connection successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await auth0Api.testConnection();

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth0/config/test',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('getActions', () => {
    it('should fetch actions list', async () => {
      const mockActions = {
        actions: [
          { id: 'action-1', name: 'Test Action', status: 'built' },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockActions,
      });

      const result = await auth0Api.getActions();

      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].name).toBe('Test Action');
    });
  });

  describe('deployAction', () => {
    it('should deploy action with options', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          actionId: 'new-action-id',
          actionName: 'TestApp Post-Login',
        }),
      });

      const result = await auth0Api.deployAction({ autoBind: true });

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth0/actions/deploy',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ autoBind: true }),
        })
      );
    });

    it('should deploy action without options', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await auth0Api.deployAction();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth0/actions/deploy',
        expect.objectContaining({
          method: 'POST',
          body: '{}',
        })
      );
    });
  });

  describe('undeployAction', () => {
    it('should undeploy action', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await auth0Api.undeployAction();

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth0/actions/post-login',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('getTriggerBindings', () => {
    it('should fetch trigger bindings', async () => {
      const mockBindings = {
        bindings: [
          {
            id: 'binding-1',
            display_name: 'Test Action',
            action: {
              id: 'action-1',
              name: 'Test Action',
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBindings,
      });

      const result = await auth0Api.getTriggerBindings();

      expect(result.bindings).toHaveLength(1);
      expect(result.bindings[0].display_name).toBe('Test Action');
    });
  });

  describe('bindAction', () => {
    it('should bind action to trigger', async () => {
      const mockResult = {
        bindings: [
          {
            id: 'binding-1',
            display_name: 'My Action',
            action: { id: 'action-1', name: 'My Action' },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      });

      const result = await auth0Api.bindAction('action-1', 'My Action', 0);

      expect(result.bindings).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth0/triggers/post-login/bind',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            actionId: 'action-1',
            displayName: 'My Action',
            position: 0,
          }),
        })
      );
    });
  });

  describe('unbindAction', () => {
    it('should unbind action from trigger', async () => {
      const mockResult = { bindings: [] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      });

      const result = await auth0Api.unbindAction('action-1');

      expect(result.bindings).toEqual([]);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth0/triggers/post-login/action-1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('reorderBindings', () => {
    it('should reorder bindings', async () => {
      const mockResult = {
        bindings: [
          { id: 'b2', display_name: 'Action 2', action: { id: 'action-2', name: 'Action 2' } },
          { id: 'b1', display_name: 'Action 1', action: { id: 'action-1', name: 'Action 1' } },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      });

      const result = await auth0Api.reorderBindings(['action-2', 'action-1']);

      expect(result.bindings).toHaveLength(2);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth0/triggers/post-login/reorder',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ actionIds: ['action-2', 'action-1'] }),
        })
      );
    });
  });

  describe('getBundleUrl', () => {
    it('should return bundle download URL', () => {
      auth0Api.setBaseUrl('http://api.example.com');
      expect(auth0Api.getBundleUrl()).toBe(
        'http://api.example.com/api/auth0/bundle/post-login/download'
      );
    });
  });
});
