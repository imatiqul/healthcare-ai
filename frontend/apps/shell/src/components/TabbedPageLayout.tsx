import { useState, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TabConfig {
  label:   string;
  icon?:   ReactNode;
  content: ReactNode;
}

interface TabbedPageLayoutProps {
  tabs:        TabConfig[];
  title?:      string;
  storageKey?: string; // sessionStorage key for persisting active tab index
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TabbedPageLayout({ tabs, title, storageKey }: TabbedPageLayoutProps) {
  const [activeTab, setActiveTab] = useState<number>(() => {
    if (!storageKey) return 0;
    try {
      const saved = sessionStorage.getItem(storageKey);
      const idx   = saved !== null ? parseInt(saved, 10) : 0;
      return Number.isFinite(idx) && idx >= 0 && idx < tabs.length ? idx : 0;
    } catch {
      return 0;
    }
  });

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    if (storageKey) {
      try { sessionStorage.setItem(storageKey, String(newValue)); } catch { /* quota */ }
    }
  };

  return (
    <Box>
      {title && (
        <Typography variant="h5" fontWeight={700} mb={2}>
          {title}
        </Typography>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={handleChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label={title ? `${title} navigation tabs` : 'page navigation tabs'}
          sx={{
            '& .MuiTab-root': {
              minHeight: 44,
              textTransform: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
            },
          }}
        >
          {tabs.map((tab, i) => (
            <Tab
              key={tab.label}
              label={tab.label}
              {...(tab.icon
                ? { icon: tab.icon as any, iconPosition: 'start' as const }
                : {})}
              id={`tab-${i}`}
              aria-controls={`tabpanel-${i}`}
            />
          ))}
        </Tabs>
      </Box>

      <Box mt={3}>
        {tabs.map((tab, i) => (
          <Box
            key={tab.label}
            role="tabpanel"
            id={`tabpanel-${i}`}
            aria-labelledby={`tab-${i}`}
          >
            {activeTab === i && tab.content}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
