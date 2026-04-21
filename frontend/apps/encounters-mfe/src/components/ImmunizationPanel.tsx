import { useState, useEffect } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@healthcare/design-system';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

interface Immunization {
  id?: string;
  resourceType: string;
  status?: string;
  vaccineCode?: { text?: string; coding?: { display?: string }[] };
  patient?: { reference?: string };
  occurrenceDateTime?: string;
  recorded?: string;
  primarySource?: boolean;
}

interface Bundle<T> {
  entry?: { resource: T }[];
}

function statusBadge(status?: string) {
  switch (status) {
    case 'completed':    return 'success' as const;
    case 'not-done':     return 'danger' as const;
    case 'entered-in-error': return 'warning' as const;
    default:             return 'default' as const;
  }
}

export function ImmunizationPanel() {
  const [patientId, setPatientId] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [immunizations, setImmunizations] = useState<Immunization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (patientId) void fetchImmunizations(patientId);
  }, [patientId]);

  async function fetchImmunizations(id: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/fhir/immunizations/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const bundle: Bundle<Immunization> = await res.json();
      setImmunizations(bundle.entry?.map(e => e.resource) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load immunizations');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Immunizations</CardTitle>
      </CardHeader>
      <CardContent>
        <Stack direction="row" gap={1} mb={2}>
          <TextField
            size="small"
            placeholder="Patient ID"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') setPatientId(searchInput.trim()); }}
          />
          <Button variant="outlined" size="small" onClick={() => setPatientId(searchInput.trim())}>
            Load
          </Button>
        </Stack>

        {loading && <CircularProgress size={20} />}
        {error && <Typography color="error">{error}</Typography>}
        {!patientId && !loading && (
          <Typography variant="body2" color="text.secondary">Enter a patient ID to load immunization records.</Typography>
        )}
        {patientId && !loading && immunizations.length === 0 && !error && (
          <Typography variant="body2" color="text.secondary">No immunization records found.</Typography>
        )}

        <Stack gap={1}>
          {immunizations.map((imm, i) => {
            const vaccine = imm.vaccineCode?.text ?? imm.vaccineCode?.coding?.[0]?.display ?? 'Unknown vaccine';
            const occurrence = imm.occurrenceDateTime ?? imm.recorded;
            return (
              <Stack key={imm.id ?? i} direction="row" justifyContent="space-between" alignItems="center"
                sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Stack>
                  <Typography variant="body2" fontWeight="bold">{vaccine}</Typography>
                  {occurrence && (
                    <Typography variant="caption" color="text.secondary">
                      Given: {new Date(occurrence).toLocaleDateString()}
                    </Typography>
                  )}
                  {imm.primarySource === false && (
                    <Typography variant="caption" color="text.secondary">Secondary source</Typography>
                  )}
                </Stack>
                <Badge variant={statusBadge(imm.status)}>{imm.status ?? '—'}</Badge>
              </Stack>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}
