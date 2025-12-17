/**
 * Auth0 Status Widget
 *
 * Dashboard widget showing Auth0 connection status and deployed actions count.
 * Refreshes on-demand only (no auto-refresh to preserve M2M token quota).
 *
 * Copyright (c) 2025 QwickApps.com. All rights reserved.
 */

import { useState, useEffect, useCallback } from 'react';
import { Box, Card, CardContent, IconButton, Tooltip, CircularProgress } from '@mui/material';
import { Text } from '@qwickapps/react-framework';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import RefreshIcon from '@mui/icons-material/Refresh';
import SecurityIcon from '@mui/icons-material/Security';
import { Link } from 'react-router-dom';
import { auth0Api } from '../api/auth0Api';
import type { Auth0Status } from '../types';

/**
 * Auth0 Status Widget Component
 */
export function Auth0StatusWidget() {
  const [status, setStatus] = useState<Auth0Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    }

    try {
      const [config, actions] = await Promise.all([
        auth0Api.getConfig(),
        auth0Api.getActions(),
      ]);

      const deployedCount = actions.actions.filter(
        (a) => a.status === 'deployed'
      ).length;

      setStatus({
        connected: true,
        config,
        deployedActionsCount: deployedCount,
      });
    } catch (error) {
      setStatus({
        connected: false,
        config: null,
        deployedActionsCount: 0,
        error: error instanceof Error ? error.message : 'Failed to connect',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleRefresh = () => {
    fetchStatus(true);
  };

  if (loading) {
    return (
      <Card sx={{ bgcolor: 'var(--theme-surface)', minHeight: 100 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 2 }}>
            <CircularProgress size={24} sx={{ color: 'var(--theme-primary)' }} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  const connected = status?.connected ?? false;
  const deployedCount = status?.deployedActionsCount ?? 0;

  return (
    <Card
      sx={{
        bgcolor: 'var(--theme-surface)',
        border: `1px solid ${connected ? 'var(--theme-border)' : 'var(--theme-error)'}`,
      }}
    >
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SecurityIcon sx={{ color: 'var(--theme-primary)', fontSize: 20 }} />
            <Text
              variant="subtitle2"
              fontWeight="600"
              content="Auth0 Actions"
              customColor="var(--theme-text-primary)"
            />
          </Box>
          <Tooltip title="Refresh status">
            <IconButton
              size="small"
              onClick={handleRefresh}
              disabled={refreshing}
              sx={{ color: 'var(--theme-text-secondary)' }}
            >
              {refreshing ? (
                <CircularProgress size={16} sx={{ color: 'var(--theme-text-secondary)' }} />
              ) : (
                <RefreshIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Status */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {connected ? (
              <CheckCircleIcon sx={{ color: 'var(--theme-success)', fontSize: 18 }} />
            ) : (
              <ErrorIcon sx={{ color: 'var(--theme-error)', fontSize: 18 }} />
            )}
            <Text
              variant="body2"
              content={connected ? 'Connected' : 'Disconnected'}
              customColor={connected ? 'var(--theme-success)' : 'var(--theme-error)'}
            />
          </Box>
          <Text
            variant="body2"
            content={`${deployedCount} deployed`}
            customColor="var(--theme-text-secondary)"
          />
        </Box>

        {/* Error message */}
        {status?.error && (
          <Text
            variant="caption"
            content={status.error}
            customColor="var(--theme-error)"
          />
        )}

        {/* Link to full page */}
        <Box sx={{ mt: 2 }}>
          <Link
            to="/auth0/actions"
            style={{
              color: 'var(--theme-primary)',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            Manage Actions &rarr;
          </Link>
        </Box>
      </CardContent>
    </Card>
  );
}
