import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReportsExportPanel from './ReportsExportPanel';

const mockFetch = vi.fn();
global.fetch = mockFetch;

// Polyfill URL object APIs for Vitest/jsdom
Object.defineProperty(global.URL, 'createObjectURL', { value: vi.fn(() => 'blob:mock-url'), writable: true });
Object.defineProperty(global.URL, 'revokeObjectURL', { value: vi.fn(), writable: true });

// Intercept only <a> element clicks so no real navigation happens
const anchorClickSpy = vi.fn();
const origCreateElement = document.createElement.bind(document);
vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
  if (tag === 'a') {
    const el = origCreateElement('a') as HTMLAnchorElement;
    el.click = anchorClickSpy;
    return el;
  }
  return origCreateElement(tag);
});

beforeEach(() => {
  mockFetch.mockReset();
  anchorClickSpy.mockReset();
  mockFetch.mockResolvedValue({
    ok: true,
    blob: () => Promise.resolve(new Blob(['col1,col2\nval1,val2'], { type: 'text/csv' })),
    json: () => Promise.resolve([]),
  });
});

describe('ReportsExportPanel', () => {
  it('renders the page heading', () => {
    render(<ReportsExportPanel />);
    expect(screen.getByText('Reports & Data Export')).toBeInTheDocument();
  });

  it('renders all report domain sections', () => {
    render(<ReportsExportPanel />);
    // Domain names appear as CardTitle headings (use getAllByText since they also appear as Chips)
    expect(screen.getAllByText('Security & Compliance').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Population Health').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Revenue Cycle').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Notifications').length).toBeGreaterThanOrEqual(1);
  });

  it('renders individual report labels', () => {
    render(<ReportsExportPanel />);
    expect(screen.getByText('Audit Log Export')).toBeInTheDocument();
    expect(screen.getByText('Patient Risk Report')).toBeInTheDocument();
    expect(screen.getByText('Denial Analytics Report')).toBeInTheDocument();
  });

  it('shows Download buttons for each report', () => {
    render(<ReportsExportPanel />);
    const buttons = screen.getAllByRole('button', { name: /Download/i });
    expect(buttons.length).toBeGreaterThanOrEqual(6);
  });

  it('calls fetch with correct endpoint on Audit Log download', async () => {
    render(<ReportsExportPanel />);
    const downloadBtn = screen.getAllByRole('button', { name: /Download Audit Log Export/i })[0];
    fireEvent.click(downloadBtn);
    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/admin/audit/export'),
      expect.any(Object),
    ));
  });

  it('shows success alert after successful download', async () => {
    render(<ReportsExportPanel />);
    const downloadBtn = screen.getAllByRole('button', { name: /Download Audit Log Export/i })[0];
    fireEvent.click(downloadBtn);
    await waitFor(() =>
      expect(screen.getByText(/Audit Log Export downloaded successfully/)).toBeInTheDocument(),
    );
  });

  it('shows error alert when download fails', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 503 });
    render(<ReportsExportPanel />);
    const downloadBtn = screen.getAllByRole('button', { name: /Download Audit Log Export/i })[0];
    fireEvent.click(downloadBtn);
    await waitFor(() =>
      expect(screen.getByText(/HTTP 503/)).toBeInTheDocument(),
    );
  });

  it('shows HIPAA retention notice at the bottom', () => {
    render(<ReportsExportPanel />);
    expect(screen.getByText(/7 years in Azure Key Vault/)).toBeInTheDocument();
  });
});
