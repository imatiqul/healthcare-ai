import { render, screen } from '@testing-library/react';
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

import { RecentPagesWidget } from './RecentPagesWidget';

const STORAGE_KEY = 'hq:recent-pages';

function renderWidget() {
  return render(
    <MemoryRouter>
      <RecentPagesWidget />
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
  mockNavigate.mockClear();
});

describe('RecentPagesWidget', () => {
  it('renders nothing when no recent pages exist', () => {
    const { container } = renderWidget();
    expect(container.firstChild).toBeNull();
  });

  it('renders the "Recently Visited" card when pages exist', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([
      { href: '/triage', label: 'Triage', visitedAt: new Date().toISOString() },
    ]));
    renderWidget();
    expect(screen.getByText('Recently Visited')).toBeInTheDocument();
  });

  it('shows up to 6 recent pages', () => {
    const pages = Array.from({ length: 8 }, (_, i) => ({
      href:      `/page-${i}`,
      label:     `Page ${i}`,
      visitedAt: new Date().toISOString(),
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
    renderWidget();
    // Shows max 6
    expect(screen.queryByText('Page 7')).not.toBeInTheDocument();
    expect(screen.getByText('Page 0')).toBeInTheDocument();
    expect(screen.getByText('Page 5')).toBeInTheDocument();
  });

  it('navigates when a recent page is clicked', async () => {
    const user = userEvent.setup();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([
      { href: '/scheduling', label: 'Scheduling', visitedAt: new Date().toISOString() },
    ]));
    renderWidget();
    await user.click(screen.getByText('Scheduling').closest('[role="button"]')!);
    expect(mockNavigate).toHaveBeenCalledWith('/scheduling');
  });

  it('clears history and hides widget when clear button is clicked', async () => {
    const user = userEvent.setup();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([
      { href: '/revenue', label: 'Revenue Cycle', visitedAt: new Date().toISOString() },
    ]));
    renderWidget();
    await user.click(screen.getByRole('button', { name: /clear recent pages/i }));
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(screen.queryByText('Recently Visited')).not.toBeInTheDocument();
  });

  it('displays relative time labels', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60_000).toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([
      { href: '/encounters', label: 'Encounters', visitedAt: fiveMinutesAgo },
    ]));
    renderWidget();
    expect(screen.getByText('5m ago')).toBeInTheDocument();
  });

  it('shows "Just now" for very recent visits', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([
      { href: '/triage', label: 'Triage', visitedAt: new Date().toISOString() },
    ]));
    renderWidget();
    expect(screen.getByText('Just now')).toBeInTheDocument();
  });

  it('navigates on Enter key press', async () => {
    const user = userEvent.setup();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([
      { href: '/governance', label: 'AI Governance', visitedAt: new Date().toISOString() },
    ]));
    renderWidget();
    const item = screen.getByText('AI Governance').closest('[role="button"]')!;
    item.focus();
    await user.keyboard('{Enter}');
    expect(mockNavigate).toHaveBeenCalledWith('/governance');
  });
});
