/**
 * Trigger Bindings Component
 *
 * Displays and manages Auth0 post-login trigger bindings.
 *
 * Copyright (c) 2025 QwickApps.com. All rights reserved.
 */

import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import { Text } from '@qwickapps/react-framework';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import type { TriggerBinding, UnbindResult, ReorderResult } from '../types';

export interface TriggerBindingsProps {
  bindings: TriggerBinding[];
  onUnbind: (actionId: string) => Promise<UnbindResult>;
  onReorder: (actionIds: string[]) => Promise<ReorderResult>;
  onRefresh: () => void;
}

export function TriggerBindings({
  bindings,
  onUnbind,
  onReorder,
  onRefresh,
}: TriggerBindingsProps) {
  const [unbinding, setUnbinding] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUnbind = async (actionId: string) => {
    setUnbinding(actionId);
    setError(null);
    try {
      await onUnbind(actionId);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbind failed');
    } finally {
      setUnbinding(null);
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    setReordering(true);
    setError(null);

    const newOrder = [...bindings];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    const actionIds = newOrder.map((b) => b.action.id);

    try {
      await onReorder(actionIds);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reorder failed');
    } finally {
      setReordering(false);
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === bindings.length - 1) return;
    setReordering(true);
    setError(null);

    const newOrder = [...bindings];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    const actionIds = newOrder.map((b) => b.action.id);

    try {
      await onReorder(actionIds);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reorder failed');
    } finally {
      setReordering(false);
    }
  };

  return (
    <Card sx={{ bgcolor: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}>
      <CardContent>
        <Text
          variant="h6"
          fontWeight="600"
          content="Trigger Bindings (post-login)"
          customColor="var(--theme-text-primary)"
        />

        <Text
          variant="body2"
          content="Actions execute in order from top to bottom."
          customColor="var(--theme-text-secondary)"
        />

        {error && (
          <Box sx={{ mt: 2 }}>
            <Text variant="body2" content={error} customColor="var(--theme-error)" />
          </Box>
        )}

        {bindings.length === 0 ? (
          <Box sx={{ mt: 2, py: 3, textAlign: 'center' }}>
            <Text
              variant="body2"
              content="No actions bound to post-login trigger."
              customColor="var(--theme-text-secondary)"
            />
          </Box>
        ) : (
          <List sx={{ mt: 1 }}>
            {bindings.map((binding, index) => (
              <ListItem
                key={binding.id}
                sx={{
                  bgcolor: 'var(--theme-background)',
                  borderRadius: 1,
                  mb: 1,
                  border: '1px solid var(--theme-border)',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    bgcolor: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)',
                    color: 'var(--theme-primary)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    mr: 2,
                  }}
                >
                  {index + 1}
                </Box>
                <ListItemText
                  primary={
                    <Text
                      variant="body1"
                      fontWeight="500"
                      content={binding.display_name}
                      customColor="var(--theme-text-primary)"
                    />
                  }
                  secondary={
                    <Text
                      variant="caption"
                      content={`ID: ${binding.action.id}`}
                      customColor="var(--theme-text-secondary)"
                    />
                  }
                  primaryTypographyProps={{ component: 'div' }}
                  secondaryTypographyProps={{ component: 'div' }}
                />
                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Move up">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0 || reordering}
                          sx={{ color: 'var(--theme-text-secondary)' }}
                        >
                          {reordering ? (
                            <CircularProgress size={16} />
                          ) : (
                            <ArrowUpwardIcon fontSize="small" />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Move down">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === bindings.length - 1 || reordering}
                          sx={{ color: 'var(--theme-text-secondary)' }}
                        >
                          {reordering ? (
                            <CircularProgress size={16} />
                          ) : (
                            <ArrowDownwardIcon fontSize="small" />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Unbind">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => handleUnbind(binding.action.id)}
                          disabled={unbinding === binding.action.id}
                          sx={{ color: 'var(--theme-error)' }}
                        >
                          {unbinding === binding.action.id ? (
                            <CircularProgress size={16} />
                          ) : (
                            <LinkOffIcon fontSize="small" />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
