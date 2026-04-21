import { useState, useEffect } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Card, CardHeader, CardTitle, CardContent } from '@healthcare/design-system';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

type SessionStatus = 'Live' | 'Ended' | 'Connecting';

interface VoiceSessionSummary {
  id: string;
  patientId: string;
  status: SessionStatus;
  startedAt: string;
}

function statusColor(s: SessionStatus): 'success' | 'warning' | 'default' {
  if (s === 'Live') return 'success';
  if (s === 'Connecting') return 'warning';
  return 'default';
}

function formatDuration(startedAt: string): string {
  const start = new Date(startedAt);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const mins = Math.floor(diffMs / 60000);
  const secs = Math.floor((diffMs % 60000) / 1000);
  if (mins > 60) {
    const hours = Math.floor(mins / 60);
    return `${hours}h ${mins % 60}m`;
  }
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

export function VoiceSessionHistory() {
  const [sessions, setSessions] = useState<VoiceSessionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchSessions() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/voice/sessions`, { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: VoiceSessionSummary[] = await res.json();
      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSessions();
  }, []);

  const liveSessions = sessions.filter((s) => s.status === 'Live');
  const endedSessions = sessions.filter((s) => s.status !== 'Live');

  return (
    <Card>
      <CardHeader>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <CardTitle>Voice Session History</CardTitle>
          <IconButton size="small" onClick={fetchSessions} disabled={loading} aria-label="refresh sessions">
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Stack>
      </CardHeader>
      <CardContent>
        {loading && (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 2 }}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              Loading sessions…
            </Typography>
          </Stack>
        )}

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {!loading && !error && sessions.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No voice sessions found.
          </Typography>
        )}

        {/* Live sessions banner */}
        {liveSessions.length > 0 && (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <Chip
              label={`${liveSessions.length} live`}
              color="success"
              size="small"
            />
            <Typography variant="caption" color="text.secondary">
              session{liveSessions.length > 1 ? 's' : ''} in progress
            </Typography>
          </Stack>
        )}

        {/* Session list */}
        <Stack spacing={1.5}>
          {sessions.map((session, idx) => (
            <Stack key={session.id}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Stack spacing={0.5}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" fontWeight={600}>
                      {session.patientId}
                    </Typography>
                    <Chip
                      label={session.status}
                      color={statusColor(session.status)}
                      size="small"
                    />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    Started: {new Date(session.startedAt).toLocaleString()}
                  </Typography>
                  {session.status === 'Live' && (
                    <Typography variant="caption" color="success.main">
                      Duration: {formatDuration(session.startedAt)}
                    </Typography>
                  )}
                </Stack>

                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                  {session.id.slice(0, 8)}…
                </Typography>
              </Stack>

              {idx < sessions.length - 1 && <Divider sx={{ mt: 1.5 }} />}
            </Stack>
          ))}
        </Stack>

        {/* Summary footer */}
        {sessions.length > 0 && (
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Chip label={`${sessions.length} total`} size="small" variant="outlined" />
            <Chip label={`${endedSessions.length} ended`} size="small" variant="outlined" />
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
