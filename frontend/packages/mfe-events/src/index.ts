/**
 * @healthcare/mfe-events
 *
 * Typed cross-MFE event bus built on the browser's native CustomEvent API.
 * All inter-MFE communication goes through `window` so no shared runtime
 * state is needed — each MFE simply imports and calls these helpers.
 *
 * Usage (emit):
 *   import { emitTranscriptCompleted } from '@healthcare/mfe-events';
 *   emitTranscriptCompleted({ sessionId: '…', transcriptText: '…', triageLevel: 'P1_Immediate' });
 *
 * Usage (listen):
 *   import { onTranscriptCompleted } from '@healthcare/mfe-events';
 *   const off = onTranscriptCompleted(({ detail }) => console.log(detail.triageLevel));
 *   // …later
 *   off();
 */

// ── Event payload types ──────────────────────────────────────────────────────

export interface TranscriptCompletedDetail {
  sessionId: string;
  transcriptText: string;
  triageLevel?: string;
}

export interface AgentDecisionDetail {
  sessionId: string;
  triageLevel: string;
  reasoning: string;
  isGuardApproved?: boolean;
}

export interface EscalationRequiredDetail {
  sessionId: string;
  workflowId?: string;
  reason?: string;
}

export interface PatientSelectedDetail {
  patientId: string;
  riskLevel?: string;
}

export interface SlotReservedDetail {
  slotId: string;
  patientId?: string;
  practitionerId?: string;
}

export interface BookingCreatedDetail {
  bookingId?: string;
  slotId: string;
  patientId: string;
}

export interface TriageApprovedDetail {
  workflowId: string;
  sessionId: string;
  patientId?: string;
  triageLevel: string;
  approvedBy: string; // userId of the clinician who approved
}

export interface NavigationRequestedDetail {
  /** Target route path e.g. '/triage', '/scheduling?patientId=123' */
  path: string;
  /** Optional human-readable reason for the navigation (used by AI Copilot) */
  reason?: string;
  /** When true, open in a new browser tab */
  openInNewTab?: boolean;
}

// ── Event name constants ─────────────────────────────────────────────────────

export const MFE_EVENTS = {
  TRANSCRIPT_COMPLETED:  'mfe:transcript:completed',
  AGENT_DECISION:        'mfe:agent:decision',
  ESCALATION_REQUIRED:   'mfe:escalation:required',
  PATIENT_SELECTED:      'mfe:patient:selected',
  SLOT_RESERVED:         'mfe:slot:reserved',
  BOOKING_CREATED:       'mfe:booking:created',
  TRIAGE_APPROVED:       'mfe:triage:approved',
  NAVIGATION_REQUESTED:  'mfe:navigation:requested',
} as const;

export type MfeEventName = (typeof MFE_EVENTS)[keyof typeof MFE_EVENTS];

// ── Generic helpers ──────────────────────────────────────────────────────────

export function emitMfeEvent<T>(name: MfeEventName, detail: T): void {
  window.dispatchEvent(new CustomEvent<T>(name, { detail, bubbles: false }));
}

type MfeEventHandler<T> = (event: CustomEvent<T>) => void;

export function onMfeEvent<T>(
  name: MfeEventName,
  handler: MfeEventHandler<T>,
): () => void {
  const listener = handler as EventListener;
  window.addEventListener(name, listener);
  return () => window.removeEventListener(name, listener);
}

// ── Typed convenience emitters ───────────────────────────────────────────────

export const emitTranscriptCompleted = (detail: TranscriptCompletedDetail) =>
  emitMfeEvent<TranscriptCompletedDetail>(MFE_EVENTS.TRANSCRIPT_COMPLETED, detail);

export const emitAgentDecision = (detail: AgentDecisionDetail) =>
  emitMfeEvent<AgentDecisionDetail>(MFE_EVENTS.AGENT_DECISION, detail);

export const emitEscalationRequired = (detail: EscalationRequiredDetail) =>
  emitMfeEvent<EscalationRequiredDetail>(MFE_EVENTS.ESCALATION_REQUIRED, detail);

export const emitPatientSelected = (detail: PatientSelectedDetail) =>
  emitMfeEvent<PatientSelectedDetail>(MFE_EVENTS.PATIENT_SELECTED, detail);

// ── Typed convenience listeners ──────────────────────────────────────────────

export const onTranscriptCompleted = (handler: MfeEventHandler<TranscriptCompletedDetail>) =>
  onMfeEvent<TranscriptCompletedDetail>(MFE_EVENTS.TRANSCRIPT_COMPLETED, handler);

export const onAgentDecision = (handler: MfeEventHandler<AgentDecisionDetail>) =>
  onMfeEvent<AgentDecisionDetail>(MFE_EVENTS.AGENT_DECISION, handler);

export const onEscalationRequired = (handler: MfeEventHandler<EscalationRequiredDetail>) =>
  onMfeEvent<EscalationRequiredDetail>(MFE_EVENTS.ESCALATION_REQUIRED, handler);

export const onPatientSelected = (handler: MfeEventHandler<PatientSelectedDetail>) =>
  onMfeEvent<PatientSelectedDetail>(MFE_EVENTS.PATIENT_SELECTED, handler);

export const emitSlotReserved = (detail: SlotReservedDetail) =>
  emitMfeEvent<SlotReservedDetail>(MFE_EVENTS.SLOT_RESERVED, detail);

export const emitBookingCreated = (detail: BookingCreatedDetail) =>
  emitMfeEvent<BookingCreatedDetail>(MFE_EVENTS.BOOKING_CREATED, detail);

export const onSlotReserved = (handler: MfeEventHandler<SlotReservedDetail>) =>
  onMfeEvent<SlotReservedDetail>(MFE_EVENTS.SLOT_RESERVED, handler);

export const onBookingCreated = (handler: MfeEventHandler<BookingCreatedDetail>) =>
  onMfeEvent<BookingCreatedDetail>(MFE_EVENTS.BOOKING_CREATED, handler);

export const emitTriageApproved = (detail: TriageApprovedDetail) =>
  emitMfeEvent<TriageApprovedDetail>(MFE_EVENTS.TRIAGE_APPROVED, detail);

export const onTriageApproved = (handler: MfeEventHandler<TriageApprovedDetail>) =>
  onMfeEvent<TriageApprovedDetail>(MFE_EVENTS.TRIAGE_APPROVED, handler);

export const emitNavigationRequested = (detail: NavigationRequestedDetail) =>
  emitMfeEvent<NavigationRequestedDetail>(MFE_EVENTS.NAVIGATION_REQUESTED, detail);

export const onNavigationRequested = (handler: MfeEventHandler<NavigationRequestedDetail>) =>
  onMfeEvent<NavigationRequestedDetail>(MFE_EVENTS.NAVIGATION_REQUESTED, handler);
