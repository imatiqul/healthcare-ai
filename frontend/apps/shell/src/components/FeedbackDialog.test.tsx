import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeedbackDialog } from './FeedbackDialog';

describe('FeedbackDialog', () => {
  const defaultProps = {
    open: true,
    question: 'How was the voice intake experience?',
    tags: ['Easy to use', 'Accurate', 'Too slow'],
    onSubmit: vi.fn(),
    onSkip: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the question', () => {
    render(<FeedbackDialog {...defaultProps} />);
    expect(screen.getByText('How was the voice intake experience?')).toBeInTheDocument();
  });

  it('renders all tags as chips', () => {
    render(<FeedbackDialog {...defaultProps} />);
    defaultProps.tags.forEach(tag => {
      expect(screen.getByText(tag)).toBeInTheDocument();
    });
  });

  it('disables submit button when no rating is selected', () => {
    render(<FeedbackDialog {...defaultProps} />);
    expect(screen.getByRole('button', { name: /Submit & Continue/ })).toBeDisabled();
  });

  it('calls onSkip when skip button is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    render(<FeedbackDialog {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: /Skip/ }));
    expect(defaultProps.onSkip).toHaveBeenCalledOnce();
  });

  it('does not render when open is false', () => {
    const { container } = render(<FeedbackDialog {...defaultProps} open={false} />);
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });
});
