import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { TriageViewer } from './TriageViewer';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('TriageViewer', () => {
  it('shows empty state when no workflows', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    ) as unknown as typeof fetch;

    render(<TriageViewer />);
    await waitFor(() => {
      expect(screen.getByText('No triage workflows yet')).toBeInTheDocument();
    });
  });

  it('renders workflow cards after fetch', async () => {
    const workflows = [
      { id: '1', sessionId: 'abcdefgh-1234', status: 'Completed', triageLevel: 'P3_Standard', createdAt: '2025-01-01T00:00:00Z' },
      { id: '2', sessionId: '12345678-abcd', status: 'AwaitingHumanReview', triageLevel: 'P1_Immediate', createdAt: '2025-01-02T00:00:00Z' },
    ];
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(workflows) })
    ) as unknown as typeof fetch;

    render(<TriageViewer />);
    await waitFor(() => {
      expect(screen.getByText('P3_Standard')).toBeInTheDocument();
    });
    expect(screen.getByText('P1_Immediate')).toBeInTheDocument();
    // 'Completed' appears in both the filter chip and the workflow badge
    expect(screen.getAllByText('Completed').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('AwaitingHumanReview')).toBeInTheDocument();
  });

  it('shows Review & Approve button for AwaitingHumanReview', async () => {
    const workflows = [
      { id: '1', sessionId: 'abcdefgh-1234', status: 'AwaitingHumanReview', triageLevel: 'P1_Immediate', createdAt: '2025-01-01T00:00:00Z' },
    ];
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(workflows) })
    ) as unknown as typeof fetch;

    render(<TriageViewer />);
    await waitFor(() => {
      expect(screen.getByText('Review & Approve')).toBeInTheDocument();
    });
  });

  it('handles fetch error gracefully', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error'))) as unknown as typeof fetch;
    render(<TriageViewer />);
    await waitFor(() => {
      expect(screen.getByText('Failed to load triage workflows. Retrying automatically.')).toBeInTheDocument();
    });
  });

  it('renders status filter chips', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    ) as unknown as typeof fetch;

    render(<TriageViewer />);
    await waitFor(() => screen.getByText('No triage workflows yet'));
    const filterBar = screen.getByLabelText(/triage filters/i);
    expect(within(filterBar).getAllByText('All').length).toBeGreaterThanOrEqual(1);
    expect(within(filterBar).getByText('Awaiting Review')).toBeInTheDocument();
    expect(within(filterBar).getByText('Completed')).toBeInTheDocument();
  });

  it('status filter hides non-matching workflows', async () => {
    const workflows = [
      { id: '1', sessionId: 'aaa-111', status: 'Completed',           triageLevel: 'P3_Standard',  createdAt: '2025-01-01T00:00:00Z' },
      { id: '2', sessionId: 'bbb-222', status: 'AwaitingHumanReview', triageLevel: 'P1_Immediate', createdAt: '2025-01-02T00:00:00Z' },
    ];
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(workflows) })
    ) as unknown as typeof fetch;

    render(<TriageViewer />);
    await waitFor(() => screen.getByText('P3_Standard'));

    // Filter to Completed only (scope to filter bar to avoid badge text clash)
    const filterBar = screen.getByLabelText(/triage filters/i);
    fireEvent.click(within(filterBar).getByText('Completed'));
    expect(screen.getByText('P3_Standard')).toBeInTheDocument();
    expect(screen.queryByText('P1_Immediate')).toBeNull();
  });

  it('level filter hides non-matching workflows', async () => {
    const workflows = [
      { id: '1', sessionId: 'aaa-111', status: 'Completed', triageLevel: 'P1_Immediate', createdAt: '2025-01-01T00:00:00Z' },
      { id: '2', sessionId: 'bbb-222', status: 'Completed', triageLevel: 'P3_Standard',  createdAt: '2025-01-02T00:00:00Z' },
    ];
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(workflows) })
    ) as unknown as typeof fetch;

    render(<TriageViewer />);
    await waitFor(() => screen.getByText('P1_Immediate'));

    fireEvent.click(screen.getByText('P1 Immediate'));
    expect(screen.getByText('P1_Immediate')).toBeInTheDocument();
    expect(screen.queryByText('P3_Standard')).toBeNull();
  });

  it('shows no-match message when all workflows are filtered out', async () => {
    const workflows = [
      { id: '1', sessionId: 'aaa-111', status: 'Completed', triageLevel: 'P3_Standard', createdAt: '2025-01-01T00:00:00Z' },
    ];
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(workflows) })
    ) as unknown as typeof fetch;

    render(<TriageViewer />);
    await waitFor(() => screen.getByText('P3_Standard'));

    const filterBar = screen.getByLabelText(/triage filters/i);
    fireEvent.click(within(filterBar).getByText('Awaiting Review'));
    expect(screen.getByText(/no workflows match the active filters/i)).toBeInTheDocument();
  });
});
