import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthStatus } from './AuthStatus';

const mockLoginRedirect = vi.fn(() => Promise.resolve());
const mockLogoutRedirect = vi.fn(() => Promise.resolve());
const mockUseMsal = vi.fn();
const mockUseIsAuthenticated = vi.fn();

vi.mock('@azure/msal-react', () => ({
  useMsal: () => mockUseMsal(),
  useIsAuthenticated: () => mockUseIsAuthenticated(),
}));

beforeEach(() => {
  mockLoginRedirect.mockClear();
  mockLogoutRedirect.mockClear();
  mockUseMsal.mockReturnValue({
    instance: { loginRedirect: mockLoginRedirect, logoutRedirect: mockLogoutRedirect },
    accounts: [],
  });
  mockUseIsAuthenticated.mockReturnValue(false);
});

describe('AuthStatus — unauthenticated', () => {
  it('renders a Sign in button when not authenticated', () => {
    render(<AuthStatus />);
    expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument();
  });

  it('calls loginRedirect when Sign in is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    render(<AuthStatus />);
    await user.click(screen.getByRole('button', { name: /Sign in/i }));
    expect(mockLoginRedirect).toHaveBeenCalledTimes(1);
  });
});

describe('AuthStatus — authenticated', () => {
  beforeEach(() => {
    mockUseMsal.mockReturnValue({
      instance: { loginRedirect: mockLoginRedirect, logoutRedirect: mockLogoutRedirect },
      accounts: [{ name: 'Jane Patient', username: 'jane@healthq.io' }],
    });
    mockUseIsAuthenticated.mockReturnValue(true);
  });

  it('shows user display name when authenticated', () => {
    render(<AuthStatus />);
    expect(screen.getByText('Jane Patient')).toBeInTheDocument();
  });

  it('shows Sign out button when authenticated', () => {
    render(<AuthStatus />);
    expect(screen.getByRole('button', { name: /Sign out/i })).toBeInTheDocument();
  });

  it('calls logoutRedirect when Sign out is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    render(<AuthStatus />);
    await user.click(screen.getByRole('button', { name: /Sign out/i }));
    expect(mockLogoutRedirect).toHaveBeenCalledTimes(1);
  });
});
