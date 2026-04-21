import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DemoAdminPanel from './DemoAdminPanel';

const mockSessions = [
  {
    sessionId: 'sess-001',
    clientName: 'Dr. Smith',
    company: 'NHS Trust',
    status: 'Completed',
    lastStep: 'AiTriage',
    npsScore: 9,
    avgRating: 4.5,
    startedAt: '2026-04-19T10:00:00Z',
    completedAt: '2026-04-19T10:45:00Z',
  },
  {
    sessionId: 'sess-002',
    clientName: 'Jane Doe',
    company: 'HealthCo',
    status: 'InProgress',
    lastStep: 'VoiceCapture',
    npsScore: null,
    avgRating: null,
    startedAt: '2026-04-20T09:00:00Z',
    completedAt: null,
  },
];

const mockInsight = {
  id: 'ins-001',
  generatedAt: '2026-04-20T10:00:00Z',
  sessionsAnalyzed: 10,
  averageNps: 8.2,
  topStrengths: 'AiTriage: 4.8/5; VoiceCapture: 4.6/5',
  topWeaknesses: 'Revenue: 3.1/5',
  recommendations: 'Top feature priorities: AI Triage (8 votes).',
};

beforeEach(() => {
  vi.resetAllMocks();
  global.fetch = vi.fn();
});

describe('DemoAdminPanel', () => {
  it('renders heading and fetches sessions on mount', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSessions),
    });
    render(<DemoAdminPanel />);
    expect(screen.getByText('Demo Admin Panel')).toBeInTheDocument();
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/agents/demo/sessions'),
        expect.any(Object),
      );
    });
  });

  it('shows session rows in table', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSessions),
    });
    render(<DemoAdminPanel />);
    await waitFor(() => expect(screen.getByText('Dr. Smith')).toBeInTheDocument());
    expect(screen.getByText('NHS Trust')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('shows completed count chip', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSessions),
    });
    render(<DemoAdminPanel />);
    await waitFor(() => expect(screen.getByText('1 completed')).toBeInTheDocument());
  });

  it('shows empty state when no sessions', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });
    render(<DemoAdminPanel />);
    await waitFor(() => expect(screen.getByText(/no demo sessions found/i)).toBeInTheDocument());
  });

  it('POSTs to /agents/demo/insights on Generate Insights click', async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockSessions) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockInsight) });
    render(<DemoAdminPanel />);
    await waitFor(() => screen.getByText('Dr. Smith'));
    fireEvent.click(screen.getByRole('button', { name: /generate insights/i }));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/agents/demo/insights'),
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  it('shows insight results with NPS and strengths', async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockSessions) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockInsight) });
    render(<DemoAdminPanel />);
    await waitFor(() => screen.getByText('Dr. Smith'));
    fireEvent.click(screen.getByRole('button', { name: /generate insights/i }));
    await waitFor(() => expect(screen.getByText('10 sessions analyzed')).toBeInTheDocument());
    expect(screen.getByText(/AiTriage: 4.8\/5/)).toBeInTheDocument();
  });

  it('shows error alert when insights POST fails', async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockSessions) })
      .mockResolvedValueOnce({ ok: false, status: 400, statusText: 'Bad Request' });
    render(<DemoAdminPanel />);
    await waitFor(() => screen.getByText('Dr. Smith'));
    fireEvent.click(screen.getByRole('button', { name: /generate insights/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('400'));
  });
});
