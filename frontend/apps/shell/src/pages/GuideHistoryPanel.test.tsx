import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GuideHistoryPanel from './GuideHistoryPanel';

const mockHistory = {
  sessionId: 'sess-abc-123',
  messages: [
    { role: 'user', content: 'Show me high risk patients', timestamp: '2026-04-20T09:00:00Z' },
    { role: 'assistant', content: 'Here are the high-risk patients for today...', timestamp: '2026-04-20T09:00:02Z' },
    { role: 'user', content: 'What about care gaps?', timestamp: '2026-04-20T09:01:00Z' },
  ],
};

beforeEach(() => {
  vi.resetAllMocks();
  global.fetch = vi.fn();
});

describe('GuideHistoryPanel', () => {
  it('renders heading and session input', () => {
    render(<GuideHistoryPanel />);
    expect(screen.getByText('Guide Conversation History')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /session id/i })).toBeInTheDocument();
  });

  it('disables Load History when input is empty', () => {
    render(<GuideHistoryPanel />);
    expect(screen.getByRole('button', { name: /load history/i })).toBeDisabled();
  });

  it('GETs /agents/guide/history/{sessionId} on button click', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockHistory),
    });
    render(<GuideHistoryPanel />);
    await userEvent.type(screen.getByRole('textbox', { name: /session id/i }), 'sess-abc-123');
    fireEvent.click(screen.getByRole('button', { name: /load history/i }));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/agents/guide/history/sess-abc-123'),
        expect.any(Object),
      );
    });
  });

  it('shows messages with role badges', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockHistory),
    });
    render(<GuideHistoryPanel />);
    await userEvent.type(screen.getByRole('textbox', { name: /session id/i }), 'sess-abc-123');
    fireEvent.click(screen.getByRole('button', { name: /load history/i }));
    await waitFor(() => expect(screen.getByText('Show me high risk patients')).toBeInTheDocument());
    expect(screen.getByText('Here are the high-risk patients for today...')).toBeInTheDocument();
  });

  it('shows message count chip', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockHistory),
    });
    render(<GuideHistoryPanel />);
    await userEvent.type(screen.getByRole('textbox', { name: /session id/i }), 'sess-abc-123');
    fireEvent.click(screen.getByRole('button', { name: /load history/i }));
    await waitFor(() => expect(screen.getByText('3 messages')).toBeInTheDocument());
  });

  it('shows empty state when no messages', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ sessionId: 'empty-sess', messages: [] }),
    });
    render(<GuideHistoryPanel />);
    await userEvent.type(screen.getByRole('textbox', { name: /session id/i }), 'empty-sess');
    fireEvent.click(screen.getByRole('button', { name: /load history/i }));
    await waitFor(() => expect(screen.getByText(/no messages found/i)).toBeInTheDocument());
  });

  it('shows error alert on 404', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false, status: 404, statusText: 'Not Found',
    });
    render(<GuideHistoryPanel />);
    await userEvent.type(screen.getByRole('textbox', { name: /session id/i }), 'bad-sess');
    fireEvent.click(screen.getByRole('button', { name: /load history/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('404'));
  });
});
