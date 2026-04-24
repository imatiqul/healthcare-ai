const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

interface WorkflowIdentity {
  workflowId: string;
  patientId?: string;
  patientName?: string;
}

async function postWorkflowTransition(path: string, payload: Record<string, unknown>): Promise<void> {
  try {
    await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
    // The scheduling flow must continue even when the workflow backend is unavailable.
  }
}

export async function syncWorkflowReserve(
  workflow: WorkflowIdentity,
  payload: { slotId: string; patientId?: string; patientName?: string; practitionerId?: string },
): Promise<void> {
  await postWorkflowTransition(`/api/v1/agents/workflows/${workflow.workflowId}/reserve`, {
    slotId: payload.slotId,
    patientId: payload.patientId ?? workflow.patientId,
    patientName: payload.patientName ?? workflow.patientName,
    practitionerId: payload.practitionerId,
  });
}

export async function syncWorkflowBooked(
  workflow: WorkflowIdentity,
  payload: { slotId: string; patientId: string; patientName?: string; practitionerId?: string; bookingId?: string },
): Promise<void> {
  await postWorkflowTransition(`/api/v1/agents/workflows/${workflow.workflowId}/book`, {
    slotId: payload.slotId,
    patientId: payload.patientId,
    patientName: payload.patientName ?? workflow.patientName,
    practitionerId: payload.practitionerId,
    bookingId: payload.bookingId,
  });
}

export async function syncWorkflowWaitlist(
  workflow: WorkflowIdentity,
  payload: { patientId: string; patientName?: string; practitionerId?: string; priority?: number },
): Promise<void> {
  await postWorkflowTransition(`/api/v1/agents/workflows/${workflow.workflowId}/waitlist`, {
    patientId: payload.patientId,
    patientName: payload.patientName ?? workflow.patientName,
    practitionerId: payload.practitionerId,
    priority: payload.priority,
  });
}