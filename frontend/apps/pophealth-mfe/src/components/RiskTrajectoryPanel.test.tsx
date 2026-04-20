import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RiskTrajectoryPanel } from './RiskTrajectoryPanel';

beforeEach(() => {
  vi.restoreAllMocks();
});

const makeTrajectory = (overrides = {}) => ({
  patientId: 'PAT-123',
  dataPoints: [
    { assessedAt: '2025-01-01T00:00:00Z', riskScore: 0.45, level: 'Moderate', trend: 'Stable', scoreDelta: 0 },
    { assessedAt: '2025-02-01T00:00:00Z', riskScore: 0.62, level: 'High', trend: 'Worsening', scoreDelta: 0.17 },
    { assessedAt: '2025-03-01T00:00:00Z', riskScore: 0.55, level: 'Moderate', trend: 'Improving', scoreDelta: -0.07 },
  ],
  min: 0.45,
  max: 0.62,
  mean: 0.54,
  slope: 0.05,
  overallTrend: 'Worsening',
  ...overrides,
});

describe('RiskTrajectoryPanel', () => {
  it('renders the card header', () => {
    global.fetch = vi.fn() as unknown as typeof fetch;
    render(<RiskTrajectoryPanel />);
    expect(screen.getByText('Risk Score Trajectory')).toBeInTheDocument();
  });

  it('shows empty prompt before patient ID is entered', () => {
    global.fetch = vi.fn() as unknown as typeof fetch;
    render(<RiskTrajectoryPanel />);
    expect(screen.getByText('Enter a patient ID to view risk trajectory')).toBeInTheDocument();
  });

  it('fetches trajectory when patient ID is typed', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(makeTrajectory()) })
    ) as unknown as typeof fetch;

    const user = userEvent.setup();
    render(<RiskTrajectoryPanel />);
    await user.type(screen.getByLabelText('Patient ID'), 'PAT-123');

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('PAT-123'),
        expect.any(Object),
      );
    });
  });

  it('displays trend chip and statistics', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(makeTrajectory()) })
    ) as unknown as typeof fetch;

    const user = userEvent.setup();
    render(<RiskTrajectoryPanel />);
    await user.type(screen.getByLabelText('Patient ID'), 'PAT-123');

    await waitFor(() => {
      expect(screen.getByText(/Trend: Worsening/)).toBeInTheDocument();
    });
    expect(screen.getByText(/Mean: 0.54/)).toBeInTheDocument();
    expect(screen.getByText(/Min: 0.45/)).toBeInTheDocument();
    expect(screen.getByText(/Max: 0.62/)).toBeInTheDocument();
    expect(screen.getByText(/3 assessments/)).toBeInTheDocument();
  });

  it('shows empty state when no data points returned', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(makeTrajectory({ dataPoints: [], min: null, max: null, mean: null })),
      })
    ) as unknown as typeof fetch;

    const user = userEvent.setup();
    render(<RiskTrajectoryPanel />);
    await user.type(screen.getByLabelText('Patient ID'), 'PAT-EMPTY');

    await waitFor(() => {
      expect(screen.getByText('No trajectory data for this patient')).toBeInTheDocument();
    });
  });

  it('shows error message on fetch failure', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) })
    ) as unknown as typeof fetch;

    const user = userEvent.setup();
    render(<RiskTrajectoryPanel />);
    await user.type(screen.getByLabelText('Patient ID'), 'BAD');

    await waitFor(() => {
      expect(screen.getByText(/HTTP 404/)).toBeInTheDocument();
    });
  });

  it('renders Recent Assessments section with latest 5 entries', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(makeTrajectory()) })
    ) as unknown as typeof fetch;

    const user = userEvent.setup();
    render(<RiskTrajectoryPanel />);
    await user.type(screen.getByLabelText('Patient ID'), 'PAT-123');

    await waitFor(() => {
      expect(screen.getByText('Recent Assessments')).toBeInTheDocument();
    });
    // Scores visible in recent section
    expect(screen.getAllByText(/0\.55|0\.62|0\.45/).length).toBeGreaterThan(0);
  });

  it('renders SVG sparkline chart when data present', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(makeTrajectory()) })
    ) as unknown as typeof fetch;

    const user = userEvent.setup();
    render(<RiskTrajectoryPanel />);
    await user.type(screen.getByLabelText('Patient ID'), 'PAT-123');

    await waitFor(() => {
      expect(document.querySelector('svg')).not.toBeNull();
    });
  });

  it('shows not-enough-data message for single-point trajectory', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve(
            makeTrajectory({
              dataPoints: [
                { assessedAt: '2025-01-01T00:00:00Z', riskScore: 0.5, level: 'Moderate', trend: 'Stable', scoreDelta: 0 },
              ],
            }),
          ),
      })
    ) as unknown as typeof fetch;

    const user = userEvent.setup();
    render(<RiskTrajectoryPanel />);
    await user.type(screen.getByLabelText('Patient ID'), 'PAT-ONE');

    await waitFor(() => {
      expect(screen.getByText(/Not enough data to plot trajectory/)).toBeInTheDocument();
    });
  });
});
