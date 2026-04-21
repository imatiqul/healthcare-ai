import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { PatientPortal } from './PatientPortal';

expect.extend(toHaveNoViolations);

// Mock all child components and auth hooks
vi.mock('../auth/msalConfig', () => ({ b2cConfigured: false }));
vi.mock('../hooks/useAuthPatientId', () => ({
  useAuthPatientId: () => ({ patientId: null, loading: false, isAuthenticated: false }),
}));
vi.mock('./AppointmentHistory', () => ({
  AppointmentHistory: () => <div data-testid="appointment-history">Appointments</div>,
}));
vi.mock('./CareGapSummary', () => ({
  CareGapSummary: () => <div data-testid="care-gap-summary">Care Gaps</div>,
}));
vi.mock('./NotificationInbox', () => ({
  NotificationInbox: () => <div data-testid="notification-inbox">Notifications</div>,
}));
vi.mock('./PriorAuthStatus', () => ({
  PriorAuthStatus: () => <div data-testid="prior-auth-status">Prior Auth</div>,
}));
vi.mock('./PatientRegistrationForm', () => ({
  PatientRegistrationForm: () => <div data-testid="registration-form">Registration</div>,
}));
vi.mock('./AuthStatus', () => ({
  AuthStatus: () => null,
}));

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('PatientPortal', () => {
  it('renders the patient ID input and load button', () => {
    render(<PatientPortal />);
    expect(screen.getByRole('button', { name: /load/i })).toBeInTheDocument();
  });

  it('populates and loads when patientId prop is provided', async () => {
    render(<PatientPortal patientId="PAT-001" />);
    await waitFor(() => {
      expect(screen.getByTestId('appointment-history')).toBeInTheDocument();
    });
  });

  it('shows tabs: Appointments, Care Gaps, Notifications, Prior Authorizations', async () => {
    render(<PatientPortal patientId="PAT-001" />);
    await waitFor(() => screen.getByTestId('appointment-history'));

    expect(screen.getByRole('tab', { name: /appointments/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /care gaps/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /notifications/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /prior auth/i })).toBeInTheDocument();
  });

  it('switches tab content when a tab is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    render(<PatientPortal patientId="PAT-001" />);
    await waitFor(() => screen.getByTestId('appointment-history'));

    await user.click(screen.getByRole('tab', { name: /notifications/i }));
    expect(screen.getByTestId('notification-inbox')).toBeInTheDocument();
  });

  it('loads patient data when Load button is clicked with manual input', async () => {
    const user = userEvent.setup({ delay: null });
    render(<PatientPortal />);

    // Find the patient ID text field (it has a placeholder or label)
    const input = screen.getByRole('textbox');
    await user.type(input, 'PAT-999');
    await user.click(screen.getByRole('button', { name: /load/i }));

    await waitFor(() => {
      expect(screen.getByTestId('appointment-history')).toBeInTheDocument();
    });
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<main><PatientPortal /></main>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
