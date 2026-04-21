import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { OnboardingWizard, ONBOARDING_KEY, isOnboardingComplete, markOnboardingComplete } from './OnboardingWizard';

vi.mock('@healthcare/design-system', () => ({
  SkeletonStatGrid: () => null,
}));

beforeEach(() => {
  localStorage.clear();
});

function renderWizard() {
  return render(
    <MemoryRouter>
      <OnboardingWizard />
    </MemoryRouter>
  );
}

describe('OnboardingWizard', () => {
  it('opens automatically when onboarding has not been completed', () => {
    renderWizard();
    expect(screen.getByLabelText('Onboarding wizard')).toBeInTheDocument();
    expect(screen.getByText('Welcome to HealthQ Copilot')).toBeInTheDocument();
  });

  it('does not open when onboarding key is already set', () => {
    markOnboardingComplete();
    renderWizard();
    // Dialog should not be open (no visible heading)
    expect(screen.queryByText('Welcome to HealthQ Copilot')).not.toBeInTheDocument();
  });

  it('advances to next step on Next click', () => {
    renderWizard();
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }));
    expect(screen.getByText('AI-Powered Clinical Triage')).toBeInTheDocument();
  });

  it('goes back to previous step on Back click', () => {
    renderWizard();
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }));
    fireEvent.click(screen.getByRole('button', { name: 'Previous step' }));
    expect(screen.getByText('Welcome to HealthQ Copilot')).toBeInTheDocument();
  });

  it('Back button is disabled on the first step', () => {
    renderWizard();
    expect(screen.getByRole('button', { name: 'Previous step' })).toBeDisabled();
  });

  it('Skip tour dismisses without marking complete when checkbox unchecked', () => {
    renderWizard();
    fireEvent.click(screen.getByRole('button', { name: 'Skip onboarding' }));
    // With conditional render, open=false means component returns null
    expect(screen.queryByLabelText('Onboarding wizard')).not.toBeInTheDocument();
    // key NOT persisted (checkbox was unchecked)
    expect(localStorage.getItem(ONBOARDING_KEY)).toBeNull();
  });

  it("Skip tour with 'Don't show again' marks onboarding complete", () => {
    renderWizard();
    // single checkbox in the dialog — toggle it then skip
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Skip onboarding' }));
    expect(isOnboardingComplete()).toBe(true);
  });

  it('isOnboardingComplete returns false when key is absent', () => {
    expect(isOnboardingComplete()).toBe(false);
  });

  it('markOnboardingComplete sets the key', () => {
    markOnboardingComplete();
    expect(isOnboardingComplete()).toBe(true);
  });
});
