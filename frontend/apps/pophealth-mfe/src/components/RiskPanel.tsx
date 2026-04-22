import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@healthcare/design-system';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const DEMO_RISKS: PatientRisk[] = [
  { id: 'r-1',  patientId: 'PAT-00142', level: 'Critical', riskScore: 94, assessedAt: new Date(Date.now() - 1 * 86400_000).toISOString() },
  { id: 'r-2',  patientId: 'PAT-00278', level: 'Critical', riskScore: 91, assessedAt: new Date(Date.now() - 2 * 86400_000).toISOString() },
  { id: 'r-3',  patientId: 'PAT-00391', level: 'High',     riskScore: 82, assessedAt: new Date(Date.now() - 1 * 86400_000).toISOString() },
  { id: 'r-4',  patientId: 'PAT-00554', level: 'High',     riskScore: 79, assessedAt: new Date(Date.now() - 3 * 86400_000).toISOString() },
  { id: 'r-5',  patientId: 'PAT-00619', level: 'High',     riskScore: 76, assessedAt: new Date(Date.now() - 1 * 86400_000).toISOString() },
  { id: 'r-6',  patientId: 'PAT-00731', level: 'Moderate', riskScore: 58, assessedAt: new Date(Date.now() - 5 * 86400_000).toISOString() },
  { id: 'r-7',  patientId: 'PAT-00842', level: 'Moderate', riskScore: 54, assessedAt: new Date(Date.now() - 4 * 86400_000).toISOString() },
  { id: 'r-8',  patientId: 'PAT-00953', level: 'Low',      riskScore: 32, assessedAt: new Date(Date.now() - 7 * 86400_000).toISOString() },
];

interface PatientRisk {
  id: string;
  patientId: string;
  level: string;
  riskScore: number;
  assessedAt: string;
}

export function RiskPanel() {
  const [risks, setRisks] = useState<PatientRisk[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchRisks();
  }, [filter]);

  async function fetchRisks() {
    try {
      const query = filter ? `?riskLevel=${filter}&top=20` : '?top=20';
      const res = await fetch(`${API_BASE}/api/v1/population-health/risks${query}`, { signal: AbortSignal.timeout(10_000) });
      if (res.ok) {
        const data = await res.json();
        setRisks(data);
      } else if (res.status === 404) {
        const demo = filter ? DEMO_RISKS.filter(r => r.level === filter) : DEMO_RISKS;
        setRisks(demo);
      }
    } catch {
      const demo = filter ? DEMO_RISKS.filter(r => r.level === filter) : DEMO_RISKS;
      setRisks(demo);
    }
  }

  function getRiskBadge(level: string) {
    switch (level) {
      case 'Critical': return 'danger' as const;
      case 'High': return 'warning' as const;
      case 'Moderate': return 'default' as const;
      default: return 'success' as const;
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <span>Patient Risk Stratification</span>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                displayEmpty
              >
                <MenuItem value="">All Levels</MenuItem>
                <MenuItem value="Critical">Critical</MenuItem>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Moderate">Moderate</MenuItem>
                <MenuItem value="Low">Low</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {risks.length === 0 ? (
          <Typography color="text.disabled" textAlign="center" sx={{ py: 4 }}>
            No risk assessments
          </Typography>
        ) : (
          <Stack spacing={1}>
            {risks.map((risk) => (
              <Box
                key={risk.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1.5,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                }}
              >
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    Patient {risk.patientId.substring(0, 8)}...
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Score: {risk.riskScore.toFixed(2)}
                  </Typography>
                </Box>
                <Badge variant={getRiskBadge(risk.level)}>{risk.level}</Badge>
              </Box>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
