/**
 * Connection Status Component
 *
 * Displays Auth0 connection status with test button.
 *
 * Copyright (c) 2025 QwickApps.com. All rights reserved.
 */

import { useState } from 'react';
import { Box, Card, CardContent, Button, Chip, CircularProgress } from '@mui/material';
import { Text } from '@qwickapps/react-framework';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import type { Auth0Config, TestConnectionResult } from '../types';

export interface ConnectionStatusProps {
  config: Auth0Config | null;
  connected: boolean;
  error?: string;
  onTest: () => Promise<TestConnectionResult>;
}

export function ConnectionStatus({ config, connected, error, onTest }: ConnectionStatusProps) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestConnectionResult | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await onTest();
      setTestResult(result);
    } catch (err) {
      setTestResult({
        success: false,
        error: err instanceof Error ? err.message : 'Test failed',
      });
    } finally {
      setTesting(false);
    }
  };

  if (!config) {
    return (
      <Card sx={{ bgcolor: 'var(--theme-surface)', border: '1px solid var(--theme-warning)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ErrorIcon sx={{ color: 'var(--theme-warning)' }} />
            <Box>
              <Text
                variant="subtitle1"
                fontWeight="600"
                content="Auth0 Not Configured"
                customColor="var(--theme-text-primary)"
              />
              <Text
                variant="body2"
                content="Configure Auth0 credentials to enable action management."
                customColor="var(--theme-text-secondary)"
              />
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ bgcolor: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {/* Left side - Status info */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Text
                variant="h6"
                fontWeight="600"
                content="Connection Status"
                customColor="var(--theme-text-primary)"
              />
              <Chip
                icon={connected ? <CheckCircleIcon /> : <ErrorIcon />}
                label={connected ? 'Connected' : 'Disconnected'}
                size="small"
                sx={{
                  bgcolor: connected
                    ? 'color-mix(in srgb, var(--theme-success) 20%, transparent)'
                    : 'color-mix(in srgb, var(--theme-error) 20%, transparent)',
                  color: connected ? 'var(--theme-success)' : 'var(--theme-error)',
                  '& .MuiChip-icon': {
                    color: 'inherit',
                  },
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Text
                variant="body2"
                content={`Domain: ${config.domain}`}
                customColor="var(--theme-text-secondary)"
              />
              <Text
                variant="body2"
                content={`Client ID: ${config.clientId.slice(0, 8)}...${config.clientId.slice(-4)}`}
                customColor="var(--theme-text-secondary)"
              />
              <Text
                variant="body2"
                content={`Action Prefix: ${config.actionNamePrefix}`}
                customColor="var(--theme-text-secondary)"
              />
            </Box>

            {error && (
              <Box sx={{ mt: 2 }}>
                <Text variant="body2" content={error} customColor="var(--theme-error)" />
              </Box>
            )}

            {/* Test result */}
            {testResult && (
              <Box sx={{ mt: 2 }}>
                <Chip
                  icon={testResult.success ? <CheckCircleIcon /> : <ErrorIcon />}
                  label={testResult.success ? 'Connection successful' : testResult.error}
                  size="small"
                  sx={{
                    bgcolor: testResult.success
                      ? 'color-mix(in srgb, var(--theme-success) 20%, transparent)'
                      : 'color-mix(in srgb, var(--theme-error) 20%, transparent)',
                    color: testResult.success ? 'var(--theme-success)' : 'var(--theme-error)',
                    '& .MuiChip-icon': {
                      color: 'inherit',
                    },
                  }}
                />
              </Box>
            )}
          </Box>

          {/* Right side - Test button */}
          <Button
            variant="outlined"
            onClick={handleTest}
            disabled={testing}
            startIcon={testing ? <CircularProgress size={16} /> : null}
            sx={{
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text-primary)',
              '&:hover': {
                borderColor: 'var(--theme-primary)',
                bgcolor: 'color-mix(in srgb, var(--theme-primary) 10%, transparent)',
              },
            }}
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
