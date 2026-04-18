import { useCallback, useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import { Button, Badge, Card, CardHeader, CardTitle, CardContent } from '@healthcare/design-system';
import { createGlobalHub, disposeGlobalHub, type HubConnection } from '@healthcare/signalr-client';
import { emitAgentDecision, emitEscalationRequired } from '@healthcare/mfe-events';

type SessionStatus = 'idle' | 'connecting' | 'live' | 'ended';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const HUB_TOKEN = import.meta.env.VITE_HUB_TOKEN || '';

const DEMO_TRANSCRIPTS = [
  "Patient reports severe chest pain radiating to the left arm for the past 30 minutes, shortness of breath, and sweating.",
  "Patient has a fever of 39.5Â°C for 3 days, sore throat, difficulty swallowing, and swollen lymph nodes.",
  "Patient complains of a persistent headache for 2 days, blurred vision, and mild nausea. No prior history.",
  "Patient has abdominal pain in the lower right quadrant, started 6 hours ago and is getting worse. Rebound tenderness present.",
  "Patient with known Type 2 diabetes reports blood sugar of 320 mg/dL, excessive thirst, and frequent urination.",
];

interface TriageResult {
  id: string;
  assignedLevel: string;
  agentReasoning: string;
}

interface LiveUpdate {
  type: 'AgentDecision' | 'EscalationRequired' | 'TranscriptUpdated';
  payload: unknown;
}

export function VoiceSessionController() {
  const [status, setStatus]           = useState<SessionStatus>('idle');
  const [sessionId, setSessionId]     = useState<string | null>(null);
  const [triage, setTriage]           = useState<string | null>(null);
  const [transcriptText, setTranscriptText] = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [liveUpdates, setLiveUpdates] = useState<LiveUpdate[]>([]);
  const [hubConnected, setHubConnected] = useState(false);
  const hubRef = useRef<HubConnection | null>(null);

  // â”€â”€ SignalR lifecycle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const connectHub = useCallback(async (sid: string) => {
    try {
      const hub = createGlobalHub(HUB_TOKEN);
      hubRef.current = hub;

      hub.on('AgentDecision', (sessionIdFromHub: string, decision: { triageLevel: string; reasoning: string }) => {
        if (sessionIdFromHub !== sid) return;
        setTriage(decision.triageLevel);
        setTriageResult({
          id: sid,
          assignedLevel: decision.triageLevel,
          agentReasoning: decision.reasoning,
        });
        setLiveUpdates(prev => [...prev, { type: 'AgentDecision', payload: decision }]);

        // Broadcast to Triage MFE via typed event bus
        emitAgentDecision({ sessionId: sid, triageLevel: decision.triageLevel, reasoning: decision.reasoning });
      });

      hub.on('EscalationRequired', (sessionIdFromHub: string) => {
        if (sessionIdFromHub !== sid) return;
        setLiveUpdates(prev => [...prev, { type: 'EscalationRequired', payload: { sessionId: sid } }]);
        emitEscalationRequired({ sessionId: sid });
      });

      hub.on('TranscriptUpdated', (sessionIdFromHub: string, chunk: string) => {
        if (sessionIdFromHub !== sid) return;
        setTranscriptText(prev => prev + (prev ? ' ' : '') + chunk);
        setLiveUpdates(prev => [...prev, { type: 'TranscriptUpdated', payload: chunk }]);
      });

      hub.onclose(() => setHubConnected(false));
      hub.onreconnecting(() => setHubConnected(false));
      hub.onreconnected(() => {
        setHubConnected(true);
        hub.invoke('JoinSession', sid).catch(() => {});
      });

      await hub.start();
      await hub.invoke('JoinSession', sid);
      setHubConnected(true);
    } catch {
      // Hub unavailable in dev â€” degrade gracefully to polling
      setHubConnected(false);
    }
  }, []);

  const disconnectHub = useCallback(async () => {
    hubRef.current = null;
    setHubConnected(false);
    await disposeGlobalHub();
  }, []);

  useEffect(() => {
    return () => { void disconnectHub(); };
  }, [disconnectHub]);

  // â”€â”€ Session control â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function startSession() {
    setStatus('connecting');
    setTriageResult(null);
    setLiveUpdates([]);
    try {
      const res = await fetch(`${API_BASE}/api/v1/voice/sessions`, {
        method: 'POST',
        body: JSON.stringify({ patientId: '00000000-0000-0000-0000-000000000001' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      setSessionId(data.id);
      setStatus('live');
      await connectHub(data.id);
    } catch {
      setStatus('idle');
    }
  }

  async function endSession() {
    if (!sessionId) return;
    await fetch(`${API_BASE}/api/v1/voice/sessions/${sessionId}/end`, { method: 'POST' });
    setStatus('ended');
    await disconnectHub();
  }

  async function submitForTriage() {
    if (!sessionId || !transcriptText.trim()) return;
    setSubmitting(true);
    setTriageResult(null);
    try {
      await fetch(`${API_BASE}/api/v1/voice/sessions/${sessionId}/transcript`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcriptText }),
      });

      const triageRes = await fetch(`${API_BASE}/api/v1/agents/triage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, transcriptText }),
      });
      const result = await triageRes.json();
      // If not using SignalR, set the result from the HTTP response directly
      if (!hubConnected) {
        setTriage(result.assignedLevel);
        setTriageResult(result);
        emitAgentDecision({ sessionId, triageLevel: result.assignedLevel, reasoning: result.agentReasoning });
      }
      // If SignalR is connected, AgentDecision hub event will update state
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <span>Voice Session</span>
            {status !== 'idle' && (
              <Badge variant={status === 'live' ? 'success' : status === 'ended' ? 'secondary' : 'warning'}>
                {status}
              </Badge>
            )}
            {triage && (
              <Badge variant={triage === 'P1_Immediate' ? 'danger' : triage === 'P2_Urgent' ? 'warning' : 'success'}>
                {triage}
              </Badge>
            )}
            {hubConnected && (
              <Chip label="Live" size="small" color="success" sx={{ height: 18, fontSize: 10 }} />
            )}
          </Stack>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1}>
            <Button onClick={startSession} disabled={status !== 'idle' && status !== 'ended'}>
              Start Session
            </Button>
            <Button onClick={endSession} variant="destructive" disabled={status !== 'live'}>
              End Session
            </Button>
          </Stack>

          {status === 'connecting' && <LinearProgress />}

          {status === 'live' && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Enter patient transcript for AI triage analysis:
              </Typography>
              <TextField
                multiline
                rows={4}
                fullWidth
                value={transcriptText}
                onChange={(e) => setTranscriptText(e.target.value)}
                placeholder="e.g. Patient reports chest pain, shortness of breath..."
                size="small"
                sx={{ mb: 1 }}
              />
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
                {DEMO_TRANSCRIPTS.map((t, i) => (
                  <Box
                    key={i}
                    component="span"
                    onClick={() => setTranscriptText(t)}
                    sx={{
                      px: 1, py: 0.5, fontSize: 11, border: 1, borderRadius: 1,
                      borderColor: 'divider', cursor: 'pointer',
                      '&:hover': { bgcolor: 'primary.50' },
                    }}
                  >
                    Demo {i + 1}
                  </Box>
                ))}
              </Stack>
              <Button
                onClick={submitForTriage}
                disabled={submitting || !transcriptText.trim()}
              >
                {submitting ? 'Running AI Triage...' : 'Submit for AI Triage'}
              </Button>
            </Box>
          )}

          {triageResult && (
            <Alert
              severity={
                triageResult.assignedLevel === 'P1_Immediate' ? 'error' :
                triageResult.assignedLevel === 'P2_Urgent' ? 'warning' : 'success'
              }
            >
              <Typography variant="body2" fontWeight="bold">
                Triage Result: {triageResult.assignedLevel}
              </Typography>
              {triageResult.agentReasoning && (
                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                  {triageResult.agentReasoning}
                </Typography>
              )}
            </Alert>
          )}

          {liveUpdates.length > 0 && (
            <Box sx={{ maxHeight: 120, overflowY: 'auto', bgcolor: 'grey.50', borderRadius: 1, p: 1 }}>
              <Typography variant="caption" color="text.secondary" fontWeight="bold">
                Live Updates ({liveUpdates.length})
              </Typography>
              {liveUpdates.slice(-5).map((u, i) => (
                <Typography key={i} variant="caption" display="block" color="text.secondary">
                  [{u.type}] {JSON.stringify(u.payload).slice(0, 80)}
                </Typography>
              ))}
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

