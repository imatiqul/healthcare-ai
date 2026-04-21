import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SessionExpiryGuard } from './SessionExpiryGuard';

// SessionExpiryGuard uses only MUI — no design-system mock needed

const mockSignIn  = vi.fn();
const mockSignOut = vi.fn();

vi.mock('@healthcare/auth-client', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '@healthcare/auth-client';
const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

function nowPlusSecs(s: number) {
  return Math.floor(Date.now() / 1000) + s;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAuth.mockReturnValue({
    session:         null,
    isAuthenticated: false,
    signIn:          mockSignIn,
    signOut:         mockSignOut,
  });
});

function renderGuard() {
  return render(
    <MemoryRouter>
      <SessionExpiryGuard />
    </MemoryRouter>
  );
}

describe('SessionExpiryGuard', () => {
  it('renders nothing when not authenticated', () => {
    const { container } = renderGuard();
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when session is null', () => {
    mockUseAuth.mockReturnValue({
      session: null, isAuthenticated: true, signIn: mockSignIn, signOut: mockSignOut,
    });
    const { container } = renderGuard();
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when session expiry is far in the future', () => {
    mockUseAuth.mockReturnValue({
      session: { exp: nowPlusSecs(3600), name: 'Test User' },
      isAuthenticated: true,
      signIn: mockSignIn,
      signOut: mockSignOut,
    });
    const { container } = renderGuard();
    expect(container.firstChild).toBeNull();
  });

  it('shows warning dialog when session expires within 5 minutes', () => {
    mockUseAuth.mockReturnValue({
      session: { exp: nowPlusSecs(60), name: 'Test User' },
      isAuthenticated: true,
      signIn: mockSignIn,
      signOut: mockSignOut,
    });
    renderGuard();
    expect(screen.getByText('Session Expiring Soon')).toBeInTheDocument();
    expect(screen.getByText(/expire in/i)).toBeInTheDocument();
  });

  it('shows correct singular minute text', () => {
    mockUseAuth.mockReturnValue({
      session: { exp: nowPlusSecs(45), name: 'Test User' },
      isAuthenticated: true,
      signIn: mockSignIn,
      signOut: mockSignOut,
    });
    renderGuard();
    // Math.ceil(45000 / 60000) = 1 → "1 minute" (singular)
    expect(screen.getByText(/1 minute\./i)).toBeInTheDocument();
  });

  it('shows Extend Session and Sign Out buttons', () => {
    mockUseAuth.mockReturnValue({
      session: { exp: nowPlusSecs(60), name: 'Test User' },
      isAuthenticated: true,
      signIn: mockSignIn,
      signOut: mockSignOut,
    });
    renderGuard();
    expect(screen.getByRole('button', { name: /extend session/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });

  it('calls signIn when Extend Session is clicked', () => {
    mockUseAuth.mockReturnValue({
      session: { exp: nowPlusSecs(60), name: 'Test User' },
      isAuthenticated: true,
      signIn: mockSignIn,
      signOut: mockSignOut,
    });
    renderGuard();
    fireEvent.click(screen.getByRole('button', { name: /extend session/i }));
    expect(mockSignIn).toHaveBeenCalledTimes(1);
  });

  it('calls signOut when Sign Out is clicked', () => {
    mockUseAuth.mockReturnValue({
      session: { exp: nowPlusSecs(60), name: 'Test User' },
      isAuthenticated: true,
      signIn: mockSignIn,
      signOut: mockSignOut,
    });
    renderGuard();
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });
});
