import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ContextualHelpPanel } from './ContextualHelpPanel';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderPanel(open: boolean, path = '/', onClose = vi.fn()) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ContextualHelpPanel open={open} onClose={onClose} />
    </MemoryRouter>,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ContextualHelpPanel', () => {
  it('renders nothing when closed', () => {
    renderPanel(false);
    expect(screen.queryByLabelText('Help panel')).not.toBeInTheDocument();
  });

  it('renders help panel when open', () => {
    renderPanel(true);
    expect(screen.getByLabelText('Help panel')).toBeInTheDocument();
  });

  it('shows Dashboard title for / route', () => {
    renderPanel(true, '/');
    // The heading renders as "Help — Dashboard" — use role-based query
    expect(screen.getByRole('heading', { name: /Dashboard/i })).toBeInTheDocument();
  });

  it('shows Triage tips for /triage route', () => {
    renderPanel(true, '/triage');
    expect(screen.getByText(/AI Triage/)).toBeInTheDocument();
    expect(screen.getByText(/P1\/P2 cases are highlighted/i)).toBeInTheDocument();
  });

  it('shows Scheduling tips for /scheduling route', () => {
    renderPanel(true, '/scheduling');
    expect(screen.getByText(/Scheduling/)).toBeInTheDocument();
  });

  it('falls back to default help for unknown route', () => {
    renderPanel(true, '/unknown-route');
    expect(screen.getByText(/HealthQ Copilot Help/)).toBeInTheDocument();
  });

  it('prefix-matches /admin/users to /admin help', () => {
    renderPanel(true, '/admin/users');
    expect(screen.getByText(/Admin Settings/)).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    renderPanel(true, '/', onClose);
    fireEvent.click(screen.getByLabelText('Close help panel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows numbered tips list', () => {
    renderPanel(true, '/');
    // Dashboard has 5 tips — numbered 1–5
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows keyboard shortcut section when defined', () => {
    renderPanel(true, '/');
    expect(screen.getByText(/KEYBOARD SHORTCUT/i)).toBeInTheDocument();
    // The shortcut section has "Ctrl+K — Command palette" as its own text node
    expect(screen.getByText('Ctrl+K — Command palette')).toBeInTheDocument();
  });
});
