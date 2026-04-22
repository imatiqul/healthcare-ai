import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
      () => expect(screen.getAllByText('High').length).toBeGreaterThanOrEqual(1),
      { timeout: 1500 },
    );
    expect(screen.getAllByText('Moderate').length).toBeGreaterThanOrEqual(1);
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

  it('shows risk level filter buttons after results load', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(makePatients()) })
    ) as unknown as typeof fetch;

    const user = userEvent.setup({ delay: null });
    render(<PatientSearch />);
    await user.type(screen.getByPlaceholderText(/search by patient/i), 'ali');

    await waitFor(
      () => expect(screen.getByText('Alice Smith')).toBeInTheDocument(),
      { timeout: 1500 },
    );
    expect(screen.getByRole('group', { name: /filter by risk level/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /care gaps only/i })).toBeInTheDocument();
  });

  it('risk filter hides non-matching results', async () => {
    const patients = [
      { id: 'r1', patientId: 'PAT-001', fullName: 'Alice Smith', riskLevel: 'High', riskScore: 78, openCareGaps: 1 },
      { id: 'r2', patientId: 'PAT-002', fullName: 'Bob Jones',  riskLevel: 'Low',  riskScore: 12, openCareGaps: 0 },
    ];
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(patients) })
    ) as unknown as typeof fetch;

    const user = userEvent.setup({ delay: null });
    render(<PatientSearch />);
    await user.type(screen.getByPlaceholderText(/search by patient/i), 'test');

    await waitFor(() => screen.getByText('Alice Smith'), { timeout: 1500 });

    // Click High filter
    fireEvent.click(screen.getByRole('button', { name: 'High' }));
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.queryByText('Bob Jones')).toBeNull();
  });

  it('care gaps toggle hides patients without gaps', async () => {
    const patients = [
      { id: 'r1', patientId: 'PAT-001', fullName: 'Alice Smith', riskLevel: 'High', riskScore: 78, openCareGaps: 3 },
      { id: 'r2', patientId: 'PAT-002', fullName: 'Bob Jones',  riskLevel: 'Low',  riskScore: 12, openCareGaps: 0 },
    ];
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(patients) })
    ) as unknown as typeof fetch;

    const user = userEvent.setup({ delay: null });
    render(<PatientSearch />);
    await user.type(screen.getByPlaceholderText(/search by patient/i), 'test');

    await waitFor(() => screen.getByText('Alice Smith'), { timeout: 1500 });

    fireEvent.click(screen.getByRole('button', { name: /care gaps only/i }));
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.queryByText('Bob Jones')).toBeNull();
  });
});
