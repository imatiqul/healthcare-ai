import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OverallFeedbackDialog } from './OverallFeedbackDialog';

describe('OverallFeedbackDialog', () => {
  const defaultProps = {
    open: true,
    onSubmit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the overall feedback title', () => {
    render(<OverallFeedbackDialog {...defaultProps} />);
    expect(screen.getByText('Overall Feedback')).toBeInTheDocument();
  });

  it('renders NPS score chips 0-10', () => {
    render(<OverallFeedbackDialog {...defaultProps} />);
    for (let i = 0; i <= 10; i++) {
      expect(screen.getByText(String(i))).toBeInTheDocument();
    }
  });

  it('renders all feature priority options', () => {
    render(<OverallFeedbackDialog {...defaultProps} />);
    const features = ['Voice Intake', 'AI Triage', 'Scheduling', 'Revenue Cycle', 'Population Health', 'Copilot Guide'];
    features.forEach(f => expect(screen.getByText(f)).toBeInTheDocument());
  });

  it('disables Complete Demo button when no NPS selected', () => {
    render(<OverallFeedbackDialog {...defaultProps} />);
    expect(screen.getByRole('button', { name: /Complete Demo/ })).toBeDisabled();
  });

  it('enables Complete Demo button after NPS selection', async () => {
    const user = userEvent.setup({ delay: null });
    render(<OverallFeedbackDialog {...defaultProps} />);
    await user.click(screen.getByText('9'));
    expect(screen.getByRole('button', { name: /Complete Demo/ })).toBeEnabled();
  });

  it('calls onSubmit with NPS score, priorities, and comment', async () => {
    const user = userEvent.setup({ delay: null });
    render(<OverallFeedbackDialog {...defaultProps} />);
    await user.click(screen.getByText('8'));
    await user.click(screen.getByText('AI Triage'));
    await user.type(screen.getByPlaceholderText(/additional comments/), 'Great platform');
    await user.click(screen.getByRole('button', { name: /Complete Demo/ }));
    expect(defaultProps.onSubmit).toHaveBeenCalledWith(8, ['AI Triage'], 'Great platform');
  });
});
