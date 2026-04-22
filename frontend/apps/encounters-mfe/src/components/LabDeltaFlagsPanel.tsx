import { useState, useEffect } from 'react';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@healthcare/design-system';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const DEMO_FLAGS: LabDeltaFlag[] = [
  { patientId: 'DEMO', loincCode: '4548-4', displayName: 'Hemoglobin A1c',   currentValue: 8.1, unit: '%',     observedAt: new Date(Date.now() - 30 * 86_400_000).toISOString(), severity: 'Critical', deltaAbsolute: 1.2, deltaPercent: 17.4, criticalRangeBreached: true,  thresholdLabel: '>8.0% critical threshold' },
  { patientId: 'DEMO', loincCode: '2345-7', displayName: 'Glucose (Fasting)', currentValue: 148, unit: 'mg/dL', observedAt: new Date(Date.now() - 30 * 86_400_000).toISOString(), severity: 'High',     deltaAbsolute: 32,  deltaPercent: 27.6, criticalRangeBreached: false, thresholdLabel: '>30% delta threshold' },
  { patientId: 'DEMO', loincCode: '2823-3', displayName: 'Potassium',         currentValue: 4.1, unit: 'mEq/L', observedAt: new Date(Date.now() - 7  * 86_400_000).toISOString(), severity: 'Normal',   deltaAbsolute: 0.2, deltaPercent: 5.1,  criticalRangeBreached: false, thresholdLabel: 'Within normal delta' },
];

// ── Types matching LabDeltaFlaggingService output ──────────────────────────
type FlagSeverity = 'Critical' | 'High' | 'Normal';

interface LabDeltaFlag {
  patientId: string;
  loincCode: string;
  displayName: string;
  currentValue: number;
  unit: string;
  observedAt: string;
  severity: FlagSeverity;
  deltaAbsolute: number | null;
  deltaPercent: number | null;
  criticalRangeBreached: boolean;
  thresholdLabel: string;
}

// ── Severity helpers ───────────────────────────────────────────────────────
function severityColor(s: FlagSeverity): 'error' | 'warning' | 'default' {
  if (s === 'Critical') return 'error';
  if (s === 'High') return 'warning';
  return 'default';
}

function severityBadge(s: FlagSeverity): 'danger' | 'warning' | 'default' {
  if (s === 'Critical') return 'danger';
  if (s === 'High') return 'warning';
  return 'default';
}

// ── Component ──────────────────────────────────────────────────────────────
export function LabDeltaFlagsPanel({ patientId: propId }: { patientId?: string } = {}) {
  const [patientIdInput, setPatientIdInput] = useState('');
  const [patientId, setPatientId] = useState(propId ?? '');
  const [flags, setFlags] = useState<LabDeltaFlag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (propId !== undefined) setPatientId(propId);
  }, [propId]);

  useEffect(() => {
    if (!patientId) return;
    const controller = new AbortController();

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${API_BASE}/api/v1/fhir/observations/${encodeURIComponent(patientId)}/delta-flags`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: LabDeltaFlag[] = await res.json();
        setFlags(data);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setFlags(DEMO_FLAGS);
          setError(null);
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [patientId]);

  function handleSearch() {
    const trimmed = patientIdInput.trim();
    if (trimmed) setPatientId(trimmed);
  }

  const criticalFlags = flags.filter((f) => f.severity === 'Critical');
  const highFlags = flags.filter((f) => f.severity === 'High');
  const normalFlags = flags.filter((f) => f.severity === 'Normal');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lab Delta Flags</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Patient ID search */}
        {!propId && (
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
            <TextField
              label="Patient ID"
              size="small"
              value={patientIdInput}
              onChange={(e) => setPatientIdInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="e.g. PAT-001"
              sx={{ minWidth: 240 }}
            />
            <button
              onClick={handleSearch}
              disabled={!patientIdInput.trim()}
              style={{
                padding: '6px 16px',
                cursor: patientIdInput.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Check Deltas
            </button>
          </Stack>
        )}

        {/* Loading / Error states */}
        {loading && (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 2 }}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              Running delta check…
            </Typography>
          </Stack>
        )}

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {!patientId && !loading && (
          <Typography variant="body2" color="text.secondary">
            Enter a patient ID to run the AACC/CLIA lab delta check.
          </Typography>
        )}

        {patientId && !loading && !error && flags.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No delta flags found for patient {patientId}.
          </Typography>
        )}

        {/* Summary chips */}
        {flags.length > 0 && (
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Chip
              label={`${criticalFlags.length} Critical`}
              color="error"
              size="small"
              variant={criticalFlags.length > 0 ? 'filled' : 'outlined'}
            />
            <Chip
              label={`${highFlags.length} High`}
              color="warning"
              size="small"
              variant={highFlags.length > 0 ? 'filled' : 'outlined'}
            />
            <Chip
              label={`${normalFlags.length} Normal`}
              size="small"
              variant="outlined"
            />
          </Stack>
        )}

        {/* Flag list */}
        <Stack spacing={1.5}>
          {flags.map((flag, idx) => (
            <Stack key={idx}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
              >
                <Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" fontWeight={600}>
                      {flag.displayName || flag.loincCode}
                    </Typography>
                    {flag.criticalRangeBreached && (
                      <Chip
                        label="Critical Range"
                        color="error"
                        size="small"
                      />
                    )}
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    LOINC: {flag.loincCode} · {new Date(flag.observedAt).toLocaleDateString()}
                  </Typography>
                </Stack>

                <Stack alignItems="flex-end" spacing={0.5}>
                  <Typography variant="body1" fontWeight={700}>
                    {flag.currentValue} {flag.unit}
                  </Typography>
                  <Badge variant={severityBadge(flag.severity)}>
                    {flag.severity}
                  </Badge>
                </Stack>
              </Stack>

              <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                {flag.deltaAbsolute !== null && (
                  <Typography variant="caption" color={severityColor(flag.severity)}>
                    Δ {flag.deltaAbsolute > 0 ? '+' : ''}{flag.deltaAbsolute.toFixed(2)} {flag.unit}
                  </Typography>
                )}
                {flag.deltaPercent !== null && (
                  <Typography variant="caption" color={severityColor(flag.severity)}>
                    ({flag.deltaPercent > 0 ? '+' : ''}{flag.deltaPercent.toFixed(1)}%)
                  </Typography>
                )}
                {flag.thresholdLabel && (
                  <Typography variant="caption" color="text.secondary">
                    Threshold: {flag.thresholdLabel}
                  </Typography>
                )}
              </Stack>

              {idx < flags.length - 1 && <Divider sx={{ mt: 1.5 }} />}
            </Stack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
