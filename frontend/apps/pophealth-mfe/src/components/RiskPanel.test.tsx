import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { RiskPanel } from './RiskPanel';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('RiskPanel', () => {
  it('shows empty state when no risks', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    ) as unknown as typeof fetch;

    render(<RiskPanel />);
    await waitFor(() => {
      expect(screen.getByText('No risk assessments')).toBeInTheDocument();
    });
  });

  it('renders risk cards after fetch', async () => {
    const risks = [
      { id: '1', patientId: 'PAT-001-XYZ', level: 'Critical', riskScore: 0.92, assessedAt: '2025-01-01T00:00:00Z' },
      { id: '2', patientId: 'PAT-002-ABC', level: 'Low', riskScore: 0.15, assessedAt: '2025-01-01T00:00:00Z' },
    ];
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(risks) })
    ) as unknown as typeof fetch;

    render(<RiskPanel />);
    await waitFor(() => {
      expect(screen.getByText('Critical')).toBeInTheDocument();
    });
    expect(screen.getByText('Low')).toBeInTheDocument();
  });

  it('renders the Patient Risk Stratification header', () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    ) as unknown as typeof fetch;

    render(<RiskPanel />);
    expect(screen.getByText('Patient Risk Stratification')).toBeInTheDocument();
  });

  it('renders filter dropdown', () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    ) as unknown as typeof fetch;

    render(<RiskPanel />);
    expect(screen.getByText('All Levels')).toBeInTheDocument();
  });
});
