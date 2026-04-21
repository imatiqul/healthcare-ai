import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConsentManagementPanel } from './ConsentManagementPanel';

beforeEach(() => {
  vi.restoreAllMocks();
  global.fetch = vi.fn();
});

const makeConsents = () => [
  {
    id: 'c-001',
    patientUserId: 'pat-uuid-1',
    purpose: 'Treatment',
    scope: 'read:records',
    status: 'Active',
    grantedAt: '2026-01-01T00:00:00Z',
    expiresAt: null,
    policyVersion: '1.0',
  },
  {
    id: 'c-002',
    patientUserId: 'pat-uuid-1',
    purpose: 'Research',
    scope: 'read:anonymized',
    status: 'Revoked',
    grantedAt: '2025-06-01T00:00:00Z',
    expiresAt: null,
    policyVersion: '1.0',
  },
];

describe('ConsentManagementPanel', () => {
  it('renders Consent Management header', () => {
    render(<ConsentManagementPanel />);
    expect(screen.getByText('Consent Management')).toBeInTheDocument();
  });

  it('shows prompt when no patient ID entered', () => {
    render(<ConsentManagementPanel />);
    expect(screen.getByText(/Enter a patient user ID/i)).toBeInTheDocument();
  });

  it('fetches consents when patient ID entered and button clicked', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(makeConsents()),
    });
    render(<ConsentManagementPanel />);
    await userEvent.type(screen.getByLabelText(/Patient User ID/i), 'pat-uuid-1');
    fireEvent.click(screen.getByRole('button', { name: /Load Consents/i }));
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/identity/consent?patientId=pat-uuid-1'),
        expect.any(Object),
      )
    );
  });

  it('displays consent records after load', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(makeConsents()),
    });
    render(<ConsentManagementPanel />);
    await userEvent.type(screen.getByLabelText(/Patient User ID/i), 'pat-uuid-1');
    fireEvent.click(screen.getByRole('button', { name: /Load Consents/i }));
    await waitFor(() => expect(screen.getByText('Treatment')).toBeInTheDocument());
    expect(screen.getByText('Research')).toBeInTheDocument();
  });

  it('shows Active and Revoked badges', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(makeConsents()),
    });
    render(<ConsentManagementPanel />);
    await userEvent.type(screen.getByLabelText(/Patient User ID/i), 'pat-uuid-1');
    fireEvent.click(screen.getByRole('button', { name: /Load Consents/i }));
    await waitFor(() => expect(screen.getByText('Active')).toBeInTheDocument());
    expect(screen.getByText('Revoked')).toBeInTheDocument();
  });

  it('shows summary chips with Active and Revoked counts', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(makeConsents()),
    });
    render(<ConsentManagementPanel />);
    await userEvent.type(screen.getByLabelText(/Patient User ID/i), 'pat-uuid-1');
    fireEvent.click(screen.getByRole('button', { name: /Load Consents/i }));
    await waitFor(() => expect(screen.getByText('1 Active')).toBeInTheDocument());
    expect(screen.getByText('1 Revoked')).toBeInTheDocument();
  });

  it('calls DELETE endpoint when Revoke clicked', async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeConsents()),
      })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

    render(<ConsentManagementPanel />);
    await userEvent.type(screen.getByLabelText(/Patient User ID/i), 'pat-uuid-1');
    fireEvent.click(screen.getByRole('button', { name: /Load Consents/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Revoke/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Revoke/i }));
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/identity/consent/c-001'),
        expect.objectContaining({ method: 'DELETE' }),
      )
    );
  });

  it('shows empty state when no consents found', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });
    render(<ConsentManagementPanel />);
    await userEvent.type(screen.getByLabelText(/Patient User ID/i), 'pat-uuid-1');
    fireEvent.click(screen.getByRole('button', { name: /Load Consents/i }));
    await waitFor(() =>
      expect(screen.getByText(/No consent records found/i)).toBeInTheDocument()
    );
  });

  it('shows Grant Consent button after patient ID loaded', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });
    render(<ConsentManagementPanel />);
    await userEvent.type(screen.getByLabelText(/Patient User ID/i), 'pat-uuid-1');
    fireEvent.click(screen.getByRole('button', { name: /Load Consents/i }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Grant Consent/i })).toBeInTheDocument()
    );
  });

  it('shows error on HTTP failure', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 401,
    });
    render(<ConsentManagementPanel />);
    await userEvent.type(screen.getByLabelText(/Patient User ID/i), 'pat-uuid-1');
    fireEvent.click(screen.getByRole('button', { name: /Load Consents/i }));
    await waitFor(() => expect(screen.getByText(/HTTP 401/)).toBeInTheDocument());
  });
});
