import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from './Dashboard';

const mockStats = {
  agents: { PendingTriage: 3, AwaitingReview: 1, Completed: 12 },
  scheduling: { AvailableToday: 18, BookedToday: 5, TotalBookings: 42 },
  popHealth: { HighRiskPatients: 2, TotalPatients: 50, OpenCareGaps: 6, ClosedCareGaps: 4 },
  revenue: { codingQueue: 8, codingReviewed: 3, codingSubmitted: 5, priorAuthsPending: 4, priorAuthsApproved: 2, priorAuthsDenied: 1 },
};

beforeEach(() => {
  vi.restoreAllMocks();
  global.fetch = vi.fn((url: string) => {
    if (url.includes('agents/stats')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStats.agents) });
    if (url.includes('scheduling/stats')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStats.scheduling) });
    if (url.includes('population-health/stats')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStats.popHealth) });
    if (url.includes('revenue/stats')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStats.revenue) });
    return Promise.resolve({ ok: false });
  }) as unknown as typeof fetch;
});

describe('Dashboard', () => {
  it('renders the heading', async () => {
    render(<Dashboard />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('shows loading spinner initially', () => {
    global.fetch = vi.fn(() => new Promise(() => {})) as unknown as typeof fetch;
    render(<Dashboard />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays stats after loading', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Pending Triage')).toBeInTheDocument();
    });
    expect(screen.getByText('Triage Completed')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Available Slots Today')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText('Coding Queue')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('renders 8 stat cards', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Pending Triage')).toBeInTheDocument();
    });
    const labels = [
      'Pending Triage', 'Triage Completed', 'Available Slots Today', 'Booked Today',
      'High-Risk Patients', 'Open Care Gaps', 'Coding Queue', 'Prior Auths Pending',
    ];
    labels.forEach(label => expect(screen.getByText(label)).toBeInTheDocument());
  });

  it('handles fetch errors gracefully', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: false })) as unknown as typeof fetch;
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Pending Triage')).toBeInTheDocument();
    });
    // Fallback values should all be 0
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBe(8);
  });
});
