/**
 * Auth0 Actions Page
 *
 * Full-page management UI for Auth0 actions and trigger bindings.
 *
 * Copyright (c) 2025 QwickApps.com. All rights reserved.
 */

import { useState, useEffect, useCallback } from 'react';
import { Box, CircularProgress, IconButton, Tooltip } from '@mui/material';
import { Text } from '@qwickapps/react-framework';
import RefreshIcon from '@mui/icons-material/Refresh';
import { auth0Api } from '../api/auth0Api';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { ActionsList } from '../components/ActionsList';
import { TriggerBindings } from '../components/TriggerBindings';
import type { Auth0Config, Auth0Action, TriggerBinding } from '../types';

interface PageState {
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  config: Auth0Config | null;
  connected: boolean;
  actions: Auth0Action[];
  bindings: TriggerBinding[];
}

/**
 * Auth0 Actions Page Component
 */
export function Auth0ActionsPage() {
  const [state, setState] = useState<PageState>({
    loading: true,
    refreshing: false,
    error: null,
    config: null,
    connected: false,
    actions: [],
    bindings: [],
  });

  const fetchData = useCallback(async (isRefresh = false) => {
    setState((prev) => ({
      ...prev,
      loading: !isRefresh,
      refreshing: isRefresh,
      error: null,
    }));

    try {
      const [config, actionsRes, bindingsRes] = await Promise.all([
        auth0Api.getConfig(),
        auth0Api.getActions(),
        auth0Api.getTriggerBindings(),
      ]);

      setState((prev) => ({
        ...prev,
        loading: false,
        refreshing: false,
        config,
        connected: true,
        actions: actionsRes.actions,
        bindings: bindingsRes.bindings,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        refreshing: false,
        connected: false,
        error: error instanceof Error ? error.message : 'Failed to load data',
      }));
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    fetchData(true);
  };

  const handleTestConnection = async () => {
    return auth0Api.testConnection();
  };

  const handleDeploy = async (options: Parameters<typeof auth0Api.deployAction>[0]) => {
    return auth0Api.deployAction(options);
  };

  const handleUndeploy = async () => {
    return auth0Api.undeployAction();
  };

  const handleUnbind = async (actionId: string) => {
    return auth0Api.unbindAction(actionId);
  };

  const handleReorder = async (actionIds: string[]) => {
    return auth0Api.reorderBindings(actionIds);
  };

  if (state.loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh',
        }}
      >
        <CircularProgress sx={{ color: 'var(--theme-primary)' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Text
            variant="h4"
            fontWeight="600"
            content="Auth0 Actions"
            customColor="var(--theme-text-primary)"
          />
          <Text
            variant="body1"
            content="Manage Auth0 post-login actions and trigger bindings"
            customColor="var(--theme-text-secondary)"
          />
        </Box>
        <Tooltip title="Refresh data">
          <IconButton
            onClick={handleRefresh}
            disabled={state.refreshing}
            sx={{ color: 'var(--theme-text-secondary)' }}
          >
            {state.refreshing ? (
              <CircularProgress size={24} sx={{ color: 'var(--theme-text-secondary)' }} />
            ) : (
              <RefreshIcon />
            )}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Error message */}
      {state.error && !state.config && (
        <Box
          sx={{
            p: 3,
            mb: 3,
            bgcolor: 'color-mix(in srgb, var(--theme-error) 10%, transparent)',
            border: '1px solid var(--theme-error)',
            borderRadius: 2,
          }}
        >
          <Text variant="body1" content={state.error} customColor="var(--theme-error)" />
        </Box>
      )}

      {/* Content sections */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Connection Status */}
        <ConnectionStatus
          config={state.config}
          connected={state.connected}
          error={state.error || undefined}
          onTest={handleTestConnection}
        />

        {/* Only show actions and bindings if connected */}
        {state.config && (
          <>
            {/* Actions List */}
            <ActionsList
              actions={state.actions}
              bundleUrl={auth0Api.getBundleUrl()}
              onDeploy={handleDeploy}
              onUndeploy={handleUndeploy}
              onRefresh={handleRefresh}
            />

            {/* Trigger Bindings */}
            <TriggerBindings
              bindings={state.bindings}
              onUnbind={handleUnbind}
              onReorder={handleReorder}
              onRefresh={handleRefresh}
            />
          </>
        )}
      </Box>
    </Box>
  );
}
