import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Auth0ManagementClient } from '../src/management/client.js';

describe('Auth0ManagementClient', () => {
  const mockFetch = vi.fn();

  const defaultConfig = {
    domain: 'test.auth0.com',
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
  };

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create client with config', () => {
      const client = new Auth0ManagementClient(defaultConfig);
      expect(client).toBeInstanceOf(Auth0ManagementClient);
    });

    it('should use custom audience if provided', () => {
      const client = new Auth0ManagementClient({
        ...defaultConfig,
        audience: 'https://custom.api/',
      });
      expect(client.getDomain()).toBe('test.auth0.com');
    });
  });

  describe('getAccessToken', () => {
    it('should request token from Auth0', async () => {
      const client = new Auth0ManagementClient(defaultConfig);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'test-token',
          token_type: 'Bearer',
          expires_in: 86400,
        }),
      });

      const token = await client.getAccessToken();

      expect(token).toBe('test-token');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.auth0.com/oauth/token',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('client_credentials'),
        })
      );
    });

    it('should cache token', async () => {
      const client = new Auth0ManagementClient(defaultConfig);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'test-token',
          token_type: 'Bearer',
          expires_in: 86400,
        }),
      });

      await client.getAccessToken();
      await client.getAccessToken();

      // Should only call once due to caching
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should throw on auth failure', async () => {
      const client = new Auth0ManagementClient(defaultConfig);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      await expect(client.getAccessToken()).rejects.toThrow('Failed to get access token');
    });
  });

  describe('listActions', () => {
    it('should list actions', async () => {
      const client = new Auth0ManagementClient(defaultConfig);

      // Token request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'token', expires_in: 86400 }),
      });

      // Actions request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          actions: [
            { id: 'action-1', name: 'Test Action' },
          ],
        }),
      });

      const actions = await client.listActions();

      expect(actions).toHaveLength(1);
      expect(actions[0].name).toBe('Test Action');
    });
  });

  describe('createAction', () => {
    it('should create action', async () => {
      const client = new Auth0ManagementClient(defaultConfig);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'token', expires_in: 86400 }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'new-action-id',
          name: 'New Action',
        }),
      });

      const action = await client.createAction({
        name: 'New Action',
        supported_triggers: [{ id: 'post-login', version: 'v3' }],
        code: 'exports.onExecutePostLogin = async (event, api) => {};',
        runtime: 'node18',
      });

      expect(action.id).toBe('new-action-id');
      expect(mockFetch).toHaveBeenLastCalledWith(
        'https://test.auth0.com/api/v2/actions/actions',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('deployAction', () => {
    it('should deploy action', async () => {
      const client = new Auth0ManagementClient(defaultConfig);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'token', expires_in: 86400 }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'deployment-id' }),
      });

      const result = await client.deployAction('action-123');

      expect(result.id).toBe('deployment-id');
      expect(mockFetch).toHaveBeenLastCalledWith(
        'https://test.auth0.com/api/v2/actions/actions/action-123/deploy',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('deleteAction', () => {
    it('should delete action', async () => {
      const client = new Auth0ManagementClient(defaultConfig);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'token', expires_in: 86400 }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await client.deleteAction('action-123');

      expect(mockFetch).toHaveBeenLastCalledWith(
        'https://test.auth0.com/api/v2/actions/actions/action-123',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('getTriggerBindings', () => {
    it('should get trigger bindings', async () => {
      const client = new Auth0ManagementClient(defaultConfig);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'token', expires_in: 86400 }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          bindings: [
            { id: 'binding-1', action: { id: 'action-1', name: 'Action 1' } },
          ],
        }),
      });

      const bindings = await client.getTriggerBindings('post-login');

      expect(bindings).toHaveLength(1);
      expect(bindings[0].action.name).toBe('Action 1');
    });
  });

  describe('testConnection', () => {
    it('should return success on valid connection', async () => {
      const client = new Auth0ManagementClient(defaultConfig);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'token', expires_in: 86400 }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ actions: [] }),
      });

      const result = await client.testConnection();

      expect(result.success).toBe(true);
    });

    it('should return error on failed connection', async () => {
      const client = new Auth0ManagementClient(defaultConfig);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Invalid credentials',
      });

      const result = await client.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
