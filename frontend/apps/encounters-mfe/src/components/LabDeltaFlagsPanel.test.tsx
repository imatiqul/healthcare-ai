import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LabDeltaFlagsPanel } from './LabDeltaFlagsPanel';

beforeEach(() => {
  vi.restoreAllMocks();
  global.fetch = vi.fn();
});

const makeFlags = () => [
  {
    patientId: 'PAT-001',
    loincCode: '2160-0',
    displayName: 'Creatinine',
    currentValue: 8.5,
    unit: 'mg/dL',
    observedAt: '2026-04-10T10:00:00Z',
    severity: 'Critical',
    deltaAbsolute: 7.4,
    deltaPercent: 673,
    criticalRangeBreached: true,
    thresholdLabel: 'AACC ±50%',
  },
  {
    patientId: 'PAT-001',
    loincCode: '2823-3',
    displayName: 'Potassium',
    currentValue: 2.2,
    unit: 'mEq/L',
    observedAt: '2026-04-10T10:00:00Z',
    severity: 'High',
    deltaAbsolute: -1.8,
    deltaPercent: -45,
    criticalRangeBreached: false,
    thresholdLabel: 'Critical low < 2.5',
  },
];

describe('LabDeltaFlagsPanel', () => {
  it('renders Lab Delta Flags header', () => {
    render(<LabDeltaFlagsPanel />);
    expect(screen.getByText('Lab Delta Flags')).toBeInTheDocument();
  });

  it('shows prompt when no patient ID entered', () => {
    render(<LabDeltaFlagsPanel />);
    expect(screen.getByText(/Enter a patient ID/i)).toBeInTheDocument();
  });

  it('does not fetch until patient ID submitted', () => {
    render(<LabDeltaFlagsPanel />);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('fetches delta flags when patient ID entered and button clicked', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(makeFlags()),
    });
    render(<LabDeltaFlagsPanel />);
    await userEvent.type(screen.getByLabelText(/Patient ID/i), 'PAT-001');
    fireEvent.click(screen.getByRole('button', { name: /Check Deltas/i }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/fhir/observations/PAT-001/delta-flags'),
      expect.any(Object),
    ));
  });

  it('displays critical and high flags after load', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(makeFlags()),
    });
    render(<LabDeltaFlagsPanel />);
    await userEvent.type(screen.getByLabelText(/Patient ID/i), 'PAT-001');
    fireEvent.click(screen.getByRole('button', { name: /Check Deltas/i }));
    await waitFor(() => expect(screen.getByText('Creatinine')).toBeInTheDocument());
    expect(screen.getByText('Potassium')).toBeInTheDocument();
  });

  it('shows Critical and High summary chips', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(makeFlags()),
    });
    render(<LabDeltaFlagsPanel />);
    await userEvent.type(screen.getByLabelText(/Patient ID/i), 'PAT-001');
    fireEvent.click(screen.getByRole('button', { name: /Check Deltas/i }));
    await waitFor(() => expect(screen.getByText('1 Critical')).toBeInTheDocument());
    expect(screen.getByText('1 High')).toBeInTheDocument();
  });

  it('shows critical range breached chip for critical flag', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(makeFlags()),
    });
    render(<LabDeltaFlagsPanel />);
    await userEvent.type(screen.getByLabelText(/Patient ID/i), 'PAT-001');
    fireEvent.click(screen.getByRole('button', { name: /Check Deltas/i }));
    await waitFor(() => expect(screen.getByText('Critical Range')).toBeInTheDocument());
  });

  it('shows empty state for patient with no flags', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });
    render(<LabDeltaFlagsPanel />);
    await userEvent.type(screen.getByLabelText(/Patient ID/i), 'PAT-002');
    fireEvent.click(screen.getByRole('button', { name: /Check Deltas/i }));
    await waitFor(() =>
      expect(screen.getByText(/No delta flags found for patient PAT-002/i)).toBeInTheDocument()
    );
  });

  it('shows error message on HTTP error', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 503,
    });
    render(<LabDeltaFlagsPanel />);
    await userEvent.type(screen.getByLabelText(/Patient ID/i), 'PAT-001');
    fireEvent.click(screen.getByRole('button', { name: /Check Deltas/i }));
    await waitFor(() => expect(screen.getByText(/HTTP 503/)).toBeInTheDocument());
  });
});
