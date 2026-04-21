/**
 * DashboardCustomizer — popover-based widget to toggle which stat sections
 * are visible on the Dashboard.
 *
 * Storage key : 'hq:dashboard-sections'
 * Shape        : string[]  — array of VISIBLE section keys
 *
 * Default (all sections visible): ['clinical', 'scheduling', 'population', 'revenue']
 */
import { useState } from 'react';
import Popover from '@mui/material/Popover';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import TuneIcon from '@mui/icons-material/Tune';

// ── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'hq:dashboard-sections';

export const ALL_SECTIONS = ['clinical', 'scheduling', 'population', 'revenue'] as const;
export type  DashboardSection = typeof ALL_SECTIONS[number];

const SECTION_LABELS: Record<DashboardSection, string> = {
  clinical:   'Clinical',
  scheduling: 'Scheduling',
  population: 'Population Health',
  revenue:    'Revenue Cycle',
};

// ── Storage helpers ───────────────────────────────────────────────────────────

export function loadVisibleSections(): DashboardSection[] {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (Array.isArray(stored) && stored.length > 0) return stored as DashboardSection[];
  } catch {
    // fall through
  }
  return [...ALL_SECTIONS]; // default: all visible
}

function saveVisibleSections(sections: DashboardSection[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
}

// ── Component ─────────────────────────────────────────────────────────────────

interface DashboardCustomizerProps {
  /** Called whenever the visible-section set changes */
  onChange: (visible: DashboardSection[]) => void;
}

export function DashboardCustomizer({ onChange }: DashboardCustomizerProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [visible,  setVisible]  = useState<DashboardSection[]>(loadVisibleSections);

  const open = Boolean(anchorEl);

  const toggle = (section: DashboardSection) => {
    setVisible(prev => {
      const next = prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section];
      // Keep at least one section visible
      const safe = next.length === 0 ? prev : next;
      saveVisibleSections(safe);
      onChange(safe);
      return safe;
    });
  };

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };

  return (
    <>
      <Tooltip title="Customize dashboard">
        <IconButton
          size="small"
          onClick={handleOpen}
          aria-label="Customize dashboard"
          sx={{ ml: 1 }}
        >
          <TuneIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top',    horizontal: 'right' }}
        PaperProps={{ sx: { width: 240, p: 0 } }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" fontWeight={700}>Customize Dashboard</Typography>
          <Typography variant="caption" color="text.secondary">Show or hide stat sections</Typography>
        </Box>
        <Box sx={{ px: 1.5, py: 1 }}>
          {ALL_SECTIONS.map((section, i) => (
            <Box key={section}>
              {i > 0 && <Divider sx={{ my: 0.5 }} />}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={visible.includes(section)}
                    onChange={() => toggle(section)}
                    size="small"
                    inputProps={{ 'aria-label': SECTION_LABELS[section] }}
                  />
                }
                label={
                  <Typography variant="body2">{SECTION_LABELS[section]}</Typography>
                }
                sx={{ width: '100%', mx: 0 }}
              />
            </Box>
          ))}
        </Box>
        <Box sx={{ px: 2, py: 1, borderTop: 1, borderColor: 'divider' }}>
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ fontStyle: 'italic' }}
          >
            At least one section must be visible
          </Typography>
        </Box>
      </Popover>
    </>
  );
}
