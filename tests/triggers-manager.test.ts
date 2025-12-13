import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TriggersManager } from '../src/management/triggers.js';
import { Auth0ManagementClient } from '../src/management/client.js';

describe('TriggersManager', () => {
  const mockClient = {
    getTriggerBindings: vi.fn(),
    updateTriggerBindings: vi.fn(),
  } as unknown as Auth0ManagementClient;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPostLoginBindings', () => {
    it('should return post-login bindings', async () => {
      const manager = new TriggersManager(mockClient);

      vi.mocked(mockClient.getTriggerBindings).mockResolvedValue([
        { id: 'binding-1', trigger_id: 'post-login', action: { id: 'action-1', name: 'Action 1' } },
      ]);

      const bindings = await manager.getPostLoginBindings();

      expect(bindings).toHaveLength(1);
      expect(mockClient.getTriggerBindings).toHaveBeenCalledWith('post-login');
    });
  });

  describe('bindToPostLogin', () => {
    it('should add action to trigger', async () => {
      const manager = new TriggersManager(mockClient);

      vi.mocked(mockClient.getTriggerBindings).mockResolvedValue([]);
      vi.mocked(mockClient.updateTriggerBindings).mockResolvedValue([
        { id: 'new-binding', trigger_id: 'post-login', action: { id: 'action-1', name: 'Action 1' } },
      ]);

      const bindings = await manager.bindToPostLogin('action-1', 'Action 1');

      expect(bindings).toHaveLength(1);
      expect(mockClient.updateTriggerBindings).toHaveBeenCalledWith(
        'post-login',
        [{ ref: { type: 'action_id', value: 'action-1' }, display_name: 'Action 1' }]
      );
    });

    it('should not duplicate existing binding', async () => {
      const manager = new TriggersManager(mockClient);

      vi.mocked(mockClient.getTriggerBindings).mockResolvedValue([
        { id: 'binding-1', trigger_id: 'post-login', action: { id: 'action-1', name: 'Action 1' } },
      ]);

      const bindings = await manager.bindToPostLogin('action-1');

      expect(mockClient.updateTriggerBindings).not.toHaveBeenCalled();
      expect(bindings).toHaveLength(1);
    });

    it('should insert at specified position', async () => {
      const manager = new TriggersManager(mockClient);

      vi.mocked(mockClient.getTriggerBindings).mockResolvedValue([
        { id: 'binding-1', trigger_id: 'post-login', action: { id: 'action-1', name: 'Action 1' } },
        { id: 'binding-2', trigger_id: 'post-login', action: { id: 'action-2', name: 'Action 2' } },
      ]);
      vi.mocked(mockClient.updateTriggerBindings).mockResolvedValue([]);

      await manager.bindToPostLogin('action-3', 'Action 3', 1);

      expect(mockClient.updateTriggerBindings).toHaveBeenCalledWith(
        'post-login',
        [
          { ref: { type: 'action_id', value: 'action-1' }, display_name: 'Action 1' },
          { ref: { type: 'action_id', value: 'action-3' }, display_name: 'Action 3' },
          { ref: { type: 'action_id', value: 'action-2' }, display_name: 'Action 2' },
        ]
      );
    });
  });

  describe('unbindFromPostLogin', () => {
    it('should remove action from trigger', async () => {
      const manager = new TriggersManager(mockClient);

      vi.mocked(mockClient.getTriggerBindings).mockResolvedValue([
        { id: 'binding-1', trigger_id: 'post-login', action: { id: 'action-1', name: 'Action 1' } },
        { id: 'binding-2', trigger_id: 'post-login', action: { id: 'action-2', name: 'Action 2' } },
      ]);
      vi.mocked(mockClient.updateTriggerBindings).mockResolvedValue([
        { id: 'binding-2', trigger_id: 'post-login', action: { id: 'action-2', name: 'Action 2' } },
      ]);

      const bindings = await manager.unbindFromPostLogin('action-1');

      expect(bindings).toHaveLength(1);
      expect(mockClient.updateTriggerBindings).toHaveBeenCalledWith(
        'post-login',
        [{ ref: { type: 'action_id', value: 'action-2' }, display_name: 'Action 2' }]
      );
    });

    it('should return current bindings if action not bound', async () => {
      const manager = new TriggersManager(mockClient);

      vi.mocked(mockClient.getTriggerBindings).mockResolvedValue([
        { id: 'binding-1', trigger_id: 'post-login', action: { id: 'action-1', name: 'Action 1' } },
      ]);

      const bindings = await manager.unbindFromPostLogin('action-2');

      expect(mockClient.updateTriggerBindings).not.toHaveBeenCalled();
      expect(bindings).toHaveLength(1);
    });
  });

  describe('reorderPostLoginBindings', () => {
    it('should reorder bindings', async () => {
      const manager = new TriggersManager(mockClient);

      vi.mocked(mockClient.getTriggerBindings).mockResolvedValue([
        { id: 'binding-1', trigger_id: 'post-login', action: { id: 'action-1', name: 'Action 1' } },
        { id: 'binding-2', trigger_id: 'post-login', action: { id: 'action-2', name: 'Action 2' } },
        { id: 'binding-3', trigger_id: 'post-login', action: { id: 'action-3', name: 'Action 3' } },
      ]);
      vi.mocked(mockClient.updateTriggerBindings).mockResolvedValue([]);

      await manager.reorderPostLoginBindings(['action-3', 'action-1', 'action-2']);

      expect(mockClient.updateTriggerBindings).toHaveBeenCalledWith(
        'post-login',
        [
          { ref: { type: 'action_id', value: 'action-3' }, display_name: 'Action 3' },
          { ref: { type: 'action_id', value: 'action-1' }, display_name: 'Action 1' },
          { ref: { type: 'action_id', value: 'action-2' }, display_name: 'Action 2' },
        ]
      );
    });
  });

  describe('isActionBound', () => {
    it('should return true if action is bound', async () => {
      const manager = new TriggersManager(mockClient);

      vi.mocked(mockClient.getTriggerBindings).mockResolvedValue([
        { id: 'binding-1', trigger_id: 'post-login', action: { id: 'action-1', name: 'Action 1' } },
      ]);

      const result = await manager.isActionBound('action-1');

      expect(result).toBe(true);
    });

    it('should return false if action is not bound', async () => {
      const manager = new TriggersManager(mockClient);

      vi.mocked(mockClient.getTriggerBindings).mockResolvedValue([
        { id: 'binding-1', trigger_id: 'post-login', action: { id: 'action-1', name: 'Action 1' } },
      ]);

      const result = await manager.isActionBound('action-2');

      expect(result).toBe(false);
    });
  });
});
