import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  VoiceSessionController,
  getApprovedTranscriptForSubmission,
  getMicrophoneFallbackMessage,
  getPcmWorkletModuleCandidates,
  normalizeTranscriptForReview,
} from './VoiceSessionController';

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

afterEach(() => {
  vi.unstubAllGlobals();
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

  it('requires transcript review before enabling AI submission and re-requires after transcript edits', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockRejectedValue(new Error('offline'));
    vi.stubGlobal('fetch', fetchMock);

    render(<VoiceSessionController />);

    await user.click(screen.getByRole('button', { name: 'Start Session' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Record Audio' })).toBeInTheDocument();
    });

    const transcriptInput = screen.getByPlaceholderText(/Patient reports chest pain, shortness of breath/i);
    await user.type(transcriptInput, 'Patient reports chest pressure and palpitations.');

    const gatedSubmitButton = screen.getByRole('button', { name: /Review transcript to submit/i });
    expect(gatedSubmitButton).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Mark Transcript Reviewed' }));

    const readySubmitButton = screen.getByRole('button', { name: 'Submit for AI Triage' });
    expect(readySubmitButton).toBeEnabled();

    await user.type(transcriptInput, ' Dizziness now present.');

    expect(screen.getByText(/Transcript changed after approval/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Review transcript to submit/i })).toBeDisabled();
  });

  it('submits the approved reviewed transcript snapshot', async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ ok: true, json: async () => ({ accepted: true }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          assignedLevel: 'P3_Standard',
          agentReasoning: 'Clinical indicators are stable and suitable for standard triage flow.',
        }),
      });

    vi.stubGlobal('fetch', fetchMock);

    render(<VoiceSessionController />);

    await user.click(screen.getByRole('button', { name: 'Start Session' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Record Audio' })).toBeInTheDocument();
    });

    const transcriptInput = screen.getByPlaceholderText(/Patient reports chest pain, shortness of breath/i);
    await user.type(transcriptInput, 'Patient reports chest pain');

    await user.click(screen.getByRole('button', { name: 'Mark Transcript Reviewed' }));
    await user.type(transcriptInput, '   ');

    await user.click(screen.getByRole('button', { name: 'Submit for AI Triage' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    const transcriptPayload = JSON.parse(String((fetchMock.mock.calls[1]?.[1] as { body?: string })?.body));
    const triagePayload = JSON.parse(String((fetchMock.mock.calls[2]?.[1] as { body?: string })?.body));

    expect(transcriptPayload.transcriptText).toBe('Patient reports chest pain');
    expect(triagePayload.transcriptText).toBe('Patient reports chest pain');
  });

  it('keeps transcript reviewed when only whitespace changes after approval', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockRejectedValue(new Error('offline'));
    vi.stubGlobal('fetch', fetchMock);

    render(<VoiceSessionController />);

    await user.click(screen.getByRole('button', { name: 'Start Session' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Record Audio' })).toBeInTheDocument();
    });

    const transcriptInput = screen.getByPlaceholderText(/Patient reports chest pain, shortness of breath/i);
    await user.type(transcriptInput, 'Patient reports chest pain');
    await user.click(screen.getByRole('button', { name: 'Mark Transcript Reviewed' }));

    expect(screen.getByRole('button', { name: 'Submit for AI Triage' })).toBeEnabled();

    await user.type(transcriptInput, '   ');

    expect(screen.getByRole('button', { name: 'Submit for AI Triage' })).toBeEnabled();
    expect(screen.queryByText(/Transcript changed after approval/i)).not.toBeInTheDocument();
  });

  it('disables transcript editing while AI submission is in progress', async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ ok: true, json: async () => ({ accepted: true }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          assignedLevel: 'P2_Urgent',
          agentReasoning: 'Urgent follow-up is recommended based on symptom progression.',
        }),
      });

    vi.stubGlobal('fetch', fetchMock);

    render(<VoiceSessionController />);

    await user.click(screen.getByRole('button', { name: 'Start Session' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Record Audio' })).toBeInTheDocument();
    });

    const transcriptInput = screen.getByPlaceholderText(/Patient reports chest pain, shortness of breath/i);
    await user.type(transcriptInput, 'Patient reports worsening dyspnea.');
    await user.click(screen.getByRole('button', { name: 'Mark Transcript Reviewed' }));
    await user.click(screen.getByRole('button', { name: 'Submit for AI Triage' }));

    await waitFor(() => {
      expect(transcriptInput).toBeDisabled();
    });
  });
});

describe('getMicrophoneFallbackMessage', () => {
  it('maps worklet module failures to a friendly message', () => {
    const message = getMicrophoneFallbackMessage(new Error("Unable to load a worklet's module."));

    expect(message).toMatch(/failed to load/i);
    expect(message).toMatch(/refresh the page/i);
  });

  it('maps blocked microphone permissions to a guidance message', () => {
    const message = getMicrophoneFallbackMessage({ name: 'NotAllowedError', message: 'Permission denied' });

    expect(message).toMatch(/permission is blocked/i);
  });

  it('returns a generic fallback for unknown errors', () => {
    const message = getMicrophoneFallbackMessage({});

    expect(message).toMatch(/temporarily unavailable/i);
  });

  it('maps missing microphone devices to a specific message', () => {
    const message = getMicrophoneFallbackMessage({
      name: 'NotFoundError',
      message: 'Requested device not found',
    });

    expect(message).toMatch(/no microphone device/i);
  });

  it('maps busy microphone devices to a recovery message', () => {
    const message = getMicrophoneFallbackMessage({
      name: 'NotReadableError',
      message: 'Could not start audio source',
    });

    expect(message).toMatch(/microphone is busy/i);
  });

  it('maps secure-context requirements to an https message', () => {
    const message = getMicrophoneFallbackMessage(new Error('Microphone access requires a secure context over HTTPS.'));

    expect(message).toMatch(/secure https connection/i);
  });
});

describe('getPcmWorkletModuleCandidates', () => {
  it('includes a public worklet fallback URL for the provided origin', () => {
    const candidates = getPcmWorkletModuleCandidates('https://voice.example.com');

    expect(candidates).toContain('https://voice.example.com/worklets/pcm-processor.js');
  });

  it('returns unique candidate URLs', () => {
    const candidates = getPcmWorkletModuleCandidates('https://voice.example.com/');

    expect(new Set(candidates).size).toBe(candidates.length);
  });
});

describe('normalizeTranscriptForReview', () => {
  it('trims leading and trailing whitespace', () => {
    const normalized = normalizeTranscriptForReview('   Patient reports chest pain   ');

    expect(normalized).toBe('Patient reports chest pain');
  });

  it('collapses internal whitespace for stable review snapshots', () => {
    const normalized = normalizeTranscriptForReview('Patient   reports\n\nchest\t pain');

    expect(normalized).toBe('Patient reports chest pain');
  });
});

describe('getApprovedTranscriptForSubmission', () => {
  it('prefers the reviewed transcript snapshot when present', () => {
    const transcript = getApprovedTranscriptForSubmission(
      'Patient reports chest pain and shortness of breath.',
      'Patient reports chest pain and shortness of breath.   ',
    );

    expect(transcript).toBe('Patient reports chest pain and shortness of breath.');
  });

  it('falls back to normalized transcript text when no snapshot exists', () => {
    const transcript = getApprovedTranscriptForSubmission(null, '  Patient   reports\nchest pain  ');

    expect(transcript).toBe('Patient reports chest pain');
  });
});
