import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { WelcomeCard } from './WelcomeCard';

const DISMISSED_KEY = 'hq:welcome-dismissed';

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

function renderCard() {
  return render(
    <MemoryRouter>
      <WelcomeCard />
    </MemoryRouter>
  );
}

describe('WelcomeCard', () => {
  it('renders when localStorage key is not set', () => {
    renderCard();
    expect(screen.getByText('Welcome to HealthQ Copilot')).toBeInTheDocument();
  });

  it('does not render when localStorage key is set', () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    renderCard();
    expect(screen.queryByText('Welcome to HealthQ Copilot')).not.toBeInTheDocument();
  });

  it('dismiss button hides the card and sets localStorage', async () => {
    const user = userEvent.setup({ delay: null });
    renderCard();
    const dismissBtn = screen.getByLabelText('Dismiss welcome card');
    await user.click(dismissBtn);
    expect(screen.queryByText('Welcome to HealthQ Copilot')).not.toBeInTheDocument();
    expect(localStorage.getItem(DISMISSED_KEY)).toBe('1');
  });

  it('renders all 5 quick action links', () => {
    renderCard();
    expect(screen.getByText('Review Triage Queue')).toBeInTheDocument();
    expect(screen.getByText('Manage Scheduling')).toBeInTheDocument();
    expect(screen.getByText('Population Health')).toBeInTheDocument();
    expect(screen.getByText('Revenue Cycle')).toBeInTheDocument();
    expect(screen.getByText('AI Governance')).toBeInTheDocument();
  });

  it('renders "Get started" checklist steps', () => {
    renderCard();
    expect(screen.getByText(/Review your AI triage queue/i)).toBeInTheDocument();
    expect(screen.getByText(/high-risk patient population/i)).toBeInTheDocument();
    expect(screen.getByText(/revenue cycle denials/i)).toBeInTheDocument();
  });

  it('shows Ctrl+K keyboard shortcut hint', () => {
    renderCard();
    expect(screen.getByText(/Ctrl\+K/i)).toBeInTheDocument();
  });
});
