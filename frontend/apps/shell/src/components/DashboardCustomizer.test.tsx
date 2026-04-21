import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardCustomizer, loadVisibleSections, ALL_SECTIONS } from './DashboardCustomizer';

// ── localStorage helpers ──────────────────────────────────────────────────────

const STORAGE_KEY = 'hq:dashboard-sections';

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

function renderCustomizer(onChange = vi.fn()) {
  return render(<DashboardCustomizer onChange={onChange} />);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('DashboardCustomizer', () => {
  it('renders the customize icon button', () => {
    renderCustomizer();
    expect(screen.getByRole('button', { name: 'Customize dashboard' })).toBeInTheDocument();
  });

  it('opens popover on button click', () => {
    renderCustomizer();
    fireEvent.click(screen.getByRole('button', { name: 'Customize dashboard' }));
    expect(screen.getByText('Customize Dashboard')).toBeInTheDocument();
  });

  it('shows all four section checkboxes', () => {
    renderCustomizer();
    fireEvent.click(screen.getByRole('button', { name: 'Customize dashboard' }));
    expect(screen.getByLabelText('Clinical')).toBeInTheDocument();
    expect(screen.getByLabelText('Scheduling')).toBeInTheDocument();
    expect(screen.getByLabelText('Population Health')).toBeInTheDocument();
    expect(screen.getByLabelText('Revenue Cycle')).toBeInTheDocument();
  });

  it('all checkboxes checked by default (no storage)', () => {
    renderCustomizer();
    fireEvent.click(screen.getByRole('button', { name: 'Customize dashboard' }));
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach(cb => expect((cb as HTMLInputElement).checked).toBe(true));
  });

  it('unchecking a section calls onChange with updated list', () => {
    const onChange = vi.fn();
    renderCustomizer(onChange);
    fireEvent.click(screen.getByRole('button', { name: 'Customize dashboard' }));
    fireEvent.click(screen.getByLabelText('Revenue Cycle'));
    expect(onChange).toHaveBeenCalledWith(
      expect.not.arrayContaining(['revenue'])
    );
  });

  it('persists changes to localStorage', () => {
    renderCustomizer();
    fireEvent.click(screen.getByRole('button', { name: 'Customize dashboard' }));
    fireEvent.click(screen.getByLabelText('Scheduling'));
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    expect(stored).not.toContain('scheduling');
  });

  it('re-checking a section adds it back', () => {
    const onChange = vi.fn();
    renderCustomizer(onChange);
    fireEvent.click(screen.getByRole('button', { name: 'Customize dashboard' }));
    // Uncheck then re-check Scheduling
    fireEvent.click(screen.getByLabelText('Scheduling'));
    fireEvent.click(screen.getByLabelText('Scheduling'));
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall).toContain('scheduling');
  });

  it('does not allow unchecking the last visible section', () => {
    // Pre-seed with only one section visible
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['clinical']));
    const onChange = vi.fn();
    renderCustomizer(onChange);
    fireEvent.click(screen.getByRole('button', { name: 'Customize dashboard' }));
    fireEvent.click(screen.getByLabelText('Clinical')); // Try to uncheck last one
    // onChange must still be called with ['clinical'] — the minimum is preserved
    expect(onChange).toHaveBeenCalledWith(['clinical']);
  });
});

// ── loadVisibleSections tests ─────────────────────────────────────────────────

describe('loadVisibleSections', () => {
  it('returns all sections when nothing stored', () => {
    const sections = loadVisibleSections();
    expect(sections).toEqual([...ALL_SECTIONS]);
  });

  it('returns stored subset', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['clinical', 'revenue']));
    const sections = loadVisibleSections();
    expect(sections).toEqual(['clinical', 'revenue']);
  });

  it('returns all sections when stored value is corrupted', () => {
    localStorage.setItem(STORAGE_KEY, 'not-json{{{');
    const sections = loadVisibleSections();
    expect(sections).toEqual([...ALL_SECTIONS]);
  });

  it('returns all sections when stored array is empty', () => {
    localStorage.setItem(STORAGE_KEY, '[]');
    const sections = loadVisibleSections();
    expect(sections).toEqual([...ALL_SECTIONS]);
  });
});
