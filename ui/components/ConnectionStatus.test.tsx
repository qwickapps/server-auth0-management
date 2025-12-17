/**
 * ConnectionStatus Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConnectionStatus } from './ConnectionStatus';
import type { Auth0Config, TestConnectionResult } from '../types';

describe('ConnectionStatus', () => {
  const mockConfig: Auth0Config = {
    domain: 'test.auth0.com',
    clientId: 'test-client-id-12345',
    clientSecretSet: true,
    callbackUrl: 'http://callback.test',
    callbackApiKeySet: true,
    actionNamePrefix: 'TestApp',
    metadataKey: 'app_metadata',
    claimsNamespace: 'https://test.com',
    defaultTimeoutMs: 5000,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display connected status when connected', () => {
    render(
      <ConnectionStatus
        config={mockConfig}
        connected={true}
        onTest={vi.fn()}
      />
    );

    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('should display disconnected status when not connected', () => {
    render(
      <ConnectionStatus
        config={mockConfig}
        connected={false}
        error="Connection failed"
        onTest={vi.fn()}
      />
    );

    expect(screen.getByText('Disconnected')).toBeInTheDocument();
    expect(screen.getByText('Connection failed')).toBeInTheDocument();
  });

  it('should display domain', () => {
    render(
      <ConnectionStatus
        config={mockConfig}
        connected={true}
        onTest={vi.fn()}
      />
    );

    expect(screen.getByText(/domain: test\.auth0\.com/i)).toBeInTheDocument();
  });

  it('should display action prefix', () => {
    render(
      <ConnectionStatus
        config={mockConfig}
        connected={true}
        onTest={vi.fn()}
      />
    );

    expect(screen.getByText(/action prefix: testapp/i)).toBeInTheDocument();
  });

  it('should show masked client ID', () => {
    render(
      <ConnectionStatus
        config={mockConfig}
        connected={true}
        onTest={vi.fn()}
      />
    );

    // Should show partial client ID (first 8 chars...last 4 chars)
    expect(screen.getByText(/client id: test-cli\.\.\.2345/i)).toBeInTheDocument();
  });

  it('should show Test Connection button', () => {
    render(
      <ConnectionStatus
        config={mockConfig}
        connected={true}
        onTest={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /test connection/i })).toBeInTheDocument();
  });

  it('should call onTest when Test Connection clicked', async () => {
    const mockOnTest = vi.fn().mockResolvedValue({ success: true } as TestConnectionResult);

    render(
      <ConnectionStatus
        config={mockConfig}
        connected={true}
        onTest={mockOnTest}
      />
    );

    const button = screen.getByRole('button', { name: /test connection/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockOnTest).toHaveBeenCalledTimes(1);
    });
  });

  it('should show success message after successful test', async () => {
    const mockOnTest = vi.fn().mockResolvedValue({ success: true } as TestConnectionResult);

    render(
      <ConnectionStatus
        config={mockConfig}
        connected={true}
        onTest={mockOnTest}
      />
    );

    const button = screen.getByRole('button', { name: /test connection/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/connection successful/i)).toBeInTheDocument();
    });
  });

  it('should show error message after failed test', async () => {
    const mockOnTest = vi.fn().mockResolvedValue({
      success: false,
      error: 'Invalid credentials',
    } as TestConnectionResult);

    render(
      <ConnectionStatus
        config={mockConfig}
        connected={true}
        onTest={mockOnTest}
      />
    );

    const button = screen.getByRole('button', { name: /test connection/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('should handle null config - show not configured message', () => {
    render(
      <ConnectionStatus
        config={null}
        connected={false}
        onTest={vi.fn()}
      />
    );

    expect(screen.getByText('Auth0 Not Configured')).toBeInTheDocument();
  });

  it('should show Testing... state while testing', async () => {
    const mockOnTest = vi.fn().mockImplementation(() => new Promise(() => {}));

    render(
      <ConnectionStatus
        config={mockConfig}
        connected={true}
        onTest={mockOnTest}
      />
    );

    const button = screen.getByRole('button', { name: /test connection/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /testing/i })).toBeInTheDocument();
    });
  });
});
