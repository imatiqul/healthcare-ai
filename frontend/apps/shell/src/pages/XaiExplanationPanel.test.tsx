import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import XaiExplanationPanel from './XaiExplanationPanel';

const mockExplanation = {
  agentDecisionId: 'dec-001',
  agentName: 'TriageAgent',
  guardVerdict: 'pass',
  confidenceScore: 0.87,
  ragChunks: ['chunk-alpha', 'chunk-beta'],
  reasoningSteps: ['Observe: patient vitals critical', 'Reflect: escalation required', 'Act: escalate to Level 1'],
  createdAt: '2026-04-20T10:00:00Z',
  confidenceInterval: {
    confidenceLevel: 'High',
    decisionConfidence: 0.87,
    lowerBound95: 0.78,
    upperBound95: 0.93,
    method: 'LIME-fallback',
    interpretation: 'Strong model confidence with narrow uncertainty range.',
  },
};

beforeEach(() => {
  vi.resetAllMocks();
  global.fetch = vi.fn();
});

describe('XaiExplanationPanel', () => {
  it('renders heading and input', () => {
    render(<XaiExplanationPanel />);
    expect(screen.getByText('XAI Decision Explanation')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /decision id/i })).toBeInTheDocument();
  });

  it('disables Fetch Explanation when input is empty', () => {
    render(<XaiExplanationPanel />);
    expect(screen.getByRole('button', { name: /fetch explanation/i })).toBeDisabled();
  });

  it('fetches GET /agents/decisions/{id}/explanation on button click', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockExplanation),
    });
    render(<XaiExplanationPanel />);
    await userEvent.type(screen.getByRole('textbox', { name: /decision id/i }), 'dec-001');
    fireEvent.click(screen.getByRole('button', { name: /fetch explanation/i }));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/agents/decisions/dec-001/explanation'),
      );
    });
  });

  it('shows agent name and guard verdict', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockExplanation),
    });
    render(<XaiExplanationPanel />);
    await userEvent.type(screen.getByRole('textbox', { name: /decision id/i }), 'dec-001');
    fireEvent.click(screen.getByRole('button', { name: /fetch explanation/i }));
    await waitFor(() => expect(screen.getByText('TriageAgent')).toBeInTheDocument());
    expect(screen.getByText('PASS')).toBeInTheDocument();
  });

  it('shows confidence interval details', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockExplanation),
    });
    render(<XaiExplanationPanel />);
    await userEvent.type(screen.getByRole('textbox', { name: /decision id/i }), 'dec-001');
    fireEvent.click(screen.getByRole('button', { name: /fetch explanation/i }));
    await waitFor(() => expect(screen.getByText(/confidence interval/i)).toBeInTheDocument());
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('LIME-fallback')).toBeInTheDocument();
  });

  it('shows reasoning steps', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockExplanation),
    });
    render(<XaiExplanationPanel />);
    await userEvent.type(screen.getByRole('textbox', { name: /decision id/i }), 'dec-001');
    fireEvent.click(screen.getByRole('button', { name: /fetch explanation/i }));
    await waitFor(() => expect(screen.getByText('Reasoning Steps')).toBeInTheDocument());
    expect(screen.getByText('Observe: patient vitals critical')).toBeInTheDocument();
  });

  it('shows RAG chunks', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockExplanation),
    });
    render(<XaiExplanationPanel />);
    await userEvent.type(screen.getByRole('textbox', { name: /decision id/i }), 'dec-001');
    fireEvent.click(screen.getByRole('button', { name: /fetch explanation/i }));
    await waitFor(() => expect(screen.getByText('RAG Context Chunks')).toBeInTheDocument());
    expect(screen.getByText('chunk-alpha')).toBeInTheDocument();
  });

  it('shows error alert on 404', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });
    render(<XaiExplanationPanel />);
    await userEvent.type(screen.getByRole('textbox', { name: /decision id/i }), 'bad-id');
    fireEvent.click(screen.getByRole('button', { name: /fetch explanation/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('404'));
  });
});
