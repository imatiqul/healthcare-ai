import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClinicalCoderPanel } from './ClinicalCoderPanel';

const mockResult = {
  workflowId: 'wf-001',
  finalAnswer: 'ICD-10: J18.9 (Pneumonia), CPT: 99233 (Subsequent hospital care)',
  reasoningSteps: [
    'Observe: Transcript mentions fever, cough, bilateral infiltrates on CXR',
    'Reflect: Matches pneumonia pattern — J18.9 appropriate',
    'Act: Assign CPT 99233 for moderate complexity inpatient visit',
  ],
  iterations: 3,
  goalAchieved: true,
  payer: 'Medicare',
  codingAgentVersion: 'v2.1.0',
};

beforeEach(() => {
  vi.resetAllMocks();
  global.fetch = vi.fn();
});

describe('ClinicalCoderPanel', () => {
  it('renders heading and form fields', () => {
    render(<ClinicalCoderPanel />);
    expect(screen.getByText('Clinical Coding Agent')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /workflow id/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /encounter transcript/i })).toBeInTheDocument();
  });

  it('disables Code Encounter when inputs are empty', () => {
    render(<ClinicalCoderPanel />);
    expect(screen.getByRole('button', { name: /code encounter/i })).toBeDisabled();
  });

  it('POSTs to /agents/coding/code-encounter with correct payload', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResult),
    });
    render(<ClinicalCoderPanel />);
    await userEvent.type(screen.getByRole('textbox', { name: /workflow id/i }), 'wf-001');
    await userEvent.type(
      screen.getByRole('textbox', { name: /encounter transcript/i }),
      'Patient has fever and cough',
    );
    fireEvent.click(screen.getByRole('button', { name: /code encounter/i }));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/agents/coding/code-encounter'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('wf-001'),
        }),
      );
    });
  });

  it('shows final answer and Goal Achieved badge', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResult),
    });
    render(<ClinicalCoderPanel />);
    await userEvent.type(screen.getByRole('textbox', { name: /workflow id/i }), 'wf-001');
    await userEvent.type(screen.getByRole('textbox', { name: /encounter transcript/i }), 'tx');
    fireEvent.click(screen.getByRole('button', { name: /code encounter/i }));
    await waitFor(() =>
      expect(screen.getByText(/ICD-10: J18.9/)).toBeInTheDocument(),
    );
    expect(screen.getByText('Goal Achieved')).toBeInTheDocument();
  });

  it('shows iterations chip and reasoning steps', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResult),
    });
    render(<ClinicalCoderPanel />);
    await userEvent.type(screen.getByRole('textbox', { name: /workflow id/i }), 'wf-001');
    await userEvent.type(screen.getByRole('textbox', { name: /encounter transcript/i }), 'tx');
    fireEvent.click(screen.getByRole('button', { name: /code encounter/i }));
    await waitFor(() => expect(screen.getByText('3 iterations')).toBeInTheDocument());
    expect(screen.getByText('ReAct Reasoning Steps')).toBeInTheDocument();
    expect(screen.getByText(/Observe: Transcript mentions fever/)).toBeInTheDocument();
  });

  it('shows payer and agent version chips', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResult),
    });
    render(<ClinicalCoderPanel />);
    await userEvent.type(screen.getByRole('textbox', { name: /workflow id/i }), 'wf-001');
    await userEvent.type(screen.getByRole('textbox', { name: /encounter transcript/i }), 'tx');
    fireEvent.click(screen.getByRole('button', { name: /code encounter/i }));
    await waitFor(() => expect(screen.getByText('Medicare')).toBeInTheDocument());
    expect(screen.getByText('v2.1.0')).toBeInTheDocument();
  });

  it('shows error alert on server error', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false, status: 500, statusText: 'Internal Server Error',
    });
    render(<ClinicalCoderPanel />);
    await userEvent.type(screen.getByRole('textbox', { name: /workflow id/i }), 'wf-001');
    await userEvent.type(screen.getByRole('textbox', { name: /encounter transcript/i }), 'tx');
    fireEvent.click(screen.getByRole('button', { name: /code encounter/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('500'));
  });
});
