import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActionsManager } from '../src/management/actions.js';
import { Auth0ManagementClient } from '../src/management/client.js';
import type { Auth0ManagementConfig } from '../src/types/index.js';

describe('ActionsManager', () => {
  const mockClient = {
    listActions: vi.fn(),
    createAction: vi.fn(),
    updateAction: vi.fn(),
    deleteAction: vi.fn(),
    deployAction: vi.fn(),
    getTriggerBindings: vi.fn(),
    updateTriggerBindings: vi.fn(),
  } as unknown as Auth0ManagementClient;

  const config: Auth0ManagementConfig = {
    domain: 'test.auth0.com',
    clientId: 'client-id',
    clientSecret: 'client-secret',
    // Callback configuration
    callbackUrl: 'https://api.example.com',
    callbackApiKey: 'api-key',
    // Required naming configuration
    actionNamePrefix: 'qwickapps-',
    metadataKey: 'qwickapps',
    claimsNamespace: 'https://qwickapps.com',
    // Optional secret names (use defaults if not specified)
    callbackUrlSecretName: 'QWICKAPPS_API_URL',
    callbackApiKeySecretName: 'QWICKAPPS_API_KEY',
    defaultTimeoutMs: 5000,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('deployPostLoginAction', () => {
    it('should create and deploy new action', async () => {
      const manager = new ActionsManager(mockClient, config);

      vi.mocked(mockClient.listActions).mockResolvedValue([]);
      vi.mocked(mockClient.createAction).mockResolvedValue({
        id: 'new-action-id',
        name: 'qwickapps-post-login',
        supported_triggers: [{ id: 'post-login', version: 'v3' }],
        code: '',
        runtime: 'node18',
      });
      vi.mocked(mockClient.deployAction).mockResolvedValue({ id: 'deploy-id' });

      const result = await manager.deployPostLoginAction();

      expect(result.success).toBe(true);
      expect(result.actionId).toBe('new-action-id');
      expect(result.deployed).toBe(true);
      expect(mockClient.createAction).toHaveBeenCalled();
      expect(mockClient.deployAction).toHaveBeenCalledWith('new-action-id');
    });

    it('should update existing action', async () => {
      const manager = new ActionsManager(mockClient, config);

      vi.mocked(mockClient.listActions).mockResolvedValue([
        {
          id: 'existing-action-id',
          name: 'qwickapps-post-login',
          supported_triggers: [{ id: 'post-login', version: 'v3' }],
          code: '',
          runtime: 'node18',
        },
      ]);
      vi.mocked(mockClient.updateAction).mockResolvedValue({
        id: 'existing-action-id',
        name: 'qwickapps-post-login',
        supported_triggers: [{ id: 'post-login', version: 'v3' }],
        code: '',
        runtime: 'node18',
      });
      vi.mocked(mockClient.deployAction).mockResolvedValue({ id: 'deploy-id' });

      const result = await manager.deployPostLoginAction();

      expect(result.success).toBe(true);
      expect(result.actionId).toBe('existing-action-id');
      expect(mockClient.updateAction).toHaveBeenCalled();
      expect(mockClient.createAction).not.toHaveBeenCalled();
    });

    it('should include skip flags in secrets', async () => {
      const manager = new ActionsManager(mockClient, config);

      vi.mocked(mockClient.listActions).mockResolvedValue([]);
      vi.mocked(mockClient.createAction).mockResolvedValue({
        id: 'new-action-id',
        name: 'qwickapps-post-login',
        supported_triggers: [],
        code: '',
        runtime: 'node18',
      });
      vi.mocked(mockClient.deployAction).mockResolvedValue({ id: 'deploy-id' });

      await manager.deployPostLoginAction({
        skipBanCheck: true,
        skipEntitlementsSync: true,
      });

      expect(mockClient.createAction).toHaveBeenCalledWith(
        expect.objectContaining({
          secrets: expect.arrayContaining([
            expect.objectContaining({ name: 'SKIP_BAN_CHECK', value: 'true' }),
            expect.objectContaining({ name: 'SKIP_ENTITLEMENTS_SYNC', value: 'true' }),
          ]),
        })
      );
    });

    it('should return error on failure', async () => {
      const manager = new ActionsManager(mockClient, config);

      vi.mocked(mockClient.listActions).mockRejectedValue(new Error('API error'));

      const result = await manager.deployPostLoginAction();

      expect(result.success).toBe(false);
      expect(result.error).toBe('API error');
    });
  });

  describe('undeployPostLoginAction', () => {
    it('should remove action from trigger and delete', async () => {
      const manager = new ActionsManager(mockClient, config);

      vi.mocked(mockClient.listActions).mockResolvedValue([
        {
          id: 'action-id',
          name: 'qwickapps-post-login',
          supported_triggers: [],
          code: '',
          runtime: 'node18',
        },
      ]);
      vi.mocked(mockClient.getTriggerBindings).mockResolvedValue([
        { id: 'binding-1', trigger_id: 'post-login', action: { id: 'action-id', name: 'qwickapps-post-login' } },
        { id: 'binding-2', trigger_id: 'post-login', action: { id: 'other-action', name: 'Other' } },
      ]);
      vi.mocked(mockClient.updateTriggerBindings).mockResolvedValue([]);
      vi.mocked(mockClient.deleteAction).mockResolvedValue(undefined);

      const result = await manager.undeployPostLoginAction();

      expect(result.success).toBe(true);
      expect(mockClient.updateTriggerBindings).toHaveBeenCalled();
      expect(mockClient.deleteAction).toHaveBeenCalledWith('action-id');
    });

    it('should succeed if action does not exist', async () => {
      const manager = new ActionsManager(mockClient, config);

      vi.mocked(mockClient.listActions).mockResolvedValue([]);

      const result = await manager.undeployPostLoginAction();

      expect(result.success).toBe(true);
      expect(result.deployed).toBe(false);
    });
  });

  describe('getDeployedActions', () => {
    it('should filter to only QwickApps actions', async () => {
      const manager = new ActionsManager(mockClient, config);

      vi.mocked(mockClient.listActions).mockResolvedValue([
        { id: '1', name: 'qwickapps-post-login', supported_triggers: [], code: '', runtime: 'node18' },
        { id: '2', name: 'other-action', supported_triggers: [], code: '', runtime: 'node18' },
        { id: '3', name: 'qwickapps-other', supported_triggers: [], code: '', runtime: 'node18' },
      ]);

      const actions = await manager.getDeployedActions();

      expect(actions).toHaveLength(2);
      expect(actions.every(a => a.name.startsWith('qwickapps-'))).toBe(true);
    });
  });

  describe('getActionBundle', () => {
    it('should return bundle for post-login action', async () => {
      const manager = new ActionsManager(mockClient, config);

      const bundle = await manager.getActionBundle('post-login');

      expect(bundle.filename).toBe('qwickapps-post-login.js');
      expect(bundle.code).toContain('onExecutePostLogin');
      expect(bundle.secrets).toContainEqual(
        expect.objectContaining({ name: 'QWICKAPPS_API_URL' })
      );
      expect(bundle.instructions).toBeDefined();
    });

    it('should throw for unknown action', async () => {
      const manager = new ActionsManager(mockClient, config);

      await expect(manager.getActionBundle('unknown')).rejects.toThrow('Unknown action');
    });
  });
});
