import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MedicationPanel } from './MedicationPanel';

const makeBundle = (resources: object[]) => ({
  resourceType: 'Bundle',
  entry: resources.map((resource) => ({ resource })),
});

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('MedicationPanel', () => {
  it('renders the patient ID search form', () => {
    render(<MedicationPanel />);
    expect(screen.getByPlaceholderText(/patient id/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /load/i })).toBeInTheDocument();
  });

  it('shows empty state before a search', () => {
    render(<MedicationPanel />);
    expect(screen.getByText(/enter a patient id/i)).toBeInTheDocument();
  });

  it('disables Prescribe button until patient is loaded', () => {
    render(<MedicationPanel />);
    expect(screen.getByRole('button', { name: /prescribe/i })).toBeDisabled();
  });

  it('fetches and renders medications after a search', async () => {
    const user = userEvent.setup({ delay: null });
    const medications = [
      {
        resourceType: 'MedicationRequest',
        id: 'med-1',
        status: 'active',
        medicationCodeableConcept: { text: 'Amoxicillin 500mg' },
        authoredOn: '2026-01-10T00:00:00Z',
        dosageInstruction: [{ text: 'Take 1 capsule three times daily' }],
      },
    ];
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(makeBundle(medications)) })
    ) as unknown as typeof fetch;

    render(<MedicationPanel />);
    const input = screen.getByPlaceholderText(/patient id/i);
    await user.type(input, 'PAT-123');
    await user.click(screen.getByRole('button', { name: /load/i }));

    await waitFor(() => {
      expect(screen.getByText('Amoxicillin 500mg')).toBeInTheDocument();
    });
    expect(screen.getByText(/three times daily/i)).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('shows error message on fetch failure', async () => {
    const user = userEvent.setup({ delay: null });
    global.fetch = vi.fn(() => Promise.resolve({ ok: false, status: 500 })) as unknown as typeof fetch;

    render(<MedicationPanel />);
    await user.type(screen.getByPlaceholderText(/patient id/i), 'PAT-ERR');
    await user.click(screen.getByRole('button', { name: /load/i }));

    await waitFor(() => {
      expect(screen.getByText(/HTTP 500/i)).toBeInTheDocument();
    });
  });

  it('shows no medications message when list is empty', async () => {
    const user = userEvent.setup({ delay: null });
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(makeBundle([])) })
    ) as unknown as typeof fetch;

    render(<MedicationPanel />);
    await user.type(screen.getByPlaceholderText(/patient id/i), 'PAT-EMPTY');
    await user.click(screen.getByRole('button', { name: /load/i }));

    await waitFor(() => {
      expect(screen.getByText(/no medications recorded/i)).toBeInTheDocument();
    });
  });

  it('shows Discontinue button for active medications', async () => {
    const user = userEvent.setup({ delay: null });
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(makeBundle([{
          resourceType: 'MedicationRequest',
          id: 'med-disc',
          status: 'active',
          medicationCodeableConcept: { text: 'Metformin' },
        }])),
      })
    ) as unknown as typeof fetch;

    render(<MedicationPanel />);
    await user.type(screen.getByPlaceholderText(/patient id/i), 'PAT-DISC');
    await user.click(screen.getByRole('button', { name: /load/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /discontinue/i })).toBeInTheDocument();
    });
  });
});
