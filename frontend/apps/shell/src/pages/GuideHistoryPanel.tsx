import { useState, useCallback } from 'react';
import {
  Box, Typography, TextField, Button, CircularProgress, Alert,
  Card, CardContent, Chip, List, ListItem, ListItemText, Divider,
} from '@mui/material';
import { Badge } from '@healthcare/design-system';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

interface GuideMessage {
  role: string;
  content: string;
  timestamp: string;
}

interface GuideHistory {
  sessionId: string;
  messages: GuideMessage[];
}

export default function GuideHistoryPanel() {
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<GuideHistory | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!sessionId.trim()) return;
    setLoading(true);
    setError(null);
    setHistory(null);
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/agents/guide/history/${encodeURIComponent(sessionId.trim())}`,
      );
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const roleVariant = (role: string) =>
    role === 'assistant' ? 'success' : role === 'user' ? 'secondary' : 'default';

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Guide Conversation History</Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" gap={2} alignItems="flex-start">
            <TextField
              label="Guide Session ID (GUID)"
              value={sessionId}
              onChange={e => setSessionId(e.target.value)}
              size="small"
              fullWidth
              inputProps={{ 'aria-label': 'session id' }}
              onKeyDown={e => { if (e.key === 'Enter') loadHistory(); }}
            />
            <Button
              variant="contained"
              onClick={loadHistory}
              disabled={!sessionId.trim() || loading}
              startIcon={loading ? <CircularProgress size={16} /> : undefined}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Load History
            </Button>
          </Box>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {history && (
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Typography variant="h6">Conversation</Typography>
              <Chip
                size="small"
                label={`${history.messages.length} message${history.messages.length !== 1 ? 's' : ''}`}
              />
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                {history.sessionId}
              </Typography>
            </Box>

            {history.messages.length === 0 ? (
              <Alert severity="info">No messages found for this session.</Alert>
            ) : (
              <List dense disablePadding>
                {history.messages.map((msg, i) => (
                  <Box key={i}>
                    <ListItem alignItems="flex-start" sx={{ py: 1 }}>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                            <Badge variant={roleVariant(msg.role) as 'success' | 'secondary' | 'default'}>
                              {msg.role}
                            </Badge>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Typography
                            variant="body2"
                            sx={{
                              whiteSpace: 'pre-wrap',
                              bgcolor: msg.role === 'assistant' ? 'action.hover' : 'transparent',
                              borderRadius: 1,
                              p: msg.role === 'assistant' ? 1 : 0,
                            }}
                          >
                            {msg.content}
                          </Typography>
                        }
                      />
                    </ListItem>
                    {i < history.messages.length - 1 && <Divider component="li" />}
                  </Box>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
