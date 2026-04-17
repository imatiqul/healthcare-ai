import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BookingForm } from './BookingForm';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('BookingForm', () => {
  it('renders the booking card header', () => {
    render(<BookingForm />);
    expect(screen.getByText('Book Appointment', { selector: 'h3,h4,span' })).toBeInTheDocument();
  });

  it('renders all input fields', () => {
    render(<BookingForm />);
    expect(screen.getByPlaceholderText('Select a slot')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Patient ID')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Practitioner ID')).toBeInTheDocument();
  });

  it('renders the submit button', () => {
    render(<BookingForm />);
    expect(screen.getByRole('button', { name: 'Book Appointment' })).toBeInTheDocument();
  });
});
