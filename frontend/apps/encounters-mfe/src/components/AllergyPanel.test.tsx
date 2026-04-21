import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AllergyPanel } from './AllergyPanel';

const makeBundle = (resources: object[]) => ({
  resourceType: 'Bundle',
  entry: resources.map((resource) => ({ resource })),
});

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('AllergyPanel', () => {
  it('renders the search form', () => {
    render(<AllergyPanel />);
    expect(screen.getByPlaceholderText(/patient id/i)).toBeInTheDocument();
  });

  it('shows empty state initially', () => {
    render(<AllergyPanel />);
    expect(screen.getByText(/enter a patient id/i)).toBeInTheDocument();
  });

  it('fetches and renders allergies', async () => {
    const user = userEvent.setup();
    const allergies = [
      {
        resourceType: 'AllergyIntolerance',
        id: 'allergy-1',
        criticality: 'high',
        recordedDate: '2026-01-15T00:00:00Z',
        code: { coding: [{ display: 'Penicillin' }] },
        reaction: [{ description: 'Anaphylaxis' }],
      },
    ];
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(makeBundle(allergies)) })
    ) as unknown as typeof fetch;

    render(<AllergyPanel />);
    await user.type(screen.getByPlaceholderText(/patient id/i), 'PAT-123');
    await user.click(screen.getByRole('button', { name: /load/i }));

    await waitFor(() => {
      expect(screen.getByText('Penicillin')).toBeInTheDocument();
    });
    expect(screen.getByText('Anaphylaxis')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
  });

  it('shows no allergies message when list is empty', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(makeBundle([])) })
    ) as unknown as typeof fetch;

    render(<AllergyPanel />);
    await user.type(screen.getByPlaceholderText(/patient id/i), 'PAT-NONE');
    await user.click(screen.getByRole('button', { name: /load/i }));

    await waitFor(() => {
      expect(screen.getByText(/no allergies recorded/i)).toBeInTheDocument();
    });
  });

  it('shows error on fetch failure', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn(() => Promise.resolve({ ok: false, status: 503 })) as unknown as typeof fetch;

    render(<AllergyPanel />);
    await user.type(screen.getByPlaceholderText(/patient id/i), 'PAT-ERR');
    await user.click(screen.getByRole('button', { name: /load/i }));

    await waitFor(() => {
      expect(screen.getByText(/HTTP 503/i)).toBeInTheDocument();
    });
  });
});
