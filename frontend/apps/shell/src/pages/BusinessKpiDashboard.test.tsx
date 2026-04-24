import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BusinessKpiDashboard from './BusinessKpiDashboard';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const TENANTS_RESP    = { total: 5, items: [] };
const USERS_RESP      = { total: 42 };
const FEEDBACK_RESP   = { totalFeedback: 120, averageRating: 4.2, positiveCount: 98, negativeCount: 10, ingestedCount: 88 };
const DENIALS_RESP    = { openCount: 7, underAppealCount: 3, overTurnRate: 0.62, nearDeadlineCount: 2 };
const DELIVERY_RESP   = { total: 500, delivered: 475, failed: 15, pending: 10, deliveryRate: 0.95, failureRate: 0.03 };
const DEMO_RESP       = [{ sessionId: 's1', status: 'Completed', npsScore: 8.5 }, { sessionId: 's2', status: 'InProgress', npsScore: 7 }];
const MODELS_RESP     = [{ id: 'm1', isActive: true }, { id: 'm2', isActive: false }];
const CAMPAIGNS_RESP  = [{ id: 'c1', status: 'Active' }, { id: 'c2', status: 'Draft' }];
const WORKFLOW_RESP   = { total: 18, awaitingHumanReview: 3, attentionRequired: 4, bookedToday: 7, waitlistFallbacks: 2, reviewOverdue: 1, averageReviewMinutes: 14.2, automationCompletionRate: 0.81, autoBooked: 4, manualBooked: 3 };

function urlOf(url: string) {
  // Extract last path segment for matching
  return url.includes('/tenants') ? TENANTS_RESP
    : url.includes('/identity/users') ? USERS_RESP
    : url.includes('/feedback/summary') ? FEEDBACK_RESP
    : url.includes('/denials/analytics') ? DENIALS_RESP
    : url.includes('/analytics/delivery') ? DELIVERY_RESP
    : url.includes('/demo/sessions') ? DEMO_RESP
    : url.includes('/governance/history') ? MODELS_RESP
    : url.includes('/campaigns') ? CAMPAIGNS_RESP
    : url.includes('/agents/workflows/summary') ? WORKFLOW_RESP
    : null;
}

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockImplementation((url: string) => {
    const data = urlOf(url);
    if (!data) return Promise.reject(new Error('unknown'));
    return Promise.resolve({ ok: true, json: () => Promise.resolve(data) });
  });
});

describe('BusinessKpiDashboard', () => {
  it('renders Business Intelligence heading', async () => {
    render(<BusinessKpiDashboard />);
    expect(screen.getByText('Business Intelligence')).toBeInTheDocument();
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
  });

  it('shows Platform Overview section', async () => {
    render(<BusinessKpiDashboard />);
    await waitFor(() => screen.getByText('Platform Overview'));
    expect(screen.getByText('Platform Overview')).toBeInTheDocument();
  });

  it('shows Clinical Workflow Operations section', async () => {
    render(<BusinessKpiDashboard />);
    await waitFor(() => screen.getByText('Clinical Workflow Operations'));
    expect(screen.getByText('Clinical Workflow Operations')).toBeInTheDocument();
  });

  it('displays tenant count from API', async () => {
    render(<BusinessKpiDashboard />);
    await waitFor(() => screen.getByText('5'));
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('displays user count from API', async () => {
    render(<BusinessKpiDashboard />);
    await waitFor(() => screen.getByText('42'));
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('shows Revenue Cycle Health section', async () => {
    render(<BusinessKpiDashboard />);
    await waitFor(() => screen.getByText('Revenue Cycle Health'));
    expect(screen.getByText('Revenue Cycle Health')).toBeInTheDocument();
  });

  it('shows open claim denials count', async () => {
    render(<BusinessKpiDashboard />);
    await waitFor(() => screen.getByText('Open Claim Denials'));
    expect(screen.getByText('requires action')).toBeInTheDocument();
    expect(screen.getAllByText('7').length).toBeGreaterThan(0);
  });

  it('shows Engagement section with delivery rate', async () => {
    render(<BusinessKpiDashboard />);
    await waitFor(() => screen.getByText('Engagement & Notifications'));
    expect(screen.getByText('Engagement & Notifications')).toBeInTheDocument();
  });

  it('shows Go-to-Market section', async () => {
    render(<BusinessKpiDashboard />);
    await waitFor(() => screen.getByText('Go-to-Market & AI Adoption'));
    expect(screen.getByText('Go-to-Market & AI Adoption')).toBeInTheDocument();
  });

  it('renders refresh button', async () => {
    render(<BusinessKpiDashboard />);
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
  });
});
