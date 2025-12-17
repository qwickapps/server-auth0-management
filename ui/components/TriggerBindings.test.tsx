/**
 * TriggerBindings Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TriggerBindings } from './TriggerBindings';
import type { TriggerBinding, UnbindResult, ReorderResult } from '../types';

describe('TriggerBindings', () => {
  const mockBindings: TriggerBinding[] = [
    {
      id: 'binding-1',
      display_name: 'First Action',
      action: { id: 'action-1', name: 'First Action' },
    },
    {
      id: 'binding-2',
      display_name: 'Second Action',
      action: { id: 'action-2', name: 'Second Action' },
    },
    {
      id: 'binding-3',
      display_name: 'Third Action',
      action: { id: 'action-3', name: 'Third Action' },
    },
  ];

  const defaultProps = {
    bindings: mockBindings,
    onUnbind: vi.fn(),
    onReorder: vi.fn(),
    onRefresh: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render bindings list', () => {
    render(<TriggerBindings {...defaultProps} />);

    expect(screen.getByText('First Action')).toBeInTheDocument();
    expect(screen.getByText('Second Action')).toBeInTheDocument();
    expect(screen.getByText('Third Action')).toBeInTheDocument();
  });

  it('should display bindings in order', () => {
    render(<TriggerBindings {...defaultProps} />);

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('First Action');
    expect(items[1]).toHaveTextContent('Second Action');
    expect(items[2]).toHaveTextContent('Third Action');
  });

  it('should show empty state when no bindings', () => {
    render(<TriggerBindings {...defaultProps} bindings={[]} />);

    expect(screen.getByText(/no actions bound to post-login trigger/i)).toBeInTheDocument();
  });

  it('should show position numbers', () => {
    render(<TriggerBindings {...defaultProps} />);

    // Position numbers are displayed in the component
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
  });

  it('should show Unbind button for each binding', () => {
    render(<TriggerBindings {...defaultProps} />);

    // Unbind buttons have tooltip title "Unbind"
    const unbindButtons = screen.getAllByLabelText(/unbind/i);
    expect(unbindButtons).toHaveLength(mockBindings.length);
  });

  it('should call onUnbind when Unbind clicked', async () => {
    const mockOnUnbind = vi.fn().mockResolvedValue({
      bindings: [],
    } as UnbindResult);

    render(<TriggerBindings {...defaultProps} onUnbind={mockOnUnbind} />);

    const unbindButtons = screen.getAllByLabelText(/unbind/i);
    const button = unbindButtons[0].querySelector('button');
    fireEvent.click(button!);

    await waitFor(() => {
      expect(mockOnUnbind).toHaveBeenCalledWith('action-1');
    });
  });

  it('should refresh after successful unbind', async () => {
    const mockOnUnbind = vi.fn().mockResolvedValue({
      bindings: [],
    } as UnbindResult);
    const mockOnRefresh = vi.fn();

    render(
      <TriggerBindings {...defaultProps} onUnbind={mockOnUnbind} onRefresh={mockOnRefresh} />
    );

    const unbindButtons = screen.getAllByLabelText(/unbind/i);
    const button = unbindButtons[0].querySelector('button');
    fireEvent.click(button!);

    await waitFor(() => {
      expect(mockOnRefresh).toHaveBeenCalled();
    });
  });

  it('should show move up/down buttons', () => {
    render(<TriggerBindings {...defaultProps} />);

    const moveUpButtons = screen.getAllByLabelText(/move up/i);
    const moveDownButtons = screen.getAllByLabelText(/move down/i);

    expect(moveUpButtons).toHaveLength(3);
    expect(moveDownButtons).toHaveLength(3);
    // First item's up button should be disabled (check the button inside the span)
    expect(moveUpButtons[0].querySelector('button')).toBeDisabled();
    // Last item's down button should be disabled
    expect(moveDownButtons[moveDownButtons.length - 1].querySelector('button')).toBeDisabled();
  });

  it('should call onReorder when move up clicked', async () => {
    const mockOnReorder = vi.fn().mockResolvedValue({
      bindings: [],
    } as ReorderResult);

    render(<TriggerBindings {...defaultProps} onReorder={mockOnReorder} />);

    // Click move up on second item (the button inside the span)
    const moveUpButtons = screen.getAllByLabelText(/move up/i);
    const button = moveUpButtons[1].querySelector('button');
    fireEvent.click(button!); // Second item's move up button

    await waitFor(() => {
      // Should swap positions of first two items
      expect(mockOnReorder).toHaveBeenCalledWith(['action-2', 'action-1', 'action-3']);
    });
  });

  it('should call onReorder when move down clicked', async () => {
    const mockOnReorder = vi.fn().mockResolvedValue({
      bindings: [],
    } as ReorderResult);

    render(<TriggerBindings {...defaultProps} onReorder={mockOnReorder} />);

    // Click move down on first item (the button inside the span)
    const moveDownButtons = screen.getAllByLabelText(/move down/i);
    const button = moveDownButtons[0].querySelector('button');
    fireEvent.click(button!); // First item's move down button

    await waitFor(() => {
      // Should swap positions of first two items
      expect(mockOnReorder).toHaveBeenCalledWith(['action-2', 'action-1', 'action-3']);
    });
  });

  it('should show error message on unbind failure', async () => {
    const mockOnUnbind = vi.fn().mockRejectedValue(new Error('Unbind failed'));

    render(<TriggerBindings {...defaultProps} onUnbind={mockOnUnbind} />);

    const unbindButtons = screen.getAllByLabelText(/unbind/i);
    const button = unbindButtons[0].querySelector('button');
    fireEvent.click(button!);

    await waitFor(() => {
      expect(screen.getByText(/unbind failed/i)).toBeInTheDocument();
    });
  });

  it('should show error message on reorder failure', async () => {
    const mockOnReorder = vi.fn().mockRejectedValue(new Error('Reorder failed'));

    render(<TriggerBindings {...defaultProps} onReorder={mockOnReorder} />);

    const moveDownButtons = screen.getAllByLabelText(/move down/i);
    const button = moveDownButtons[0].querySelector('button');
    fireEvent.click(button!);

    await waitFor(() => {
      expect(screen.getByText(/reorder failed/i)).toBeInTheDocument();
    });
  });

  it('should display trigger info header', () => {
    render(<TriggerBindings {...defaultProps} />);

    expect(screen.getByText(/post-login/i)).toBeInTheDocument();
  });

  it('should show single binding with disabled move buttons', () => {
    render(
      <TriggerBindings
        {...defaultProps}
        bindings={[mockBindings[0]]}
      />
    );

    // With only one binding, move buttons should be disabled
    const moveUpButtons = screen.getAllByLabelText(/move up/i);
    const moveDownButtons = screen.getAllByLabelText(/move down/i);

    expect(moveUpButtons[0].querySelector('button')).toBeDisabled();
    expect(moveDownButtons[0].querySelector('button')).toBeDisabled();
  });
});
