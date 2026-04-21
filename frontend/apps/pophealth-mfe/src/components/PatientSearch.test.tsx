import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PatientSearch } from './PatientSearch';

// Mock mfe-events
vi.mock('@healthcare/mfe-events', () => ({
  emitPatientSelected: vi.fn(),
}));

beforeEach(() => {
  vi.restoreAllMocks();
});

const makePatients = () => [
  { id: 'r1', patientId: 'PAT-001-ABCDE', fullName: 'Alice Smith', riskLevel: 'High', riskScore: 0.78, openCareGaps: 3 },
  { id: 'r2', patientId: 'PAT-002-FGHIJ', fullName: 'Bob Jones', riskLevel: 'Moderate', riskScore: 0.42, openCareGaps: 1 },
];

describe('PatientSearch', () => {
  it('renders Patient Search header', () => {
    render(<PatientSearch />);
    expect(screen.getByText('Patient Search')).toBeInTheDocument();
  });

  it('renders search input field', () => {
    render(<PatientSearch />);
    expect(screen.getByPlaceholderText(/search by patient/i)).toBeInTheDocument();
  });

  it('shows no results initially', () => {
    render(<PatientSearch />);
    expect(screen.queryByText('PAT-001-ABCDE')).toBeNull();
  });

  it('fetches and displays results after typing', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(makePatients()) })
    ) as unknown as typeof fetch;

    const user = userEvent.setup({ delay: null });
    render(<PatientSearch />);

    await user.type(screen.getByPlaceholderText(/search by patient/i), 'alice');

    await waitFor(
      () => expect(screen.getByText('Alice Smith')).toBeInTheDocument(),
      { timeout: 1500 },
    );
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
  });

  it('shows risk badges for each result', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(makePatients()) })
    ) as unknown as typeof fetch;

    const user = userEvent.setup({ delay: null });
    render(<PatientSearch />);
    await user.type(screen.getByPlaceholderText(/search by patient/i), 'bob');

    await waitFor(
      () => expect(screen.getByText('High')).toBeInTheDocument(),
      { timeout: 1500 },
    );
    expect(screen.getByText('Moderate')).toBeInTheDocument();
  });

  it('shows empty state after search with no results', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    ) as unknown as typeof fetch;

    const user = userEvent.setup({ delay: null });
    render(<PatientSearch />);
    await user.type(screen.getByPlaceholderText(/search by patient/i), 'xyz-unknown');

    await waitFor(
      () => expect(screen.getByText(/no patients found/i)).toBeInTheDocument(),
      { timeout: 1500 },
    );
  });
});
