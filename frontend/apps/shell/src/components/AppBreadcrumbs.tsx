import { Link, useLocation } from 'react-router-dom';
import MuiBreadcrumbs from '@mui/material/Breadcrumbs';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

// ── Route label map ──────────────────────────────────────────────────────────

const ROUTE_LABELS: Record<string, string> = {
  voice:               'Voice Sessions',
  triage:              'Triage',
  encounters:          'Encounters',
  scheduling:          'Scheduling',
  'population-health': 'Population Health',
  revenue:             'Revenue Cycle',
  'patient-portal':    'Patient Portal',
  governance:          'AI Governance',
  tenants:             'Tenants',
  notifications:       'Notification Center',
  business:            'Business KPIs',
  admin:               'Admin',
  users:               'Users',
  practitioners:       'Practitioners',
  audit:               'Audit Log',
  'break-glass':       'Break-Glass',
  feedback:            'AI Feedback',
  health:              'Platform Health',
  demo:                'Demo Admin',
  'guide-history':     'Guide History',
  profile:             'My Profile',
};

// ── Component ─────────────────────────────────────────────────────────────────

export function AppBreadcrumbs() {
  const { pathname } = useLocation();

  // Hide on root and demo routes
  if (pathname === '/' || pathname.startsWith('/demo')) return null;

  const segments = pathname.split('/').filter(Boolean);
  const crumbs = segments.map((seg, idx) => ({
    label:  ROUTE_LABELS[seg] ?? seg,
    href:   '/' + segments.slice(0, idx + 1).join('/'),
    isLast: idx === segments.length - 1,
  }));

  return (
    <Box
      sx={{
        px: 3,
        py: 0.75,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        flexShrink: 0,
      }}
    >
      <MuiBreadcrumbs
        separator={<NavigateNextIcon sx={{ fontSize: 13 }} />}
        aria-label="breadcrumb"
        sx={{ '& .MuiBreadcrumbs-ol': { flexWrap: 'nowrap', alignItems: 'center' } }}
      >
        {/* Home */}
        <Link
          to="/"
          aria-label="Home"
          style={{ display: 'flex', alignItems: 'center', color: 'inherit', textDecoration: 'none' }}
        >
          <HomeIcon sx={{ fontSize: 14 }} />
        </Link>

        {/* Path segments */}
        {crumbs.map((crumb) =>
          crumb.isLast ? (
            <Typography
              key={crumb.href}
              color="text.primary"
              variant="caption"
              fontWeight={600}
              noWrap
            >
              {crumb.label}
            </Typography>
          ) : (
            <Link
              key={crumb.href}
              to={crumb.href}
              style={{ color: 'inherit', textDecoration: 'none' }}
            >
              <Typography variant="caption" color="text.secondary" noWrap>
                {crumb.label}
              </Typography>
            </Link>
          )
        )}
      </MuiBreadcrumbs>
    </Box>
  );
}
