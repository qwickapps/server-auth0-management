/**
 * Actions List Component
 *
 * Displays deployed actions with deploy/undeploy functionality.
 *
 * Copyright (c) 2025 QwickApps.com. All rights reserved.
 */

import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Link,
} from '@mui/material';
import { Text } from '@qwickapps/react-framework';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import DownloadIcon from '@mui/icons-material/Download';
import type { Auth0Action, DeployOptions, DeployResult, UndeployResult } from '../types';

export interface ActionsListProps {
  actions: Auth0Action[];
  bundleUrl: string;
  onDeploy: (options: DeployOptions) => Promise<DeployResult>;
  onUndeploy: () => Promise<UndeployResult>;
  onRefresh: () => void;
}

export function ActionsList({
  actions,
  bundleUrl,
  onDeploy,
  onUndeploy,
  onRefresh,
}: ActionsListProps) {
  const [deploying, setDeploying] = useState(false);
  const [undeploying, setUndeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Deploy options
  const [skipBanCheck, setSkipBanCheck] = useState(false);
  const [skipEntitlementsSync, setSkipEntitlementsSync] = useState(false);
  const [bindToTrigger, setBindToTrigger] = useState(true);

  const deployedAction = actions.find((a) => a.status === 'deployed');

  const handleDeploy = async () => {
    setDeploying(true);
    setError(null);
    try {
      const result = await onDeploy({
        skipBanCheck,
        skipEntitlementsSync,
        bindToTrigger,
      });
      if (!result.success) {
        setError(result.error || 'Deploy failed');
      } else {
        onRefresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deploy failed');
    } finally {
      setDeploying(false);
    }
  };

  const handleUndeploy = async () => {
    setUndeploying(true);
    setError(null);
    try {
      const result = await onUndeploy();
      if (!result.success) {
        setError(result.error || 'Undeploy failed');
      } else {
        onRefresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Undeploy failed');
    } finally {
      setUndeploying(false);
    }
  };

  return (
    <Card sx={{ bgcolor: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}>
      <CardContent>
        <Text
          variant="h6"
          fontWeight="600"
          content="Post-Login Action"
          customColor="var(--theme-text-primary)"
        />

        {deployedAction ? (
          /* Deployed state */
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Chip
                icon={<CheckCircleIcon />}
                label="Deployed"
                size="small"
                sx={{
                  bgcolor: 'color-mix(in srgb, var(--theme-success) 20%, transparent)',
                  color: 'var(--theme-success)',
                  '& .MuiChip-icon': { color: 'inherit' },
                }}
              />
              <Text
                variant="body2"
                content={`ID: ${deployedAction.id}`}
                customColor="var(--theme-text-secondary)"
              />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 3 }}>
              <Text
                variant="body2"
                content={`Name: ${deployedAction.name}`}
                customColor="var(--theme-text-secondary)"
              />
              <Text
                variant="body2"
                content={`Updated: ${new Date(deployedAction.updatedAt).toLocaleString()}`}
                customColor="var(--theme-text-secondary)"
              />
            </Box>

            {error && (
              <Box sx={{ mb: 2 }}>
                <Text variant="body2" content={error} customColor="var(--theme-error)" />
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                color="error"
                onClick={handleUndeploy}
                disabled={undeploying}
                startIcon={undeploying ? <CircularProgress size={16} /> : <CloudOffIcon />}
              >
                {undeploying ? 'Undeploying...' : 'Undeploy'}
              </Button>
              <Link href={bundleUrl} download underline="none">
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  sx={{
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text-primary)',
                  }}
                >
                  Download Bundle
                </Button>
              </Link>
            </Box>
          </Box>
        ) : (
          /* Not deployed state - show deploy form */
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Chip
                label="Not Deployed"
                size="small"
                sx={{
                  bgcolor: 'color-mix(in srgb, var(--theme-text-secondary) 20%, transparent)',
                  color: 'var(--theme-text-secondary)',
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={skipBanCheck}
                    onChange={(e) => setSkipBanCheck(e.target.checked)}
                    size="small"
                  />
                }
                label={
                  <Text
                    variant="body2"
                    content="Skip ban check"
                    customColor="var(--theme-text-primary)"
                  />
                }
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={skipEntitlementsSync}
                    onChange={(e) => setSkipEntitlementsSync(e.target.checked)}
                    size="small"
                  />
                }
                label={
                  <Text
                    variant="body2"
                    content="Skip entitlements sync"
                    customColor="var(--theme-text-primary)"
                  />
                }
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={bindToTrigger}
                    onChange={(e) => setBindToTrigger(e.target.checked)}
                    size="small"
                  />
                }
                label={
                  <Text
                    variant="body2"
                    content="Bind to post-login trigger"
                    customColor="var(--theme-text-primary)"
                  />
                }
              />
            </Box>

            {error && (
              <Box sx={{ mb: 2 }}>
                <Text variant="body2" content={error} customColor="var(--theme-error)" />
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleDeploy}
                disabled={deploying}
                startIcon={deploying ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                sx={{
                  bgcolor: 'var(--theme-primary)',
                  '&:hover': { bgcolor: 'var(--theme-primary-dark)' },
                }}
              >
                {deploying ? 'Deploying...' : 'Deploy Action'}
              </Button>
              <Link href={bundleUrl} download underline="none">
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  sx={{
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text-primary)',
                  }}
                >
                  Download Bundle
                </Button>
              </Link>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
