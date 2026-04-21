import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { OfflineIndicator } from './OfflineIndicator';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('OfflineIndicator', () => {
  const originalOnLine = Object.getOwnPropertyDescriptor(navigator, 'onLine');

  function setOnline(value: boolean) {
    Object.defineProperty(navigator, 'onLine', { value, configurable: true });
  }

  afterEach(() => {
    if (originalOnLine) {
      Object.defineProperty(navigator, 'onLine', originalOnLine);
    }
  });

  it('renders nothing when online', () => {
    setOnline(true);
    const { container } = render(<OfflineIndicator />);
    // Collapse is mounted but content is hidden — testid should not be visible
    expect(screen.queryByTestId('offline-indicator')).not.toBeInTheDocument();
  });

  it('renders offline banner when navigator.onLine is false on mount', () => {
    setOnline(false);
    render(<OfflineIndicator />);
    expect(screen.getByTestId('offline-indicator')).toBeInTheDocument();
    expect(screen.getByText(/you are offline/i)).toBeInTheDocument();
  });

  it('shows banner when offline event fires', async () => {
    setOnline(true);
    render(<OfflineIndicator />);
    expect(screen.queryByTestId('offline-indicator')).not.toBeInTheDocument();

    await act(async () => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(screen.getByTestId('offline-indicator')).toBeInTheDocument();
  });

  it('hides banner when online event fires after going offline', async () => {
    setOnline(false);
    render(<OfflineIndicator />);
    expect(screen.getByTestId('offline-indicator')).toBeInTheDocument();

    await act(async () => {
      window.dispatchEvent(new Event('online'));
    });

    expect(screen.queryByTestId('offline-indicator')).not.toBeInTheDocument();
  });

  it('displays the offline message text', () => {
    setOnline(false);
    render(<OfflineIndicator />);
    expect(screen.getByText(/some features may be unavailable/i)).toBeInTheDocument();
  });
});
