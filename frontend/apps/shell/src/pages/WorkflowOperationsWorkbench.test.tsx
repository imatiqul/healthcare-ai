import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import WorkflowOperationsWorkbench from './WorkflowOperationsWorkbench';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const SUMMARY_RESPONSE = {
  total: 9,
  awaitingHumanReview: 2,
  attentionRequired: 3,
  bookedToday: 4,
  waitlistFallbacks: 1,
  reviewOverdue: 1,
  averageReviewMinutes: 12.5,
  automationCompletionRate: 0.75,
  autoBooked: 3,
  manualBooked: 1,
};

const WORKFLOW_RESPONSE = [
  {
    id: 'wf-1',
    sessionId: 'sess-1',
    patientId: 'pat-1',
    patientName: 'Jamie Carter',
    status: 'AwaitingHumanReview',
    triageLevel: 'P2_Urgent',
    requiresAttention: true,
    reviewOverdue: true,
    latestExceptionCode: 'REVIEW_SLA',
    latestExceptionMessage: 'Workflow review SLA has expired.',
    encounterStatus: 'Completed',
    revenueStatus: 'Completed',
    schedulingStatus: 'Pending',
    notificationStatus: 'Pending',
    lastActivityAt: new Date().toISOString(),
  },
  {
    id: 'wf-2',
    sessionId: 'sess-2',
    patientId: 'pat-2',
    patientName: 'Taylor Brooks',
    status: 'Completed',
    triageLevel: 'P3_Standard',
    schedulingStatus: 'NeedsAttention',
    waitlistQueuedAt: new Date().toISOString(),
    encounterStatus: 'Completed',
    revenueStatus: 'Completed',
    notificationStatus: 'Completed',
    lastActivityAt: new Date().toISOString(),
  },
];

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockImplementation((url: string) => {
    if (url.includes('/agents/workflows/summary')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(SUMMARY_RESPONSE) });
    }

    if (url.includes('/agents/workflows?top=80')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(WORKFLOW_RESPONSE) });
    }

    return Promise.reject(new Error(`Unhandled URL ${url}`));
  });
});

describe('WorkflowOperationsWorkbench', () => {
  it('renders the supervisor workbench heading', async () => {
    render(
      <MemoryRouter>
        <WorkflowOperationsWorkbench />
      </MemoryRouter>,
    );

    expect(screen.getByText('Workflow Operations Workbench')).toBeInTheDocument();
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
  });

  it('shows workflow summary cards from the API', async () => {
    render(
      <MemoryRouter>
        <WorkflowOperationsWorkbench />
      </MemoryRouter>,
    );

    await waitFor(() => screen.getByText('Attention Required'));
    expect(screen.getByText('Awaiting Human Review')).toBeInTheDocument();
    expect(screen.getByText('Automation Health')).toBeInTheDocument();
    expect(screen.getByText('75.0%')).toBeInTheDocument();
  });

  it('renders attention queue items from the workflow endpoint', async () => {
    render(
      <MemoryRouter>
        <WorkflowOperationsWorkbench />
      </MemoryRouter>,
    );

    await waitFor(() => screen.getByText('Jamie Carter'));
    expect(screen.getByText('Workflow review SLA has expired.')).toBeInTheDocument();
    expect(screen.getAllByText('Review in Triage').length).toBeGreaterThan(0);
  });
});