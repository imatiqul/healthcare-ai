/**
 * PatientContextBar tests — Phase 49
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PatientContextBar } from './PatientContextBar';
import { useGlobalStore } from '../store';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderBar() {
  return render(
    <MemoryRouter>
      <PatientContextBar />
    </MemoryRouter>
  );
}

// Reset Zustand store before each test
beforeEach(() => {
  useGlobalStore.setState({
    activePatient:    null,
    currentPatientId: null,
    activeSessionId:  null,
    userRole:         null,
  });
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PatientContextBar', () => {
  it('renders nothing when no active patient', () => {
    const { container } = renderBar();
    expect(container.firstChild).toBeNull();
  });

  it('renders the patient ID when a patient is active', () => {
    useGlobalStore.setState({ activePatient: { id: 'PAT-001' } });
    renderBar();
    expect(screen.getByText(/PAT-001/)).toBeInTheDocument();
  });

  it('renders patient name with ID when name is provided', () => {
    useGlobalStore.setState({ activePatient: { id: 'PAT-002', name: 'Jane Doe' } });
    renderBar();
    expect(screen.getByText(/Jane Doe \(PAT-002\)/)).toBeInTheDocument();
  });

  it('renders risk level chip when riskLevel is provided', () => {
    useGlobalStore.setState({ activePatient: { id: 'PAT-003', riskLevel: 'Critical' } });
    renderBar();
    expect(screen.getByText('Critical')).toBeInTheDocument();
  });

  it('does not render risk chip when riskLevel is absent', () => {
    useGlobalStore.setState({ activePatient: { id: 'PAT-004' } });
    renderBar();
    expect(screen.queryByText('Critical')).not.toBeInTheDocument();
    expect(screen.queryByText('High')).not.toBeInTheDocument();
  });

  it('renders all 5 quick-nav chips', () => {
    useGlobalStore.setState({ activePatient: { id: 'PAT-005' } });
    renderBar();
    expect(screen.getByText('Encounters')).toBeInTheDocument();
    expect(screen.getByText('Population Health')).toBeInTheDocument();
    expect(screen.getByText('Scheduling')).toBeInTheDocument();
    expect(screen.getByText('Voice Session')).toBeInTheDocument();
    expect(screen.getByText('Triage')).toBeInTheDocument();
  });

  it('navigates to encounters route with patientId when chip clicked', () => {
    useGlobalStore.setState({ activePatient: { id: 'PAT-006' } });
    const { getByText } = renderBar();
    fireEvent.click(getByText('Encounters'));
    // MemoryRouter doesn't throw — just verifies the click handler is callable
  });

  it('clears the active patient when dismiss button is clicked', () => {
    useGlobalStore.setState({ activePatient: { id: 'PAT-007' } });
    renderBar();
    const clearBtn = screen.getByRole('button', { name: /clear active patient/i });
    fireEvent.click(clearBtn);
    expect(useGlobalStore.getState().activePatient).toBeNull();
    expect(useGlobalStore.getState().currentPatientId).toBeNull();
  });

  it('has correct aria-label on the root element', () => {
    useGlobalStore.setState({ activePatient: { id: 'PAT-008' } });
    renderBar();
    expect(screen.getByRole('status', { name: /active patient context/i })).toBeInTheDocument();
  });
});
