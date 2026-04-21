import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImmunizationPanel } from './ImmunizationPanel';

const makeBundle = (resources: object[]) => ({
  resourceType: 'Bundle',
  entry: resources.map((resource) => ({ resource })),
});

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('ImmunizationPanel', () => {
  it('renders the search form', () => {
    render(<ImmunizationPanel />);
    expect(screen.getByPlaceholderText(/patient id/i)).toBeInTheDocument();
  });

  it('shows empty state initially', () => {
    render(<ImmunizationPanel />);
    expect(screen.getByText(/enter a patient id/i)).toBeInTheDocument();
  });

  it('fetches and renders immunizations', async () => {
    const user = userEvent.setup({ delay: null });
    const immunizations = [
      {
        resourceType: 'Immunization',
        id: 'imm-1',
        status: 'completed',
        occurrenceDateTime: '2025-09-01T00:00:00Z',
        vaccineCode: { coding: [{ display: 'COVID-19 mRNA Vaccine' }] },
        primarySource: true,
      },
    ];
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(makeBundle(immunizations)) })
    ) as unknown as typeof fetch;

    render(<ImmunizationPanel />);
    await user.type(screen.getByPlaceholderText(/patient id/i), 'PAT-VAX');
    await user.click(screen.getByRole('button', { name: /load/i }));

    await waitFor(() => {
      expect(screen.getByText('COVID-19 mRNA Vaccine')).toBeInTheDocument();
    });
    expect(screen.getByText('completed')).toBeInTheDocument();
  });

  it('shows no immunizations message when list is empty', async () => {
    const user = userEvent.setup({ delay: null });
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(makeBundle([])) })
    ) as unknown as typeof fetch;

    render(<ImmunizationPanel />);
    await user.type(screen.getByPlaceholderText(/patient id/i), 'PAT-NONE');
    await user.click(screen.getByRole('button', { name: /load/i }));

    await waitFor(() => {
      expect(screen.getByText(/no immunizations recorded/i)).toBeInTheDocument();
    });
  });

  it('shows error on fetch failure', async () => {
    const user = userEvent.setup({ delay: null });
    global.fetch = vi.fn(() => Promise.resolve({ ok: false, status: 500 })) as unknown as typeof fetch;

    render(<ImmunizationPanel />);
    await user.type(screen.getByPlaceholderText(/patient id/i), 'PAT-ERR');
    await user.click(screen.getByRole('button', { name: /load/i }));

    await waitFor(() => {
      expect(screen.getByText(/HTTP 500/i)).toBeInTheDocument();
    });
  });

  it('does not render Add or Delete buttons (read-only panel)', async () => {
    const user = userEvent.setup({ delay: null });
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(makeBundle([{
          resourceType: 'Immunization',
          id: 'imm-ro',
          status: 'completed',
          vaccineCode: { coding: [{ display: 'Flu Shot' }] },
        }])),
      })
    ) as unknown as typeof fetch;

    render(<ImmunizationPanel />);
    await user.type(screen.getByPlaceholderText(/patient id/i), 'PAT-RO');
    await user.click(screen.getByRole('button', { name: /load/i }));

    await waitFor(() => {
      expect(screen.getByText('Flu Shot')).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add/i })).not.toBeInTheDocument();
  });
});
