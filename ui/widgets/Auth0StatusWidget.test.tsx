/**
 * Auth0 Status Widget Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Auth0StatusWidget } from './Auth0StatusWidget';
import { auth0Api } from '../api/auth0Api';

// Mock the auth0Api
vi.mock('../api/auth0Api', () => ({
  auth0Api: {
    getConfig: vi.fn(),
    getActions: vi.fn(),
  },
}));

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to} data-testid="manage-actions-link">
      {children}
    </a>
  ),
}));

describe('Auth0StatusWidget', () => {
  const mockConfig = {
    domain: 'test.auth0.com',
    clientId: 'test-client',
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

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should show loading state initially', () => {
    vi.mocked(auth0Api.getConfig).mockImplementation(() => new Promise(() => {}));
    vi.mocked(auth0Api.getActions).mockImplementation(() => new Promise(() => {}));

    render(<Auth0StatusWidget />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should display connected status when connected', async () => {
    vi.mocked(auth0Api.getConfig).mockResolvedValue(mockConfig);
    vi.mocked(auth0Api.getActions).mockResolvedValue({
      actions: [
        { id: 'action-1', name: 'Test Action', status: 'deployed', createdAt: '', updatedAt: '' },
        { id: 'action-2', name: 'Another Action', status: 'deployed', createdAt: '', updatedAt: '' },
      ],
    });

    render(<Auth0StatusWidget />);

    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });
  });

  it('should display deployed count', async () => {
    vi.mocked(auth0Api.getConfig).mockResolvedValue(mockConfig);
    vi.mocked(auth0Api.getActions).mockResolvedValue({
      actions: [
        { id: 'action-1', name: 'Test Action', status: 'deployed', createdAt: '', updatedAt: '' },
        { id: 'action-2', name: 'Another Action', status: 'deployed', createdAt: '', updatedAt: '' },
      ],
    });

    render(<Auth0StatusWidget />);

    await waitFor(() => {
      expect(screen.getByText('2 deployed')).toBeInTheDocument();
    });
  });

  it('should display disconnected status on error', async () => {
    vi.mocked(auth0Api.getConfig).mockRejectedValue(new Error('Connection failed'));
    vi.mocked(auth0Api.getActions).mockRejectedValue(new Error('Connection failed'));

    render(<Auth0StatusWidget />);

    await waitFor(() => {
      expect(screen.getByText('Disconnected')).toBeInTheDocument();
    });

    expect(screen.getByText('Connection failed')).toBeInTheDocument();
  });

  it('should display zero deployed when no actions', async () => {
    vi.mocked(auth0Api.getConfig).mockResolvedValue(mockConfig);
    vi.mocked(auth0Api.getActions).mockResolvedValue({
      actions: [],
    });

    render(<Auth0StatusWidget />);

    await waitFor(() => {
      expect(screen.getByText('0 deployed')).toBeInTheDocument();
    });
  });

  it('should refresh data when refresh button clicked', async () => {
    vi.mocked(auth0Api.getConfig).mockResolvedValue(mockConfig);
    vi.mocked(auth0Api.getActions).mockResolvedValue({
      actions: [{ id: 'action-1', name: 'Test Action', status: 'deployed', createdAt: '', updatedAt: '' }],
    });

    render(<Auth0StatusWidget />);

    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    // Click refresh button
    const refreshButton = screen.getByLabelText(/refresh/i);
    fireEvent.click(refreshButton);

    // Should call APIs again
    await waitFor(() => {
      expect(auth0Api.getConfig).toHaveBeenCalledTimes(2);
      expect(auth0Api.getActions).toHaveBeenCalledTimes(2);
    });
  });

  it('should link to Auth0 Actions page', async () => {
    vi.mocked(auth0Api.getConfig).mockResolvedValue(mockConfig);
    vi.mocked(auth0Api.getActions).mockResolvedValue({
      actions: [],
    });

    render(<Auth0StatusWidget />);

    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    const link = screen.getByTestId('manage-actions-link');
    expect(link).toHaveAttribute('href', '/auth0/actions');
  });

  it('should count only deployed actions', async () => {
    vi.mocked(auth0Api.getConfig).mockResolvedValue(mockConfig);
    vi.mocked(auth0Api.getActions).mockResolvedValue({
      actions: [
        { id: 'action-1', name: 'Test Action', status: 'deployed', createdAt: '', updatedAt: '' },
        { id: 'action-2', name: 'Built Action', status: 'built', createdAt: '', updatedAt: '' },
      ],
    });

    render(<Auth0StatusWidget />);

    await waitFor(() => {
      // Only 1 deployed action, not 2
      expect(screen.getByText('1 deployed')).toBeInTheDocument();
    });
  });
});
