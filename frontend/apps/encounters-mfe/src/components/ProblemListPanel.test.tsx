import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProblemListPanel } from './ProblemListPanel';

const makeBundle = (resources: object[]) => ({
  resourceType: 'Bundle',
  entry: resources.map((resource) => ({ resource })),
});

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('ProblemListPanel', () => {
  it('renders the search form', () => {
    render(<ProblemListPanel />);
    expect(screen.getByPlaceholderText(/patient id/i)).toBeInTheDocument();
  });

  it('shows empty state initially', () => {
    render(<ProblemListPanel />);
    expect(screen.getByText(/enter a patient id/i)).toBeInTheDocument();
  });

  it('fetches and renders conditions', async () => {
    const user = userEvent.setup({ delay: null });
    const conditions = [
      {
        resourceType: 'Condition',
        id: 'cond-1',
        clinicalStatus: { coding: [{ code: 'active' }] },
        onsetDateTime: '2026-01-01T00:00:00Z',
        code: { coding: [{ display: 'Type 2 Diabetes' }] },
      },
    ];
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(makeBundle(conditions)) })
    ) as unknown as typeof fetch;

    render(<ProblemListPanel />);
    await user.type(screen.getByPlaceholderText(/patient id/i), 'PAT-DM2');
    await user.click(screen.getByRole('button', { name: /load/i }));

    await waitFor(() => {
      expect(screen.getByText('Type 2 Diabetes')).toBeInTheDocument();
    });
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('shows no conditions message when list is empty', async () => {
    const user = userEvent.setup({ delay: null });
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(makeBundle([])) })
    ) as unknown as typeof fetch;

    render(<ProblemListPanel />);
    await user.type(screen.getByPlaceholderText(/patient id/i), 'PAT-NONE');
    await user.click(screen.getByRole('button', { name: /load/i }));

    await waitFor(() => {
      expect(screen.getByText(/no conditions recorded/i)).toBeInTheDocument();
    });
  });

  it('shows error on fetch failure', async () => {
    const user = userEvent.setup({ delay: null });
    global.fetch = vi.fn(() => Promise.resolve({ ok: false, status: 404 })) as unknown as typeof fetch;

    render(<ProblemListPanel />);
    await user.type(screen.getByPlaceholderText(/patient id/i), 'PAT-MISS');
    await user.click(screen.getByRole('button', { name: /load/i }));

    await waitFor(() => {
      expect(screen.getByText(/HTTP 404/i)).toBeInTheDocument();
    });
  });
});
