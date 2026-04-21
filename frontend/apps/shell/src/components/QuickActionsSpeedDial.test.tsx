import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ── Design-system mock (required to avoid @mui/lab/Timeline resolution error) ─

vi.mock('@healthcare/design-system', () => ({
  Card:        ({ children, ...p }: any) => <div data-testid="card" {...p}>{children}</div>,
  CardHeader:  ({ children }: any) => <div>{children}</div>,
  CardTitle:   ({ children }: any) => <span>{children}</span>,
  CardContent: ({ children, ...p }: any) => <div {...p}>{children}</div>,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import { QuickActionsSpeedDial } from './QuickActionsSpeedDial';

function renderDial() {
  return render(
    <MemoryRouter>
      <QuickActionsSpeedDial />
    </MemoryRouter>
  );
}

beforeEach(() => {
  mockNavigate.mockClear();
});

describe('QuickActionsSpeedDial', () => {
  it('renders the speed dial button', () => {
    renderDial();
    expect(screen.getByRole('button', { name: /quick actions speed dial/i })).toBeInTheDocument();
  });

  it('opens the speed dial and shows Review Triage Queue action', async () => {
    const user = userEvent.setup();
    renderDial();
    await user.click(screen.getByRole('button', { name: /quick actions speed dial/i }));
    expect(screen.getByRole('menuitem', { name: /review triage queue/i })).toBeInTheDocument();
  });

  it('shows all 6 action labels when open', async () => {
    const user = userEvent.setup();
    renderDial();
    await user.click(screen.getByRole('button', { name: /quick actions speed dial/i }));
    expect(screen.getByRole('menuitem', { name: /book appointment/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /drug interactions/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /population health/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /notification center/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /patient portal/i })).toBeInTheDocument();
  });

  it('navigates to /triage when Review Triage Queue is clicked', async () => {
    const user = userEvent.setup();
    renderDial();
    await user.click(screen.getByRole('button', { name: /quick actions speed dial/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /review triage queue/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/triage');
  });

  it('navigates to /scheduling when Book Appointment is clicked', async () => {
    const user = userEvent.setup();
    renderDial();
    await user.click(screen.getByRole('button', { name: /quick actions speed dial/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /book appointment/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/scheduling');
  });

  it('navigates to /notifications when Notification Center is clicked', async () => {
    const user = userEvent.setup();
    renderDial();
    await user.click(screen.getByRole('button', { name: /quick actions speed dial/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /notification center/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/notifications');
  });
});
