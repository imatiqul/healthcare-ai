/**
 * ContextualHelpPanel — slide-in Drawer with route-specific tips.
 *
 * A "?" icon button in the TopNav opens this panel.
 * Content is determined by the current pathname.
 */
import { useLocation } from 'react-router-dom';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';

// ── Help content map ──────────────────────────────────────────────────────────

interface HelpContent {
  title:    string;
  summary:  string;
  tips:     string[];
  shortcut?: string;
}

const HELP_MAP: Record<string, HelpContent> = {
  '/': {
    title:   'Dashboard',
    summary: 'Your central command center for real-time clinical and operational metrics.',
    tips: [
      'Click any stat card to navigate directly to that module.',
      'Star pages in the sidebar to pin them to the Dashboard.',
      'Use Ctrl+K to quickly search and navigate anywhere in the platform.',
      'The Dashboard auto-refreshes via SignalR when new data arrives.',
      'Use the Customize button to show or hide stat sections.',
    ],
    shortcut: 'Ctrl+K — Command palette',
  },
  '/triage': {
    title:   'AI Triage',
    summary: 'Review and act on AI-generated triage assessments for incoming patients.',
    tips: [
      'P1/P2 cases are highlighted in red — review these first.',
      'Click a triage card to see the full AI explanation and confidence score.',
      'Use the filter bar to narrow by urgency level or status.',
      'Clinician feedback improves the AI model — always rate assessments.',
    ],
  },
  '/scheduling': {
    title:   'Scheduling',
    summary: 'Manage appointment slots, bookings, and waitlists across all providers.',
    tips: [
      'Drag a slot on the calendar to reschedule an appointment.',
      'The Waitlist tab shows patients awaiting next available slot.',
      'Use the Booking Form to capture insurance and referral details.',
    ],
  },
  '/encounters': {
    title:   'Encounters',
    summary: 'Clinical encounter management including medications, labs, and FHIR records.',
    tips: [
      'Drug Interaction Checker runs automatically when medications are added.',
      'Lab Delta Flags highlight significant changes since last visit.',
      'FHIR Observation Viewer shows structured clinical observations.',
    ],
  },
  '/population-health': {
    title:   'Population Health',
    summary: 'Identify high-risk patient cohorts and close care gaps at scale.',
    tips: [
      'Risk Trajectory panel shows 6-month risk score trend per patient.',
      'Care Gap List is pre-filtered to your assigned panel by default.',
      'HEDIS measures are updated nightly from the data pipeline.',
    ],
  },
  '/revenue': {
    title:   'Revenue Cycle',
    summary: 'Manage coding queues, prior authorizations, and claim denials.',
    tips: [
      'Denial Manager groups claims by root cause for batch appeals.',
      'Prior Auth Tracker shows real-time payer response status.',
      'The coding queue is AI-suggested — review and confirm each code.',
    ],
  },
  '/patient-portal': {
    title:   'Patient Portal',
    summary: 'Patient engagement, consent management, and outreach campaigns.',
    tips: [
      'Consent records are FHIR R4 compliant and audit-logged.',
      'Campaign Manager lets you send targeted outreach by cohort.',
      'Push Subscription panel manages patient notification preferences.',
    ],
  },
  '/governance': {
    title:   'AI Governance',
    summary: 'Monitor AI model performance, fairness, and regulatory compliance.',
    tips: [
      'Model Registry tracks all deployed models and their versions.',
      'XAI Explanations show feature importance for each prediction.',
      'Experiment Summary compares model variants before promotion.',
    ],
  },
  '/notifications': {
    title:   'Notification Center',
    summary: 'Review, filter, and manage all system and patient notifications.',
    tips: [
      'Filter by severity to prioritize critical alerts.',
      'Mark all as read to clear the badge count in the top bar.',
    ],
  },
  '/admin': {
    title:   'Admin Settings',
    summary: 'Configure global platform settings, integrations, and feature flags.',
    tips: [
      'Changes take effect immediately without a page reload.',
      'Feature flags let you enable preview features per tenant.',
    ],
  },
  '/admin/preferences': {
    title:   'Preferences',
    summary: 'Personalise your HealthQ Copilot experience.',
    tips: [
      'Set a default landing page to go straight to your most-used module.',
      'Compact sidebar mode gives more screen space for clinical views.',
      'Date format changes apply across all tables and timelines.',
    ],
  },
};

const DEFAULT_HELP: HelpContent = {
  title:   'HealthQ Copilot Help',
  summary: 'An AI-powered clinical operations platform built for healthcare teams.',
  tips: [
    'Use Ctrl+K to search and navigate anywhere instantly.',
    'Star sidebar items to pin frequently visited pages to the Dashboard.',
    'The "?" button on each page shows context-specific tips.',
    'Check Notifications (bell icon) for live clinical alerts.',
    'Visit Preferences under Admin to personalise your experience.',
  ],
  shortcut: 'Ctrl+K — Command palette',
};

function getBestHelp(pathname: string): HelpContent {
  if (HELP_MAP[pathname]) return HELP_MAP[pathname];
  // Prefix match (e.g. /admin/users → /admin)
  const prefix = Object.keys(HELP_MAP)
    .filter(k => k !== '/' && pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0];
  return prefix ? HELP_MAP[prefix] : DEFAULT_HELP;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface ContextualHelpPanelProps {
  open:    boolean;
  onClose: () => void;
}

export function ContextualHelpPanel({ open, onClose }: ContextualHelpPanelProps) {
  const { pathname } = useLocation();
  const help = getBestHelp(pathname);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100vw', sm: 360 }, p: 0 } }}
      aria-label="Help panel"
    >
      {/* Header */}
      <Box
        sx={{
          px: 2.5,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <HelpOutlineIcon />
          <Typography variant="subtitle1" fontWeight={700}>Help — {help.title}</Typography>
        </Stack>
        <IconButton size="small" onClick={onClose} aria-label="Close help panel" sx={{ color: 'primary.contrastText' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Summary */}
      <Box sx={{ px: 2.5, py: 2 }}>
        <Typography variant="body2" color="text.secondary" lineHeight={1.6}>
          {help.summary}
        </Typography>
      </Box>

      <Divider />

      {/* Tips */}
      <Box sx={{ px: 2.5, pt: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
          <LightbulbOutlinedIcon fontSize="small" sx={{ color: 'warning.main' }} />
          <Typography variant="subtitle2" fontWeight={700}>Tips for this page</Typography>
        </Stack>
        <List dense disablePadding>
          {help.tips.map((tip, i) => (
            <ListItem key={i} disableGutters alignItems="flex-start" sx={{ py: 0.75 }}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  flexShrink: 0,
                  mr: 1.5,
                  mt: 0.15,
                }}
              >
                {i + 1}
              </Box>
              <ListItemText
                primary={tip}
                primaryTypographyProps={{ variant: 'body2', lineHeight: 1.5 }}
              />
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Keyboard shortcut hint */}
      {help.shortcut && (
        <>
          <Divider sx={{ mt: 2 }} />
          <Box sx={{ px: 2.5, py: 2 }}>
            <Typography variant="caption" color="text.disabled" fontWeight={600}>
              KEYBOARD SHORTCUT
            </Typography>
            <Typography variant="body2" mt={0.5}>
              {help.shortcut}
            </Typography>
          </Box>
        </>
      )}
    </Drawer>
  );
}
