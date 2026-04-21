/**
 * NotFoundPage — 404 catch-all page shown when a URL does not match any
 * registered route.  Provides friendly navigation back to known destinations.
 */
import { useNavigate, Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import HomeIcon from '@mui/icons-material/Home';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PersonIcon from '@mui/icons-material/Person';

// ── Quick-link shortcuts ──────────────────────────────────────────────────────

const QUICK_LINKS = [
  { label: 'Dashboard',        href: '/',                  icon: <DashboardIcon     fontSize="small" /> },
  { label: 'AI Triage',        href: '/triage',             icon: <SmartToyIcon      fontSize="small" /> },
  { label: 'Scheduling',       href: '/scheduling',         icon: <CalendarMonthIcon fontSize="small" /> },
  { label: 'Population Health',href: '/population-health',  icon: <TrendingUpIcon    fontSize="small" /> },
  { label: 'Patient Portal',   href: '/patient-portal',     icon: <PersonIcon        fontSize="small" /> },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        textAlign:      'center',
        py: 10,
        px: 3,
        maxWidth: 560,
        mx: 'auto',
      }}
      aria-label="Page not found"
    >
      <SearchOffIcon sx={{ fontSize: 96, color: 'text.disabled', mb: 3 }} />

      <Typography variant="h4" fontWeight={700} gutterBottom>
        404 — Page Not Found
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        The page you're looking for doesn't exist or may have been moved.
        Check the URL or use the navigation below to find what you need.
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mb: 5 }}>
        <Button
          variant="contained"
          startIcon={<HomeIcon />}
          onClick={() => navigate('/')}
          aria-label="Go to Dashboard"
        >
          Go to Dashboard
        </Button>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          Go Back
        </Button>
      </Stack>

      <Divider sx={{ width: '100%', mb: 3 }} />

      <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
        Jump to a common section
      </Typography>

      <Stack direction="row" flexWrap="wrap" gap={1} justifyContent="center">
        {QUICK_LINKS.map(link => (
          <Chip
            key={link.href}
            icon={link.icon}
            label={link.label}
            component={Link}
            to={link.href}
            clickable
            size="small"
          />
        ))}
      </Stack>
    </Box>
  );
}
