import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import HistoryIcon from '@mui/icons-material/History';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Card, CardHeader, CardTitle, CardContent } from '@healthcare/design-system';
import { loadRecentPages, type RecentPage } from './PageTracker';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m    = Math.floor(diff / 60_000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h    = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RecentPagesWidget() {
  const navigate = useNavigate();
  const [pages, setPages] = useState<RecentPage[]>([]);

  useEffect(() => {
    setPages(loadRecentPages().slice(0, 6));
  }, []);

  const clearHistory = () => {
    localStorage.removeItem('hq:recent-pages');
    setPages([]);
  };

  if (pages.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            <HistoryIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <CardTitle>Recently Visited</CardTitle>
          </Stack>
          <Tooltip title="Clear history">
            <IconButton size="small" onClick={clearHistory} aria-label="Clear recent pages">
              <DeleteSweepIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </CardHeader>
      <CardContent sx={{ pt: 0 }}>
        {pages.map((page, idx) => (
          <Box key={page.href}>
            {idx > 0 && <Divider />}
            <Box
              role="button"
              tabIndex={0}
              onClick={() => navigate(page.href)}
              onKeyDown={(e) => e.key === 'Enter' && navigate(page.href)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 1,
                px: 0.5,
                borderRadius: 1,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
                transition: 'background 0.12s',
              }}
            >
              <Box>
                <Typography variant="body2" fontWeight={500}>
                  {page.label}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  {formatRelative(page.visitedAt)}
                </Typography>
              </Box>
              <ChevronRightIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
            </Box>
          </Box>
        ))}
      </CardContent>
    </Card>
  );
}
