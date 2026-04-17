import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CodingQueue } from './CodingQueue';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('CodingQueue', () => {
  it('shows loading spinner initially', () => {
    global.fetch = vi.fn(() => new Promise(() => {})) as unknown as typeof fetch;
    render(<CodingQueue />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows empty state when no items', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    ) as unknown as typeof fetch;

    render(<CodingQueue />);
    await waitFor(() => {
      expect(screen.getByText('No encounters pending coding')).toBeInTheDocument();
    });
  });

  it('renders coding items after fetch', async () => {
    const items = [
      { id: '1', encounterId: 'ENC-001', patientId: 'P1', patientName: 'John Doe', suggestedCodes: ['J06.9'], approvedCodes: [], status: 'Pending', createdAt: '2025-01-01' },
    ];
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(items) })
    ) as unknown as typeof fetch;

    render(<CodingQueue />);
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('J06.9')).toBeInTheDocument();
  });

  it('renders the ICD-10 Coding Queue header', () => {
    global.fetch = vi.fn(() => new Promise(() => {})) as unknown as typeof fetch;
    render(<CodingQueue />);
    expect(screen.getByText('ICD-10 Coding Queue')).toBeInTheDocument();
  });
});
