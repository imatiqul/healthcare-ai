import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { VoiceSessionHistory } from './VoiceSessionHistory';

beforeEach(() => {
  vi.restoreAllMocks();
});

const makeSessions = () => [
  {
    id: 'aaaa-0001-0001-0001-000000000001',
    patientId: 'PAT-001',
    status: 'Ended',
    startedAt: '2026-04-19T08:30:00Z',
  },
  {
    id: 'bbbb-0002-0002-0002-000000000002',
    patientId: 'PAT-002',
    status: 'Live',
    startedAt: new Date(Date.now() - 300000).toISOString(), // 5 min ago
  },
];

describe('VoiceSessionHistory', () => {
  it('renders Voice Session History header', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    ) as unknown as typeof fetch;
    render(<VoiceSessionHistory />);
    expect(screen.getByText('Voice Session History')).toBeInTheDocument();
  });

  it('shows empty state when no sessions exist', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    ) as unknown as typeof fetch;
    render(<VoiceSessionHistory />);
    await waitFor(() =>
      expect(screen.getByText(/No voice sessions found/i)).toBeInTheDocument()
    );
  });

  it('fetches sessions on mount', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    ) as unknown as typeof fetch;
    render(<VoiceSessionHistory />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/voice/sessions')
    ));
  });

  it('displays patient IDs after load', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(makeSessions()) })
    ) as unknown as typeof fetch;
    render(<VoiceSessionHistory />);
    await waitFor(() => expect(screen.getByText('PAT-001')).toBeInTheDocument());
    expect(screen.getByText('PAT-002')).toBeInTheDocument();
  });

  it('shows Live and Ended status chips', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(makeSessions()) })
    ) as unknown as typeof fetch;
    render(<VoiceSessionHistory />);
    await waitFor(() => expect(screen.getByText('Live')).toBeInTheDocument());
    expect(screen.getByText('Ended')).toBeInTheDocument();
  });

  it('shows live sessions banner when sessions are live', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(makeSessions()) })
    ) as unknown as typeof fetch;
    render(<VoiceSessionHistory />);
    await waitFor(() => expect(screen.getByText('1 live')).toBeInTheDocument());
  });

  it('shows summary chips with total and ended counts', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(makeSessions()) })
    ) as unknown as typeof fetch;
    render(<VoiceSessionHistory />);
    await waitFor(() => expect(screen.getByText('2 total')).toBeInTheDocument());
    expect(screen.getByText('1 ended')).toBeInTheDocument();
  });

  it('shows error message on HTTP failure', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: false, status: 500 })
    ) as unknown as typeof fetch;
    render(<VoiceSessionHistory />);
    await waitFor(() => expect(screen.getByText(/HTTP 500/)).toBeInTheDocument());
  });

  it('re-fetches when refresh button clicked', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    ) as unknown as typeof fetch;
    render(<VoiceSessionHistory />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: /refresh sessions/i }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
  });
});
