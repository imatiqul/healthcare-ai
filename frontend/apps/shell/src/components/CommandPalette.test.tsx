import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { CommandPalette } from './CommandPalette';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

function renderPalette(open = true) {
  const onClose = vi.fn();
  const result = render(
    <MemoryRouter>
      <CommandPalette open={open} onClose={onClose} />
    </MemoryRouter>
  );
  return { ...result, onClose };
}

describe('CommandPalette', () => {
  it('renders search input when open', () => {
    renderPalette(true);
    expect(screen.getByPlaceholderText(/Search pages/i)).toBeInTheDocument();
  });

  it('does not render content when closed', () => {
    renderPalette(false);
    expect(screen.queryByPlaceholderText(/Search pages/i)).not.toBeInTheDocument();
  });

  it('filters results on query input', async () => {
    const user = userEvent.setup();
    renderPalette(true);
    const input = screen.getByPlaceholderText(/Search pages/i);
    await user.type(input, 'triag');
    await waitFor(() => {
      expect(screen.getByText(/triage/i)).toBeInTheDocument();
    });
  });

  it('shows "No results" for unmatched query', async () => {
    const user = userEvent.setup();
    renderPalette(true);
    const input = screen.getByPlaceholderText(/Search pages/i);
    await user.type(input, 'xyznonexistent999');
    await waitFor(() => {
      expect(screen.getByText(/No results/i)).toBeInTheDocument();
    });
  });

  it('keyboard arrow down moves selection', async () => {
    const user = userEvent.setup();
    renderPalette(true);
    const input = screen.getByPlaceholderText(/Search pages/i);
    await user.type(input, 'dash');
    await waitFor(() => screen.getByText(/Dashboard/i));
    // Arrow down to select first result
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    // Should not throw
  });

  it('calls onClose when Escape key is pressed', async () => {
    const { onClose } = renderPalette(true);
    const input = screen.getByPlaceholderText(/Search pages/i);
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('navigates when Enter is pressed on a result', async () => {
    const user = userEvent.setup();
    const { onClose } = renderPalette(true);
    const input = screen.getByPlaceholderText(/Search pages/i);
    await user.type(input, 'dashboard');
    await waitFor(() => screen.getByText(/Dashboard/i));
    // Arrow down to first result then Enter
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockNavigate).toHaveBeenCalledWith('/');
    expect(onClose).toHaveBeenCalled();
  });

  it('renders keyboard navigation hints in footer', () => {
    renderPalette(true);
    expect(screen.getByText(/navigate/i)).toBeInTheDocument();
    expect(screen.getByText(/open/i)).toBeInTheDocument();
  });
});
