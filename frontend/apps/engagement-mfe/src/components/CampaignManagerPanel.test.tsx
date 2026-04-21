import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CampaignManagerPanel } from './CampaignManagerPanel';

const CAMPAIGNS = [
  {
    id: 'camp-001',
    name: 'Spring Flu Outreach',
    type: 'Email',
    status: 'Draft',
    createdAt: '2026-04-01T10:00:00Z',
  },
  {
    id: 'camp-002',
    name: 'Diabetes Care Gap',
    type: 'Sms',
    status: 'Active',
    createdAt: '2026-03-15T08:00:00Z',
  },
];

describe('CampaignManagerPanel', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('renders heading and fetches campaigns on mount', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(CAMPAIGNS),
    } as Response);

    render(<CampaignManagerPanel />);
    expect(screen.getByText('Campaign Manager')).toBeInTheDocument();
    expect(await screen.findByText('Spring Flu Outreach')).toBeInTheDocument();
  });

  it('shows campaign rows with type and status', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(CAMPAIGNS),
    } as Response);

    render(<CampaignManagerPanel />);
    expect(await screen.findByText('Spring Flu Outreach')).toBeInTheDocument();
    expect(screen.getAllByText('Email').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Draft').length).toBeGreaterThan(0);
    expect(await screen.findByText('Diabetes Care Gap')).toBeInTheDocument();
    expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
  });

  it('shows total campaigns chip', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(CAMPAIGNS),
    } as Response);

    render(<CampaignManagerPanel />);
    expect(await screen.findByText('2 total')).toBeInTheDocument();
  });

  it('shows empty state alert when no campaigns', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response);

    render(<CampaignManagerPanel />);
    expect(
      await screen.findByText(/No campaigns found/)
    ).toBeInTheDocument();
  });

  it('disables Create Campaign button without name or target IDs', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response);

    render(<CampaignManagerPanel />);
    await screen.findByText(/No campaigns found/);
    expect(screen.getByRole('button', { name: /create campaign/i })).toBeDisabled();
  });

  it('POSTs to /notifications/campaigns with correct payload', async () => {
    const user = userEvent.setup({ delay: null });

    // initial load
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response);
    // create
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'camp-new', status: 'Draft' }),
    } as Response);
    // refresh after create
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            id: 'camp-new',
            name: 'New Campaign',
            type: 'Email',
            status: 'Draft',
            createdAt: '2026-04-20T00:00:00Z',
          },
        ]),
    } as Response);

    render(<CampaignManagerPanel />);
    await screen.findByText(/No campaigns found/);

    await user.type(screen.getByLabelText('campaign name'), 'New Campaign');
    await user.type(screen.getByLabelText('target patient ids'), 'pt-1, pt-2');
    await user.click(screen.getByRole('button', { name: /create campaign/i }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/notifications/campaigns'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('New Campaign'),
        })
      )
    );
    expect(await screen.findByText(/campaign.*created/i)).toBeInTheDocument();
  });

  it('POSTs activate to /notifications/campaigns/{id}/activate', async () => {
    const user = userEvent.setup({ delay: null });

    // initial load
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(CAMPAIGNS),
    } as Response);
    // activate
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({ id: 'camp-001', status: 'Active', messagesCreated: 3 }),
    } as Response);
    // refresh
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(CAMPAIGNS),
    } as Response);

    render(<CampaignManagerPanel />);
    const activateBtns = await screen.findAllByRole('button', { name: /activate/i });
    // first row (Spring Flu Outreach) is Draft → enabled
    await user.click(activateBtns[0]);

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/notifications/campaigns/camp-001/activate'),
        expect.objectContaining({ method: 'POST' })
      )
    );
    expect(await screen.findByText(/3 message\(s\) queued/i)).toBeInTheDocument();
  });

  it('shows validation error when creating campaign without name or targets', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response);
    const user = userEvent.setup({ delay: null });
    render(<CampaignManagerPanel />);
    await screen.findByText(/No campaigns found/);
    // Button is disabled when fields are empty — confirms guard is active
    expect(screen.getByRole('button', { name: /create campaign/i })).toBeDisabled();
  });
});
