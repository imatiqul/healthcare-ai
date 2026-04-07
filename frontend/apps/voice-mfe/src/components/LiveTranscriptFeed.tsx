import { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Card, CardContent } from '@healthcare/design-system';

interface TranscriptEntry {
  id: string;
  speaker: 'patient' | 'agent';
  text: string;
  timestamp: Date;
}

interface LiveTranscriptFeedProps {
  sessionId: string;
  onTriageUpdate?: (level: string) => void;
}

export function LiveTranscriptFeed({ sessionId, onTriageUpdate }: LiveTranscriptFeedProps) {
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleDecision = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.triageLevel && onTriageUpdate) {
        onTriageUpdate(detail.triageLevel);
      }
    };
    window.addEventListener('mfe:agent:decision', handleDecision);
    return () => window.removeEventListener('mfe:agent:decision', handleDecision);
  }, [onTriageUpdate]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [entries]);

  return (
    <Card>
      <CardContent>
        <Box ref={scrollRef} sx={{ height: 256, overflowY: 'auto' }}>
          {entries.length === 0 && (
            <Typography variant="body2" color="text.disabled" textAlign="center" sx={{ py: 8 }}>
              Waiting for transcript... Session: {sessionId}
            </Typography>
          )}
          {entries.map((entry) => (
            <Box
              key={entry.id}
              sx={{
                display: 'flex',
                justifyContent: entry.speaker === 'agent' ? 'flex-end' : 'flex-start',
                mb: 1,
              }}
            >
              <Box
                sx={{
                  maxWidth: '80%',
                  borderRadius: 2,
                  px: 1.5,
                  py: 1,
                  bgcolor: entry.speaker === 'agent' ? 'primary.main' : 'grey.100',
                  color: entry.speaker === 'agent' ? 'primary.contrastText' : 'text.primary',
                }}
              >
                <Typography variant="caption" fontWeight="medium" display="block">
                  {entry.speaker === 'agent' ? 'AI Agent' : 'Patient'}
                </Typography>
                <Typography variant="body2">{entry.text}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
