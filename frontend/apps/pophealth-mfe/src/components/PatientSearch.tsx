import { useState, useCallback, useRef } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@healthcare/design-system';
import { emitPatientSelected } from '@healthcare/mfe-events';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

interface PatientSummary {
  id: string;
  patientId: string;
  fullName?: string;
  riskLevel: string;
  riskScore: number;
  openCareGaps: number;
  lastAssessedAt?: string;
}

const RISK_BADGE: Record<string, 'danger' | 'warning' | 'default' | 'success'> = {
  Critical: 'danger',
  High: 'warning',
  Moderate: 'default',
  Low: 'success',
};

export function PatientSearch() {
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState<PatientSummary[]>([]);
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef             = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/population-health/risks?search=${encodeURIComponent(q.trim())}&top=20`,
      );
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 350);
  }

  function selectPatient(p: PatientSummary) {
    emitPatientSelected({ patientId: p.patientId, riskLevel: p.riskLevel });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Patient Search</CardTitle>
      </CardHeader>
      <CardContent>
        <Stack spacing={2}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by patient ID or name..."
            value={query}
            onChange={handleChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Typography variant="caption" color="text.disabled">🔍</Typography>
                </InputAdornment>
              ),
            }}
          />

          {loading && (
            <Typography variant="caption" color="text.secondary" textAlign="center">
              Searching...
            </Typography>
          )}

          {!loading && searched && results.length === 0 && (
            <Typography variant="caption" color="text.disabled" textAlign="center" sx={{ py: 2 }}>
              No patients found for "{query}"
            </Typography>
          )}

          {results.length > 0 && (
            <Stack spacing={1} divider={<Divider />}>
              {results.map((p) => (
                <Box
                  key={p.id}
                  onClick={() => selectPatient(p)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    py: 0.75,
                    cursor: 'pointer',
                    borderRadius: 1,
                    px: 0.5,
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {p.fullName ?? p.patientId}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.25 }}>
                      <Typography variant="caption" color="text.disabled" fontFamily="monospace">
                        {p.patientId.substring(0, 8)}…
                      </Typography>
                      {p.openCareGaps > 0 && (
                        <Chip
                          label={`${p.openCareGaps} gap${p.openCareGaps !== 1 ? 's' : ''}`}
                          size="small"
                          color="warning"
                          sx={{ height: 16, fontSize: 10 }}
                        />
                      )}
                    </Stack>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="caption" color="text.secondary">
                      Score: {p.riskScore.toFixed(0)}
                    </Typography>
                    <Badge variant={RISK_BADGE[p.riskLevel] ?? 'secondary'}>
                      {p.riskLevel}
                    </Badge>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
