/**
 * PatientContextBar — Phase 49
 *
 * Sticky banner that appears below the breadcrumbs whenever a patient is
 * "active" (selected via PatientQuickSearch or any other patient selection
 * flow).  Shows name / ID, risk-level badge, and quick-navigation shortcuts
 * to all relevant clinical routes for that patient.
 *
 * Reads from and writes to the Zustand globalStore (activePatient /
 * clearActivePatient) so all MFEs see the same context.
 */
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import PersonIcon from '@mui/icons-material/Person';
import CloseIcon from '@mui/icons-material/Close';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MicIcon from '@mui/icons-material/Mic';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { useGlobalStore } from '../store';

// ── Helpers ───────────────────────────────────────────────────────────────────

type RiskLevel = 'Critical' | 'High' | 'Low' | string;

function riskColor(level: RiskLevel | undefined): 'error' | 'warning' | 'success' | 'default' {
  if (!level) return 'default';
  const l = level.toLowerCase();
  if (l === 'critical') return 'error';
  if (l === 'high')     return 'warning';
  if (l === 'low')      return 'success';
  return 'default';
}

// ── Quick-nav links ───────────────────────────────────────────────────────────

interface QuickLink {
  label: string;
  href:  string;
  icon:  React.ReactElement;
}

function buildLinks(patientId: string): QuickLink[] {
  return [
    { label: 'Encounters',        href: `/encounters?patientId=${patientId}`,        icon: <MedicalInformationIcon sx={{ fontSize: 14 }} /> },
    { label: 'Population Health', href: `/population-health?patientId=${patientId}`, icon: <TrendingUpIcon         sx={{ fontSize: 14 }} /> },
    { label: 'Scheduling',        href: `/scheduling?patientId=${patientId}`,         icon: <CalendarMonthIcon      sx={{ fontSize: 14 }} /> },
    { label: 'Voice Session',     href: `/voice?patientId=${patientId}`,              icon: <MicIcon                sx={{ fontSize: 14 }} /> },
    { label: 'Triage',            href: `/triage?patientId=${patientId}`,             icon: <SmartToyIcon           sx={{ fontSize: 14 }} /> },
  ];
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PatientContextBar() {
  const navigate       = useNavigate();
  const activePatient  = useGlobalStore(s => s.activePatient);
  const clearPatient   = useGlobalStore(s => s.clearActivePatient);

  const handleClear = useCallback(() => {
    clearPatient();
  }, [clearPatient]);

  const handleNav = useCallback((href: string) => {
    navigate(href);
  }, [navigate]);

  if (!activePatient) return null;

  const links = buildLinks(activePatient.id);

  return (
    <Box
      role="status"
      aria-label="Active patient context"
      sx={{
        borderBottom: 1,
        borderColor: 'primary.light',
        bgcolor: 'primary.50',
        px: { xs: 2, md: 3 },
        py: 0.75,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        flexWrap: 'wrap',
        background: theme =>
          theme.palette.mode === 'dark'
            ? 'rgba(37,99,235,0.12)'
            : 'rgba(219,234,254,0.8)',
        borderBottomColor: theme =>
          theme.palette.mode === 'dark' ? 'primary.dark' : 'primary.light',
      }}
    >
      {/* ── Patient identity ── */}
      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ flexShrink: 0 }}>
        <PersonIcon sx={{ fontSize: 16, color: 'primary.main', opacity: 0.8 }} />
        <Typography variant="caption" fontWeight={700} color="primary.main" sx={{ letterSpacing: '0.02em' }}>
          Active Patient:
        </Typography>
        <Typography variant="caption" fontWeight={600} color="text.primary" sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>
          {activePatient.name ? `${activePatient.name} (${activePatient.id})` : activePatient.id}
        </Typography>
        {activePatient.riskLevel && (
          <Chip
            label={activePatient.riskLevel}
            size="small"
            color={riskColor(activePatient.riskLevel)}
            sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
          />
        )}
      </Stack>

      {/* ── Quick-nav shortcuts ── */}
      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flex: 1, flexWrap: 'wrap', gap: 0.5 }}>
        {links.map(link => (
          <Chip
            key={link.label}
            icon={link.icon}
            label={link.label}
            size="small"
            variant="outlined"
            onClick={() => handleNav(link.href)}
            aria-label={`Go to ${link.label} for patient ${activePatient.id}`}
            sx={{
              height: 22,
              fontSize: '0.7rem',
              cursor: 'pointer',
              borderColor: 'primary.light',
              color: 'primary.main',
              '& .MuiChip-icon': { ml: '4px' },
              '&:hover': { bgcolor: 'primary.light', color: 'primary.contrastText', borderColor: 'primary.main' },
            }}
          />
        ))}
      </Stack>

      {/* ── Dismiss ── */}
      <Tooltip title="Clear active patient" placement="left">
        <IconButton
          size="small"
          onClick={handleClear}
          aria-label="Clear active patient"
          sx={{ ml: 'auto', flexShrink: 0, color: 'primary.main', opacity: 0.7, '&:hover': { opacity: 1 } }}
        >
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
