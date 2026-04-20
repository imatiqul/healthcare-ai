import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, CircularProgress, Alert,
  Card, CardContent, Chip, Table, TableBody, TableCell,
  TableHead, TableRow, IconButton,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import InsightsIcon from '@mui/icons-material/Insights';
import { Badge } from '@healthcare/design-system';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

interface DemoSessionSummary {
  sessionId: string;
  clientName: string;
  company: string;
  status: string;
  lastStep: string;
  npsScore: number | null;
  avgRating: number | null;
  startedAt: string;
  completedAt: string | null;
}

interface DemoInsight {
  id: string;
  generatedAt: string;
  sessionsAnalyzed: number;
  averageNps: number;
  topStrengths: string;
  topWeaknesses: string;
  recommendations: string;
}

export default function DemoAdminPanel() {
  const [sessions, setSessions] = useState<DemoSessionSummary[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  const [insight, setInsight] = useState<DemoInsight | null>(null);
  const [generatingInsight, setGeneratingInsight] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoadingSessions(true);
    setSessionsError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/agents/demo/sessions`);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = await res.json();
      setSessions(data);
    } catch (err) {
      setSessionsError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const generateInsights = useCallback(async () => {
    setGeneratingInsight(true);
    setInsightError(null);
    setInsight(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/agents/demo/insights`, { method: 'POST' });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = await res.json();
      setInsight(data);
    } catch (err) {
      setInsightError(err instanceof Error ? err.message : 'Failed to generate insights');
    } finally {
      setGeneratingInsight(false);
    }
  }, []);

  const statusVariant = (status: string) =>
    status === 'Completed' ? 'success' : status === 'InProgress' ? 'warning' : 'default';

  const completedCount = sessions.filter(s => s.status === 'Completed').length;
  const avgNps = sessions
    .filter(s => s.npsScore !== null)
    .reduce((sum, s, _, arr) => sum + (s.npsScore ?? 0) / arr.length, 0);

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5">Demo Admin Panel</Typography>
        <Box display="flex" gap={1}>
          <Chip label={`${sessions.length} total`} />
          <Chip label={`${completedCount} completed`} color="success" />
          {sessions.some(s => s.npsScore !== null) && (
            <Chip label={`Avg NPS: ${avgNps.toFixed(1)}`} color="primary" />
          )}
        </Box>
      </Box>

      {/* Sessions Table */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="h6">Demo Sessions</Typography>
            <IconButton onClick={fetchSessions} disabled={loadingSessions} aria-label="refresh sessions">
              {loadingSessions ? <CircularProgress size={20} /> : <RefreshIcon />}
            </IconButton>
          </Box>

          {sessionsError && <Alert severity="error" sx={{ mb: 1 }}>{sessionsError}</Alert>}

          {sessions.length === 0 && !loadingSessions ? (
            <Alert severity="info">No demo sessions found.</Alert>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Client</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Step</TableCell>
                  <TableCell>NPS</TableCell>
                  <TableCell>Avg Rating</TableCell>
                  <TableCell>Started</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessions.map(s => (
                  <TableRow key={s.sessionId}>
                    <TableCell>{s.clientName}</TableCell>
                    <TableCell>{s.company}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(s.status) as 'success' | 'warning' | 'default'}>
                        {s.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={s.lastStep} variant="outlined" />
                    </TableCell>
                    <TableCell>
                      {s.npsScore !== null ? (
                        <Chip
                          size="small"
                          label={s.npsScore}
                          color={s.npsScore >= 8 ? 'success' : s.npsScore >= 6 ? 'warning' : 'error'}
                        />
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      {s.avgRating !== null ? s.avgRating?.toFixed(1) : '—'}
                    </TableCell>
                    <TableCell>
                      {new Date(s.startedAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">AI Insights from Demo Feedback</Typography>
            <Button
              variant="contained"
              startIcon={generatingInsight ? <CircularProgress size={16} /> : <InsightsIcon />}
              onClick={generateInsights}
              disabled={generatingInsight}
            >
              Generate Insights
            </Button>
          </Box>

          {insightError && <Alert severity="error" sx={{ mb: 2 }}>{insightError}</Alert>}

          {insight && (
            <Box>
              <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                <Chip label={`${insight.sessionsAnalyzed} sessions analyzed`} />
                <Chip label={`Avg NPS: ${insight.averageNps}`} color="primary" />
                <Chip size="small" label={new Date(insight.generatedAt).toLocaleString()} variant="outlined" />
              </Box>
              <Box display="flex" flexDirection="column" gap={1}>
                <Box>
                  <Typography variant="subtitle2" color="success.main">Top Strengths</Typography>
                  <Typography variant="body2">{insight.topStrengths}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="warning.main">Top Weaknesses</Typography>
                  <Typography variant="body2">{insight.topWeaknesses}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2">Recommendations</Typography>
                  <Typography variant="body2">{insight.recommendations}</Typography>
                </Box>
              </Box>
            </Box>
          )}

          {!insight && !insightError && (
            <Alert severity="info">
              Click "Generate Insights" to run AI analysis on all completed demo feedback.
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
