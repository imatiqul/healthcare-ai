import { useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import { Button, Badge, Card, CardHeader, CardTitle, CardContent } from '@healthcare/design-system';

type SessionStatus = 'idle' | 'connecting' | 'live' | 'ended';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const DEMO_TRANSCRIPTS = [
  "Patient reports severe chest pain radiating to the left arm for the past 30 minutes, shortness of breath, and sweating.",
  "Patient has a fever of 39.5°C for 3 days, sore throat, difficulty swallowing, and swollen lymph nodes.",
  "Patient complains of a persistent headache for 2 days, blurred vision, and mild nausea. No prior history.",
  "Patient has abdominal pain in the lower right quadrant, started 6 hours ago and is getting worse. Rebound tenderness present.",
  "Patient with known Type 2 diabetes reports blood sugar of 320 mg/dL, excessive thirst, and frequent urination.",
];

interface TriageResult {
  id: string;
  assignedLevel: string;
  agentReasoning: string;
}

export function VoiceSessionController() {
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [triage, setTriage] = useState<string | null>(null);
  const [transcriptText, setTranscriptText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);

  async function startSession() {
    setStatus('connecting');
    setTriageResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/voice/sessions`, {
        method: 'POST',
        body: JSON.stringify({ patientId: '00000000-0000-0000-0000-000000000001' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      setSessionId(data.id);
      setStatus('live');
    } catch {
      setStatus('idle');
    }
  }

  async function endSession() {
    if (!sessionId) return;
    await fetch(`${API_BASE}/api/v1/voice/sessions/${sessionId}/end`, { method: 'POST' });
    setStatus('ended');
  }

  async function submitForTriage() {
    if (!sessionId || !transcriptText.trim()) return;
    setSubmitting(true);
    setTriageResult(null);
    try {
      // Step 1: Save transcript to voice session
      await fetch(`${API_BASE}/api/v1/voice/sessions/${sessionId}/transcript`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcriptText }),
      });

      // Step 2: Run AI triage
      const triageRes = await fetch(`${API_BASE}/api/v1/agents/triage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, transcriptText }),
      });
      const result = await triageRes.json();
      setTriage(result.assignedLevel);
      setTriageResult(result);

      // Notify TriageMFE of new decision
      window.dispatchEvent(new CustomEvent('mfe:agent:decision', {
        detail: { sessionId, triageLevel: result.assignedLevel, reasoning: result.agentReasoning },
      }));
    } catch {
      // silent — triage may fail but session continues
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
        </Stack>
      </CardContent>
    </Card>
  );
}
