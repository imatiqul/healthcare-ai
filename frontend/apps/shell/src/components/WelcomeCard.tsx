/**
 * WelcomeCard — dismissible onboarding card shown on first visit.
 *
 * Controlled via localStorage['hq:welcome-dismissed'].
 * Renders at the top of Dashboard.tsx until dismissed.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import CloseIcon from '@mui/icons-material/Close';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PolicyIcon from '@mui/icons-material/Policy';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const DISMISSED_KEY = 'hq:welcome-dismissed';

interface QuickAction {
  label:   string;
  href:    string;
  icon:    React.ReactNode;
  color:   string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Review Triage Queue',     href: '/triage',           icon: <SmartToyIcon sx={{ fontSize: 16 }} />,        color: 'warning.main'   },
  { label: 'Manage Scheduling',       href: '/scheduling',       icon: <EventAvailableIcon sx={{ fontSize: 16 }} />,  color: 'primary.main'   },
  { label: 'Population Health',       href: '/population-health',icon: <MonitorHeartIcon sx={{ fontSize: 16 }} />,    color: 'error.main'     },
  { label: 'Revenue Cycle',           href: '/revenue',          icon: <AccountBalanceIcon sx={{ fontSize: 16 }} />,  color: 'secondary.main' },
  { label: 'AI Governance',           href: '/governance',       icon: <PolicyIcon sx={{ fontSize: 16 }} />,          color: 'info.main'      },
];

const STEPS = [
  'Review your AI triage queue for high-urgency patients',
  'Check high-risk patient population for open care gaps',
  'Monitor revenue cycle denials and prior auth status',
];

export function WelcomeCard() {
  const [visible, setVisible] = useState<boolean>(() => !localStorage.getItem(DISMISSED_KEY));
  const navigate = useNavigate();

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setVisible(false);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'primary.main',
        borderRadius: 3,
        overflow: 'hidden',
        mb: 3,
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(33,150,243,0.08) 0%, rgba(33,150,243,0.02) 100%)'
            : 'linear-gradient(135deg, rgba(33,150,243,0.06) 0%, rgba(255,255,255,0) 100%)',
      }}
    >
      {/* Header */}
      <Box sx={{ px: 3, pt: 2.5, pb: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
            <SmartToyIcon sx={{ color: 'primary.main', fontSize: 22 }} />
            <Typography variant="h6" fontWeight={700}>Welcome to HealthQ Copilot</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Your AI-powered clinical operations platform — here's how to get started.
          </Typography>
        </Box>
        <IconButton size="small" onClick={dismiss} aria-label="Dismiss welcome card" sx={{ mt: -0.5 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Divider sx={{ mx: 3, my: 2 }} />

      <Box sx={{ px: 3, pb: 2.5 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
          {/* Quick start steps */}
          <Box flex={1}>
            <Typography variant="overline" fontWeight={700} color="text.secondary" sx={{ letterSpacing: '0.08em' }}>
              Get started
            </Typography>
            <Stack spacing={1} mt={1}>
              {STEPS.map((step, i) => (
                <Stack key={i} direction="row" alignItems="flex-start" spacing={1}>
                  <CheckCircleOutlineIcon sx={{ color: 'primary.main', fontSize: 16, mt: 0.15 }} />
                  <Typography variant="body2" color="text.secondary">{step}</Typography>
                </Stack>
              ))}
            </Stack>
          </Box>

          {/* Quick actions */}
          <Box>
            <Typography variant="overline" fontWeight={700} color="text.secondary" sx={{ letterSpacing: '0.08em' }}>
              Quick actions
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1} mt={1}>
              {QUICK_ACTIONS.map(action => (
                <Chip
                  key={action.href}
                  icon={<Box sx={{ color: action.color, display: 'flex', alignItems: 'center' }}>{action.icon}</Box>}
                  label={action.label}
                  variant="outlined"
                  clickable
                  onClick={() => navigate(action.href)}
                  sx={{ fontSize: '0.75rem', borderColor: 'divider', '&:hover': { borderColor: action.color } }}
                />
              ))}
            </Stack>
            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1.5 }}>
              Press <strong>Ctrl+K</strong> (or <strong>⌘K</strong>) anywhere to search all pages.
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Paper>
  );
}
