import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VoiceSessionController } from './VoiceSessionController';

vi.mock('@microsoft/signalr', () => ({
  HubConnectionBuilder: vi.fn(() => ({
    withUrl: vi.fn().mockReturnThis(),
    withAutomaticReconnect: vi.fn().mockReturnThis(),
    configureLogging: vi.fn().mockReturnThis(),
    build: vi.fn(() => ({
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(),
      off: vi.fn(),
      state: 'Disconnected',
    })),
  })),
  LogLevel: { Warning: 3 },
}));

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('VoiceSessionController', () => {
  it('renders voice session card', () => {
    render(<VoiceSessionController />);
    expect(screen.getByText('Voice Session')).toBeInTheDocument();
  });

  it('shows Start Session and End Session buttons', () => {
    render(<VoiceSessionController />);
    expect(screen.getByText('Start Session')).toBeInTheDocument();
    expect(screen.getByText('End Session')).toBeInTheDocument();
  });

  it('Start Session is enabled in idle state', () => {
    render(<VoiceSessionController />);
    const startBtn = screen.getByText('Start Session');
    expect(startBtn.closest('button')).not.toBeDisabled();
  });

  it('End Session is disabled in idle state', () => {
    render(<VoiceSessionController />);
    const endBtn = screen.getByText('End Session');
    expect(endBtn.closest('button')).toBeDisabled();
  });
});
