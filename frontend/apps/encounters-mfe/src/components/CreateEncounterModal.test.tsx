import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { CreateEncounterModal } from './CreateEncounterModal';

expect.extend(toHaveNoViolations);

const defaultProps = {
  patientId: 'PAT-123',
  onClose: vi.fn(),
  onCreated: vi.fn(),
};

beforeEach(() => {
  vi.restoreAllMocks();
  defaultProps.onClose.mockClear();
  defaultProps.onCreated.mockClear();
});

describe('CreateEncounterModal', () => {
  it('renders the modal with form fields', () => {
    render(<CreateEncounterModal {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/class/i)).toBeInTheDocument();
  });

  it('submits a new encounter and calls onCreated', async () => {
    const user = userEvent.setup({ delay: null });
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 'enc-new', resourceType: 'Encounter' }) })
    ) as unknown as typeof fetch;

    render(<CreateEncounterModal {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => expect(defaultProps.onCreated).toHaveBeenCalledTimes(1));
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/fhir/encounters'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('shows an error message when submit fails', async () => {
    const user = userEvent.setup({ delay: null });
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: false, status: 422, text: () => Promise.resolve('Unprocessable Entity') })
    ) as unknown as typeof fetch;

    render(<CreateEncounterModal {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(screen.getByText(/http 422/i)).toBeInTheDocument();
    });
    expect(defaultProps.onCreated).not.toHaveBeenCalled();
  });

  it('prepends Patient/ prefix when patientId lacks it', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    ) as unknown as typeof fetch;

    const user = userEvent.setup({ delay: null });
    render(<CreateEncounterModal {...defaultProps} patientId="PAT-456" />);
    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const body = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.subject.reference).toBe('Patient/PAT-456');
  });

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    render(<CreateEncounterModal {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('has no accessibility violations', async () => {
    render(<CreateEncounterModal {...defaultProps} />);
    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });
});
