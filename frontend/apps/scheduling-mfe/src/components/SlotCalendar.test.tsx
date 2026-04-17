import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SlotCalendar } from './SlotCalendar';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('SlotCalendar', () => {
  it('shows empty state when no slots', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    ) as unknown as typeof fetch;

    render(<SlotCalendar />);
    await waitFor(() => {
      expect(screen.getByText('No available slots for this date')).toBeInTheDocument();
    });
  });

  it('renders slot cards after fetch', async () => {
    const slots = [
      { id: '1', practitionerId: 'DR-001', startTime: '2025-01-01T08:00:00Z', endTime: '2025-01-01T08:30:00Z', status: 'Available' },
      { id: '2', practitionerId: 'DR-001', startTime: '2025-01-01T09:00:00Z', endTime: '2025-01-01T09:30:00Z', status: 'Available' },
    ];
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(slots) })
    ) as unknown as typeof fetch;

    render(<SlotCalendar />);
    await waitFor(() => {
      expect(screen.getAllByText('Available')).toHaveLength(2);
    });
  });

  it('renders the Available Slots header', () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    ) as unknown as typeof fetch;

    render(<SlotCalendar />);
    expect(screen.getByText('Available Slots')).toBeInTheDocument();
  });

  it('handles fetch error gracefully', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('fail'))) as unknown as typeof fetch;
    render(<SlotCalendar />);
    await waitFor(() => {
      expect(screen.getByText('No available slots for this date')).toBeInTheDocument();
    });
  });
});
