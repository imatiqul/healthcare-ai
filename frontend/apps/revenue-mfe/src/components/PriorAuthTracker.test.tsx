import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PriorAuthTracker } from './PriorAuthTracker';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('PriorAuthTracker', () => {
  it('shows loading spinner initially', () => {
    global.fetch = vi.fn(() => new Promise(() => {})) as unknown as typeof fetch;
    render(<PriorAuthTracker />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows empty state when no prior auths', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    ) as unknown as typeof fetch;

    render(<PriorAuthTracker />);
    await waitFor(() => {
      expect(screen.getByText('No prior authorizations')).toBeInTheDocument();
    });
  });

  it('renders prior auth items after fetch', async () => {
    const items = [
      { id: '1', procedureCode: 'CPT-27447', patientId: 'P1', patientName: 'Jane Smith', insurerName: 'BlueCross', status: 'Pending', submittedAt: '2025-01-01', reason: 'Knee replacement' },
    ];
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(items) })
    ) as unknown as typeof fetch;

    render(<PriorAuthTracker />);
    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders the Prior Authorizations header', () => {
    global.fetch = vi.fn(() => new Promise(() => {})) as unknown as typeof fetch;
    render(<PriorAuthTracker />);
    expect(screen.getByText('Prior Authorization Tracker')).toBeInTheDocument();
  });
});
