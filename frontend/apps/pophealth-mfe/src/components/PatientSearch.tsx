import { useState, useCallback, useRef } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
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

const RISK_LEVELS = ['All', 'Critical', 'High', 'Moderate', 'Low'] as const;
type RiskFilter = typeof RISK_LEVELS[number];

export function PatientSearch() {
  const [query, setQuery]             = useState('');
  const [results, setResults]         = useState<PatientSummary[]>([]);
  const [loading, setLoading]         = useState(false);
  const [searched, setSearched]       = useState(false);
  const [riskFilter, setRiskFilter]   = useState<RiskFilter>('All');
  const [careGapsOnly, setCareGapsOnly] = useState(false);
  const [sortAsc, setSortAsc]         = useState(false); // false = highest risk first
  const debounceRef                   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/population-health/risks?search=${encodeURIComponent(q.trim())}&top=20`,
        { signal: AbortSignal.timeout(10_000) },
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

  // Apply client-side smart filters + sort on fetched results
  const visibleResults = results
    .filter(p => riskFilter === 'All' || p.riskLevel === riskFilter)
    .filter(p => !careGapsOnly || p.openCareGaps > 0)
    .sort((a, b) => sortAsc ? a.riskScore - b.riskScore : b.riskScore - a.riskScore);

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
            inputProps={{ 'aria-label': 'Search patients' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Typography variant="caption" color="text.disabled">🔍</Typography>
                </InputAdornment>
              ),
            }}
          />

          {/* Smart filter controls — shown once results are available */}
          {results.length > 0 && (
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <ToggleButtonGroup
                size="small"
                exclusive
                value={riskFilter}
                onChange={(_, v) => v && setRiskFilter(v as RiskFilter)}
                aria-label="Filter by risk level"
              >
                {RISK_LEVELS.map(level => (
                  <ToggleButton key={level} value={level} sx={{ textTransform: 'none', py: 0.25, px: 1 }}>
                    {level}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>

              <Chip
                label="Care gaps only"
                size="small"
                variant={careGapsOnly ? 'filled' : 'outlined'}
                color={careGapsOnly ? 'warning' : 'default'}
                onClick={() => setCareGapsOnly(v => !v)}
                aria-pressed={careGapsOnly}
              />

              <Chip
                label={sortAsc ? 'Risk ↑' : 'Risk ↓'}
                size="small"
                variant="outlined"
                onClick={() => setSortAsc(v => !v)}
                aria-label={sortAsc ? 'Sort by risk ascending' : 'Sort by risk descending'}
              />
            </Stack>
          )}

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

          {!loading && searched && results.length > 0 && visibleResults.length === 0 && (
            <Typography variant="caption" color="text.disabled" textAlign="center" sx={{ py: 2 }}>
              No patients match the active filters.
            </Typography>
          )}

          {visibleResults.length > 0 && (
            <Stack spacing={1} divider={<Divider />}>
              {visibleResults.map((p) => (
                <Box
                  key={p.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => selectPatient(p)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && selectPatient(p)}
                  aria-label={`Select patient ${p.fullName ?? p.patientId}, risk ${p.riskLevel}`}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    py: 0.75,
                    cursor: 'pointer',
                    borderRadius: 1,
                    px: 0.5,
                    '&:hover': { bgcolor: 'action.hover' },
                    '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
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
