import { useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import LinearProgress from '@mui/material/LinearProgress';
import Divider from '@mui/material/Divider';
import DownloadIcon from '@mui/icons-material/Download';
import DescriptionIcon from '@mui/icons-material/Description';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@healthcare/design-system';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

// ── Report definitions ────────────────────────────────────────────────────────

interface ReportDef {
  id: string;
  label: string;
  description: string;
  endpoint: string;
  formats: ('csv' | 'ndjson')[];
  domain: string;
  queryParams?: { key: string; label: string; type: 'date' | 'number'; default: string }[];
}

const REPORTS: ReportDef[] = [
  {
    id: 'audit-log',
    label: 'Audit Log Export',
    description: 'HIPAA §164.530(j) access audit records with 7-year retention. Supports CSV and NDJSON.',
    endpoint: '/api/v1/admin/audit/export',
    formats: ['csv', 'ndjson'],
    domain: 'Security & Compliance',
    queryParams: [
      { key: 'from', label: 'From Date', type: 'date', default: new Date(Date.now() - 30 * 86_400_000).toISOString().split('T')[0] },
      { key: 'to',   label: 'To Date',   type: 'date', default: new Date().toISOString().split('T')[0] },
    ],
  },
  {
    id: 'patient-risks',
    label: 'Patient Risk Report',
    description: 'ML.NET readmission risk scores for all active patients across the population.',
    endpoint: '/api/v1/population-health/risks',
    formats: ['csv'],
    domain: 'Population Health',
    queryParams: [
      { key: 'top', label: 'Max Rows', type: 'number', default: '100' },
    ],
  },
  {
    id: 'care-gaps',
    label: 'Care Gap Report',
    description: 'Open care gaps by patient — HEDIS measure compliance gaps requiring clinical action.',
    endpoint: '/api/v1/population-health/care-gaps',
    formats: ['csv'],
    domain: 'Population Health',
  },
  {
    id: 'coding-queue',
    label: 'Coding Queue Report',
    description: 'All clinical coding jobs with status, payer, and assigned clinician information.',
    endpoint: '/api/v1/revenue/coding-jobs',
    formats: ['csv', 'ndjson'],
    domain: 'Revenue Cycle',
    queryParams: [
      { key: 'top', label: 'Max Rows', type: 'number', default: '100' },
    ],
  },
  {
    id: 'denial-analytics',
    label: 'Denial Analytics Report',
    description: 'Claim denial summary by category, CARC code, overturn rate, and near-deadline cases.',
    endpoint: '/api/v1/revenue/denials/analytics',
    formats: ['csv'],
    domain: 'Revenue Cycle',
  },
  {
    id: 'notification-delivery',
    label: 'Notification Delivery Report',
    description: 'Delivery success/failure rates across push, email, and SMS channels.',
    endpoint: '/api/v1/notifications/analytics/delivery',
    formats: ['csv'],
    domain: 'Notifications',
  },
];

// ── Per-report row ────────────────────────────────────────────────────────────

interface ReportRowState {
  format: 'csv' | 'ndjson';
  params: Record<string, string>;
  downloading: boolean;
  error: string;
  success: boolean;
}

function buildDefaultParams(r: ReportDef): Record<string, string> {
  const params: Record<string, string> = {};
  for (const p of r.queryParams ?? []) {
    params[p.key] = p.default;
  }
  return params;
}

function ReportRow({ report }: { report: ReportDef }) {
  const [state, setState] = useState<ReportRowState>({
    format:      report.formats[0],
    params:      buildDefaultParams(report),
    downloading: false,
    error:       '',
    success:     false,
  });

  async function handleDownload() {
    setState(s => ({ ...s, downloading: true, error: '', success: false }));
    try {
      const qs = new URLSearchParams({ format: state.format, ...state.params }).toString();
      const url = `${API_BASE}${report.endpoint}?${qs}`;
      const res = await fetch(url);
      if (!res.ok) {
        setState(s => ({ ...s, downloading: false, error: `HTTP ${res.status}` }));
        return;
      }
      const blob = await res.blob();
      const ext = state.format === 'ndjson' ? 'ndjson' : 'csv';
      const filename = `${report.id}-${new Date().toISOString().split('T')[0]}.${ext}`;
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objUrl);
      setState(s => ({ ...s, downloading: false, success: true }));
    } catch {
      setState(s => ({ ...s, downloading: false, error: 'Download failed. Check network connection.' }));
    }
  }

  function setParam(key: string, value: string) {
    setState(s => ({ ...s, params: { ...s.params, [key]: value }, success: false }));
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2} flexWrap="wrap">
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Stack direction="row" alignItems="center" gap={1} mb={0.5}>
            <DescriptionIcon fontSize="small" color="action" />
            <Typography variant="body2" fontWeight={600}>{report.label}</Typography>
            <Chip label={report.domain} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />
          </Stack>
          <Typography variant="caption" color="text.secondary">{report.description}</Typography>
        </Box>

        <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
          {/* Format selector */}
          {report.formats.length > 1 && (
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Format</InputLabel>
              <Select
                label="Format"
                value={state.format}
                onChange={e => setState(s => ({ ...s, format: e.target.value as 'csv' | 'ndjson', success: false }))}
              >
                {report.formats.map(f => (
                  <MenuItem key={f} value={f}>{f.toUpperCase()}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Dynamic query params */}
          {(report.queryParams ?? []).map(p => (
            <TextField
              key={p.key}
              label={p.label}
              type={p.type}
              size="small"
              value={state.params[p.key] ?? p.default}
              onChange={e => setParam(p.key, e.target.value)}
              sx={{ width: p.type === 'date' ? 160 : 100 }}
              inputProps={p.type === 'number' ? { min: 1, max: 10000 } : {}}
            />
          ))}

          <Button
            size="small"
            onClick={() => void handleDownload()}
            disabled={state.downloading}
            aria-label={`Download ${report.label}`}
          >
            {state.downloading ? 'Downloading…' : (
              <Stack direction="row" alignItems="center" gap={0.5}>
                <DownloadIcon fontSize="small" />
                <span>Download</span>
              </Stack>
            )}
          </Button>
        </Stack>
      </Stack>

      {state.downloading && <LinearProgress sx={{ mt: 1 }} />}
      {state.success && (
        <Alert severity="success" sx={{ mt: 1 }}>
          {report.label} downloaded successfully.
        </Alert>
      )}
      {state.error && (
        <Alert severity="error" sx={{ mt: 1 }}>{state.error}</Alert>
      )}
    </Box>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ReportsExportPanel() {
  const domainGroups = Array.from(new Set(REPORTS.map(r => r.domain)));

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Reports &amp; Data Export
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Generate and download clinical, operational, and compliance reports across all platform domains.
        All exports are paginated and respect your tenant data residency settings.
      </Typography>

      <Grid container spacing={3}>
        {domainGroups.map(domain => {
          const domainReports = REPORTS.filter(r => r.domain === domain);
          return (
            <Grid item xs={12} key={domain}>
              <Card>
                <CardHeader>
                  <CardTitle>{domain}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Stack gap={2} divider={<Divider flexItem />}>
                    {domainReports.map(r => (
                      <ReportRow key={r.id} report={r} />
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Alert severity="info" sx={{ mt: 3 }}>
        <strong>HIPAA §164.530(j):</strong> All audit exports are retained for 7 years in Azure Key Vault Managed HSM.
        Downloaded files should be handled according to your organisation's data handling policy.
      </Alert>
    </Box>
  );
}
