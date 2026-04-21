import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PractitionerManager from './PractitionerManager';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const PRACTITIONERS = [
  {
    id: 'prac-001',
    practitionerId: 'NPI-123456',
    name: 'Dr. Alice Morgan',
    specialty: 'Cardiology',
    email: 'alice.morgan@clinic.org',
    availabilityStart: '08:00',
    availabilityEnd: '16:00',
    timeZoneId: 'America/Chicago',
    isActive: true,
  },
  {
    id: 'prac-002',
    practitionerId: 'NPI-789012',
    name: 'Dr. Ben Carter',
    specialty: 'Radiology',
    email: 'ben.carter@clinic.org',
    availabilityStart: '09:00',
    availabilityEnd: '17:00',
    timeZoneId: 'UTC',
    isActive: false,
  },
];

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(PRACTITIONERS),
  });
});

describe('PractitionerManager', () => {
  it('renders the page heading', async () => {
    render(<PractitionerManager />);
    expect(screen.getByText('Practitioner Management')).toBeInTheDocument();
    await waitFor(() => screen.getByText('Dr. Alice Morgan'));
  });

  it('fetches active practitioners on mount', async () => {
    render(<PractitionerManager />);
    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('activeOnly=true'),
    ));
  });

  it('displays practitioner names and specialties', async () => {
    render(<PractitionerManager />);
    await waitFor(() => screen.getByText('Dr. Alice Morgan'));
    expect(screen.getByText('Cardiology')).toBeInTheDocument();
    expect(screen.getByText('Dr. Ben Carter')).toBeInTheDocument();
  });

  it('shows Active badge for active practitioners', async () => {
    render(<PractitionerManager />);
    await waitFor(() => screen.getByText('Dr. Alice Morgan'));
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('opens Add Practitioner dialog on button click', async () => {
    render(<PractitionerManager />);
    await waitFor(() => screen.getByText('+ Add Practitioner'));
    fireEvent.click(screen.getByText('+ Add Practitioner'));
    expect(screen.getByText('Add Practitioner')).toBeInTheDocument();
  });

  it('calls POST when creating a new practitioner', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(PRACTITIONERS) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: 'prac-003' }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(PRACTITIONERS) });

    render(<PractitionerManager />);
    await waitFor(() => screen.getByText('+ Add Practitioner'));
    fireEvent.click(screen.getByText('+ Add Practitioner'));

    // Wait for dialog to open and fields to be in the DOM
    await waitFor(() => screen.getByRole('textbox', { name: /ID.*NPI/i }));
    fireEvent.change(screen.getByRole('textbox', { name: /ID.*NPI/i }), { target: { value: 'NPI-999' } });
    fireEvent.change(screen.getByRole('textbox', { name: /Full Name/i }), { target: { value: 'Dr. New Doc' } });
    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/scheduling/practitioners/'),
      expect.objectContaining({ method: 'POST' }),
    ));
  });

  it('shows error alert on fetch failure', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    render(<PractitionerManager />);
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByText(/HTTP 500/)).toBeInTheDocument();
  });

  it('refetches with activeOnly=false when Show inactive is toggled', async () => {
    render(<PractitionerManager />);
    await waitFor(() => screen.getByText('Dr. Alice Morgan'));

    fireEvent.click(screen.getByRole('checkbox', { hidden: true }));

    await waitFor(() => expect(mockFetch).toHaveBeenLastCalledWith(
      expect.stringContaining('activeOnly=false'),
    ));
  });

  it('opens Edit dialog with practitioner data pre-filled', async () => {
    render(<PractitionerManager />);
    await waitFor(() => screen.getByText('Dr. Alice Morgan'));

    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    expect(screen.getByText('Edit Practitioner')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Dr. Alice Morgan')).toBeInTheDocument();
  });
});
