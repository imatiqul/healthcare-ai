import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CareGapList } from './CareGapList';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('CareGapList', () => {
  it('shows empty state when no gaps', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    ) as unknown as typeof fetch;

    render(<CareGapList />);
    await waitFor(() => {
      expect(screen.getByText('No open care gaps')).toBeInTheDocument();
    });
  });

  it('renders care gap items after fetch', async () => {
    const gaps = [
      { id: '1', patientId: 'PAT-001-XYZ', measureName: 'HBA1C', status: 'Open', identifiedAt: '2025-01-01T00:00:00Z' },
      { id: '2', patientId: 'PAT-002-ABC', measureName: 'EYE-EXAM', status: 'Open', identifiedAt: '2025-01-02T00:00:00Z' },
    ];
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(gaps) })
    ) as unknown as typeof fetch;

    render(<CareGapList />);
    await waitFor(() => {
      expect(screen.getByText('HBA1C')).toBeInTheDocument();
    });
    expect(screen.getByText('EYE-EXAM')).toBeInTheDocument();
  });

  it('renders Open Care Gaps header', () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    ) as unknown as typeof fetch;

    render(<CareGapList />);
    expect(screen.getByText('Open Care Gaps')).toBeInTheDocument();
  });

  it('renders Address button for each gap', async () => {
    const gaps = [
      { id: '1', patientId: 'PAT-001-XYZ', measureName: 'HBA1C', status: 'Open', identifiedAt: '2025-01-01T00:00:00Z' },
    ];
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(gaps) })
    ) as unknown as typeof fetch;

    render(<CareGapList />);
    await waitFor(() => {
      expect(screen.getByText('Address')).toBeInTheDocument();
    });
  });
});
