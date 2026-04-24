/**
 * CommandPalette — global Ctrl+K / Cmd+K search & navigation.
 *
 * Displays all navigable routes organised by section.  Filters in-place as
 * the user types.  Keyboard-navigable (↑ ↓ Enter Escape).  Persists the
 * five most-recent visits to localStorage so they surface first in the list.
 */
import {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { useNavigate } from 'react-router-dom';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import TextField from '@mui/material/TextField';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MicIcon from '@mui/icons-material/Mic';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';
import PersonIcon from '@mui/icons-material/Person';
import BarChartIcon from '@mui/icons-material/BarChart';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ApartmentIcon from '@mui/icons-material/Apartment';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import BadgeIcon from '@mui/icons-material/Badge';
import PolicyIcon from '@mui/icons-material/Policy';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import RateReviewIcon from '@mui/icons-material/RateReview';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import HistoryIcon from '@mui/icons-material/History';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

const RECENT_KEY = 'hq:cmd-recent';
const MAX_RECENT = 5;

interface NavEntry {
  href:     string;
  label:    string;
  group:    string;
  keywords: string[];
  icon:     React.ReactNode;
}

const ALL_ROUTES: NavEntry[] = [
  // Main
  { href: '/',                    label: 'Dashboard',           group: 'Main',        keywords: ['home', 'overview', 'summary'],                     icon: <DashboardIcon /> },
  { href: '/business',            label: 'Business KPIs',       group: 'Business',    keywords: ['kpi', 'executive', 'revenue', 'tenants'],          icon: <BarChartIcon /> },
  { href: '/workflow-ops',        label: 'Workflow Operations', group: 'Business',    keywords: ['workflow', 'operations', 'review', 'waitlist'],    icon: <AccessTimeIcon /> },
  // Clinical
  { href: '/voice',               label: 'Voice Sessions',      group: 'Clinical',    keywords: ['voice', 'audio', 'transcript'],                    icon: <MicIcon /> },
  { href: '/triage',              label: 'AI Triage',           group: 'Clinical',    keywords: ['triage', 'icd', 'assessment', 'ai'],               icon: <SmartToyIcon /> },
  { href: '/encounters',          label: 'Encounters',          group: 'Clinical',    keywords: ['encounter', 'medication', 'allergy', 'fhir'],       icon: <MedicalInformationIcon /> },
  { href: '/scheduling',          label: 'Scheduling',          group: 'Clinical',    keywords: ['schedule', 'appointment', 'slot', 'booking'],       icon: <CalendarMonthIcon /> },
  // Analytics
  { href: '/population-health',   label: 'Population Health',   group: 'Analytics',   keywords: ['population', 'risk', 'hedis', 'sdoh', 'care gap'], icon: <TrendingUpIcon /> },
  { href: '/revenue',             label: 'Revenue Cycle',       group: 'Analytics',   keywords: ['revenue', 'billing', 'coding', 'claim', 'denial'],  icon: <AttachMoneyIcon /> },
  // Patient
  { href: '/patient-portal',      label: 'Patient Portal',      group: 'Patient',     keywords: ['patient', 'consent', 'registration', 'otp'],        icon: <PersonIcon /> },
  // Governance
  { href: '/governance',          label: 'AI Governance',       group: 'Governance',  keywords: ['model', 'governance', 'experiment', 'xai', 'eval'], icon: <AccountBalanceIcon /> },
  // Admin
  { href: '/tenants',             label: 'Tenants',             group: 'Admin',       keywords: ['tenant', 'organisation', 'onboarding'],             icon: <ApartmentIcon /> },
  { href: '/admin/users',         label: 'Users',               group: 'Admin',       keywords: ['user', 'identity', 'account'],                      icon: <ManageAccountsIcon /> },
  { href: '/admin/practitioners', label: 'Practitioners',       group: 'Admin',       keywords: ['practitioner', 'clinician', 'doctor'],              icon: <BadgeIcon /> },
  { href: '/admin/audit',         label: 'Audit Log',           group: 'Admin',       keywords: ['audit', 'log', 'hipaa', 'export'],                  icon: <PolicyIcon /> },
  { href: '/admin/break-glass',   label: 'Break-Glass Access',  group: 'Admin',       keywords: ['break glass', 'emergency', 'phi', 'access'],        icon: <LockOpenIcon /> },
  { href: '/admin/feedback',      label: 'AI Feedback',         group: 'Admin',       keywords: ['feedback', 'clinician', 'rag', 'correction'],       icon: <RateReviewIcon /> },
  { href: '/admin/health',        label: 'Platform Health',     group: 'Admin',       keywords: ['health', 'uptime', 'service', 'status'],            icon: <MonitorHeartIcon /> },
  { href: '/admin/demo',          label: 'Demo Admin',          group: 'Admin',       keywords: ['demo', 'gtm', 'nps', 'session'],                    icon: <SlideshowIcon /> },
  { href: '/admin/guide-history', label: 'Guide History',       group: 'Admin',       keywords: ['guide', 'chat', 'history', 'copilot'],              icon: <HistoryIcon /> },
  { href: '/admin',               label: 'Admin Settings',      group: 'Admin',       keywords: ['admin', 'settings', 'config'],                      icon: <AdminPanelSettingsIcon /> },
];

function loadRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveRecent(href: string) {
  try {
    const prev = loadRecent().filter(h => h !== href);
    localStorage.setItem(RECENT_KEY, JSON.stringify([href, ...prev].slice(0, MAX_RECENT)));
  } catch {
    // ignore
  }
}

const GROUP_ORDER = ['Recent', 'Main', 'Business', 'Clinical', 'Analytics', 'Patient', 'Governance', 'Admin'];

function groupedResults(
  entries: NavEntry[],
  recentHrefs: string[],
  query: string,
): Map<string, NavEntry[]> {
  const q = query.trim().toLowerCase();

  // When no query, show recent items first, then all routes
  if (!q) {
    const recentItems = recentHrefs
      .map(href => ALL_ROUTES.find(r => r.href === href))
      .filter((r): r is NavEntry => !!r);
    const map = new Map<string, NavEntry[]>();
    if (recentItems.length) map.set('Recent', recentItems);
    for (const entry of entries) {
      const g = entry.group;
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(entry);
    }
    return map;
  }

  const matches = entries.filter(e =>
    e.label.toLowerCase().includes(q) ||
    e.group.toLowerCase().includes(q) ||
    e.keywords.some(k => k.includes(q))
  );

  const map = new Map<string, NavEntry[]>();
  for (const entry of matches) {
    const g = entry.group;
    if (!map.has(g)) map.set(g, []);
    map.get(g)!.push(entry);
  }
  return map;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate   = useNavigate();
  const inputRef   = useRef<HTMLInputElement>(null);
  const listRef    = useRef<HTMLUListElement>(null);
  const [query,    setQuery]    = useState('');
  const [selected, setSelected] = useState(0);
  const [recent,   setRecent]   = useState<string[]>([]);

  // Reset state when palette opens
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setRecent(loadRecent());
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const grouped = useMemo(
    () => groupedResults(ALL_ROUTES, recent, query),
    [query, recent]
  );

  // Flatten for keyboard navigation
  const flat = useMemo(() => {
    const order = GROUP_ORDER.filter(g => grouped.has(g));
    return order.flatMap(g => grouped.get(g)!);
  }, [grouped]);

  const go = useCallback((entry: NavEntry) => {
    saveRecent(entry.href);
    onClose();
    navigate(entry.href);
  }, [navigate, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected(s => Math.min(s + 1, flat.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected(s => Math.max(s - 1, 0));
    } else if (e.key === 'Enter') {
      const entry = flat[selected];
      if (entry) go(entry);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // Reset selection when results change
  useEffect(() => { setSelected(0); }, [flat.length]);

  // Scroll selected item into view
  useEffect(() => {
    const item = listRef.current?.children[selected] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  const groupKeys = GROUP_ORDER.filter(g => grouped.has(g));
  let globalIndex = 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3,
          mt: '10vh',
          mx: 2,
          maxHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
      }}
      BackdropProps={{ sx: { backdropFilter: 'blur(4px)' } }}
    >
      {/* ── Search input ── */}
      <Box sx={{ px: 2, pt: 2, pb: 1, borderBottom: 1, borderColor: 'divider' }}>
        <TextField
          inputRef={inputRef}
          fullWidth
          size="small"
          placeholder="Search pages, actions…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': { borderRadius: 2 },
            '& fieldset': { border: 'none' },
            bgcolor: 'action.hover',
            borderRadius: 2,
          }}
        />
      </Box>

      {/* ── Results ── */}
      <DialogContent sx={{ p: 0, overflowY: 'auto' }}>
        {flat.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">No results for "{query}"</Typography>
          </Box>
        ) : (
          <List dense disablePadding ref={listRef}>
            {groupKeys.map(group => {
              const items = grouped.get(group)!;
              return (
                <Box key={group}>
                  <Box sx={{ px: 2, pt: 1.5, pb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    {group === 'Recent' && <AccessTimeIcon sx={{ fontSize: 13, color: 'text.disabled' }} />}
                    <Typography variant="overline" sx={{ fontSize: '0.65rem', letterSpacing: '0.08em', color: 'text.disabled', lineHeight: 1 }}>
                      {group}
                    </Typography>
                  </Box>
                  {items.map(entry => {
                    const idx = globalIndex++;
                    const isSelected = idx === selected;
                    return (
                      <ListItemButton
                        key={`${group}-${entry.href}`}
                        selected={isSelected}
                        onClick={() => go(entry)}
                        sx={{
                          mx: 1,
                          mb: 0.25,
                          borderRadius: 1.5,
                          '&.Mui-selected': { bgcolor: 'primary.main', color: 'primary.contrastText' },
                          '&.Mui-selected .MuiListItemIcon-root': { color: 'primary.contrastText' },
                          '&.Mui-selected .MuiTypography-root': { color: 'primary.contrastText' },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 34, color: isSelected ? 'primary.contrastText' : 'text.secondary' }}>
                          <Box sx={{ '& .MuiSvgIcon-root': { fontSize: 18 } }}>{entry.icon}</Box>
                        </ListItemIcon>
                        <ListItemText
                          primary={entry.label}
                          primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                        />
                        {!query && group === 'Recent' && (
                          <AccessTimeIcon sx={{ fontSize: 14, color: isSelected ? 'primary.contrastText' : 'text.disabled', ml: 1 }} />
                        )}
                      </ListItemButton>
                    );
                  })}
                  <Divider sx={{ mx: 2, my: 0.5, opacity: 0.4 }} />
                </Box>
              );
            })}
          </List>
        )}
      </DialogContent>

      {/* ── Footer hint ── */}
      <Box sx={{ px: 2, py: 0.75, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1, alignItems: 'center', bgcolor: 'action.hover' }}>
        <Chip label="↑ ↓ navigate" size="small" variant="outlined" sx={{ fontSize: '0.62rem', height: 20 }} />
        <Chip label="↵ open" size="small" variant="outlined" sx={{ fontSize: '0.62rem', height: 20 }} />
        <Chip label="Esc close" size="small" variant="outlined" sx={{ fontSize: '0.62rem', height: 20 }} />
        <Box sx={{ flex: 1 }} />
        <Typography variant="caption" color="text.disabled">Ctrl+K</Typography>
      </Box>
    </Dialog>
  );
}

/** Hook that registers the global Ctrl+K / Cmd+K shortcut. */
export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  const openPalette  = useCallback(() => setOpen(true),  []);
  const closePalette = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return { open, openPalette, closePalette };
}
