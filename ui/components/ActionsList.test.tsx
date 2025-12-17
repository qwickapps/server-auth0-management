/**
 * ActionsList Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ActionsList } from './ActionsList';
import type { Auth0Action, DeployResult, UndeployResult } from '../types';

describe('ActionsList', () => {
  const deployedAction: Auth0Action = {
    id: 'action-1',
    name: 'TestApp Post-Login',
    status: 'deployed',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const defaultProps = {
    actions: [] as Auth0Action[],
    bundleUrl: 'http://localhost:3000/api/auth0/bundle/post-login/download',
    onDeploy: vi.fn(),
    onUndeploy: vi.fn(),
    onRefresh: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when no action is deployed', () => {
    it('should show Not Deployed status', () => {
      render(<ActionsList {...defaultProps} />);

      expect(screen.getByText('Not Deployed')).toBeInTheDocument();
    });

    it('should show Deploy button', () => {
      render(<ActionsList {...defaultProps} />);

      expect(screen.getByRole('button', { name: /deploy action/i })).toBeInTheDocument();
    });

    it('should show deploy options checkboxes', () => {
      render(<ActionsList {...defaultProps} />);

      expect(screen.getByLabelText(/skip ban check/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/skip entitlements sync/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/bind to post-login trigger/i)).toBeInTheDocument();
    });

    it('should call onDeploy with options when Deploy clicked', async () => {
      const mockOnDeploy = vi.fn().mockResolvedValue({
        success: true,
        actionId: 'new-action',
      } as DeployResult);

      render(<ActionsList {...defaultProps} onDeploy={mockOnDeploy} />);

      const deployButton = screen.getByRole('button', { name: /deploy action/i });
      fireEvent.click(deployButton);

      await waitFor(() => {
        expect(mockOnDeploy).toHaveBeenCalledWith({
          skipBanCheck: false,
          skipEntitlementsSync: false,
          bindToTrigger: true,
        });
      });
    });

    it('should call onDeploy with modified options', async () => {
      const mockOnDeploy = vi.fn().mockResolvedValue({
        success: true,
      } as DeployResult);

      render(<ActionsList {...defaultProps} onDeploy={mockOnDeploy} />);

      // Check the skip ban check option
      fireEvent.click(screen.getByLabelText(/skip ban check/i));

      const deployButton = screen.getByRole('button', { name: /deploy action/i });
      fireEvent.click(deployButton);

      await waitFor(() => {
        expect(mockOnDeploy).toHaveBeenCalledWith(
          expect.objectContaining({
            skipBanCheck: true,
          })
        );
      });
    });

    it('should show error message on deploy failure', async () => {
      const mockOnDeploy = vi.fn().mockRejectedValue(new Error('Deploy failed'));

      render(<ActionsList {...defaultProps} onDeploy={mockOnDeploy} />);

      const deployButton = screen.getByRole('button', { name: /deploy action/i });
      fireEvent.click(deployButton);

      await waitFor(() => {
        expect(screen.getByText(/deploy failed/i)).toBeInTheDocument();
      });
    });

    it('should show Download Bundle link', () => {
      render(<ActionsList {...defaultProps} />);

      const downloadLink = screen.getByRole('link', { name: /download bundle/i });
      expect(downloadLink).toHaveAttribute('href', defaultProps.bundleUrl);
    });
  });

  describe('when action is deployed', () => {
    const propsWithDeployedAction = {
      ...defaultProps,
      actions: [deployedAction],
    };

    it('should show Deployed status', () => {
      render(<ActionsList {...propsWithDeployedAction} />);

      expect(screen.getByText('Deployed')).toBeInTheDocument();
    });

    it('should show action details', () => {
      render(<ActionsList {...propsWithDeployedAction} />);

      expect(screen.getByText(/id: action-1/i)).toBeInTheDocument();
      expect(screen.getByText(/name: testapp post-login/i)).toBeInTheDocument();
    });

    it('should show Undeploy button', () => {
      render(<ActionsList {...propsWithDeployedAction} />);

      expect(screen.getByRole('button', { name: /undeploy/i })).toBeInTheDocument();
    });

    it('should not show Deploy button', () => {
      render(<ActionsList {...propsWithDeployedAction} />);

      expect(screen.queryByRole('button', { name: /deploy action/i })).not.toBeInTheDocument();
    });

    it('should call onUndeploy when Undeploy clicked', async () => {
      const mockOnUndeploy = vi.fn().mockResolvedValue({
        success: true,
      } as UndeployResult);

      render(<ActionsList {...propsWithDeployedAction} onUndeploy={mockOnUndeploy} />);

      const undeployButton = screen.getByRole('button', { name: /undeploy/i });
      fireEvent.click(undeployButton);

      await waitFor(() => {
        expect(mockOnUndeploy).toHaveBeenCalled();
      });
    });

    it('should refresh after successful undeploy', async () => {
      const mockOnUndeploy = vi.fn().mockResolvedValue({
        success: true,
      } as UndeployResult);
      const mockOnRefresh = vi.fn();

      render(
        <ActionsList {...propsWithDeployedAction} onUndeploy={mockOnUndeploy} onRefresh={mockOnRefresh} />
      );

      const undeployButton = screen.getByRole('button', { name: /undeploy/i });
      fireEvent.click(undeployButton);

      await waitFor(() => {
        expect(mockOnRefresh).toHaveBeenCalled();
      });
    });

    it('should show error message on undeploy failure', async () => {
      const mockOnUndeploy = vi.fn().mockRejectedValue(new Error('Undeploy failed'));

      render(<ActionsList {...propsWithDeployedAction} onUndeploy={mockOnUndeploy} />);

      const undeployButton = screen.getByRole('button', { name: /undeploy/i });
      fireEvent.click(undeployButton);

      await waitFor(() => {
        expect(screen.getByText(/undeploy failed/i)).toBeInTheDocument();
      });
    });

    it('should show Download Bundle link', () => {
      render(<ActionsList {...propsWithDeployedAction} />);

      const downloadLink = screen.getByRole('link', { name: /download bundle/i });
      expect(downloadLink).toHaveAttribute('href', defaultProps.bundleUrl);
    });
  });
});
