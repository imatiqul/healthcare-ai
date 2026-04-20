import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { RiskDistributionChart } from './RiskDistributionChart';

beforeEach(() => {
  vi.restoreAllMocks();
});

const makeStats = () => ({
  HighRiskPatients: 25,
  TotalPatients: 100,
  OpenCareGaps: 40,
  ClosedCareGaps: 60,
});

const makeRisks = () => [
  { level: 'Critical' },
  { level: 'Critical' },
  { level: 'High' },
  { level: 'High' },
  { level: 'High' },
  { level: 'Moderate' },
  { level: 'Low' },
];

describe('RiskDistributionChart', () => {
  it('renders Population Overview header', () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    ) as unknown as typeof fetch;
    render(<RiskDistributionChart />);
    expect(screen.getByText('Population Overview')).toBeInTheDocument();
  });

  it('displays risk level labels after data loads', async () => {
    let call = 0;
    global.fetch = vi.fn(() => {
      const body = call++ === 0 ? makeStats() : makeRisks();
      return Promise.resolve({ ok: true, json: () => Promise.resolve(body) });
    }) as unknown as typeof fetch;

    render(<RiskDistributionChart />);
    await waitFor(() => {
      expect(screen.getByText('Critical')).toBeInTheDocument();
    });
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Moderate')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();
  });

  it('shows care gap closure rate', async () => {
    let call = 0;
    global.fetch = vi.fn(() => {
      const body = call++ === 0 ? makeStats() : makeRisks();
      return Promise.resolve({ ok: true, json: () => Promise.resolve(body) });
    }) as unknown as typeof fetch;

    render(<RiskDistributionChart />);
    // ClosedCareGaps=60, total=100 => 60% closure rate
    await waitFor(() => {
      expect(screen.getByText(/60%/)).toBeInTheDocument();
    });
  });

  it('shows risk distribution section header', async () => {
    let call = 0;
    global.fetch = vi.fn(() => {
      const body = call++ === 0 ? makeStats() : makeRisks();
      return Promise.resolve({ ok: true, json: () => Promise.resolve(body) });
    }) as unknown as typeof fetch;

    render(<RiskDistributionChart />);
    await waitFor(() => {
      expect(screen.getByText('Risk Distribution')).toBeInTheDocument();
    });
  });
});
