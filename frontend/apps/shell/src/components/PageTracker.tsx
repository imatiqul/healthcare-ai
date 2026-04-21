import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// ── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'hq:recent-pages';
const MAX_ITEMS   = 10;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RecentPage {
  href:      string;
  label:     string;
  visitedAt: string; // ISO date string
}

// ── Label map ─────────────────────────────────────────────────────────────────

const PAGE_LABELS: Record<string, string> = {
  '/':                     'Dashboard',
  '/notifications':        'Notification Center',
  '/business':             'Business KPIs',
  '/voice':                'Voice Sessions',
  '/triage':               'Triage',
  '/encounters':           'Encounters',
  '/scheduling':           'Scheduling',
  '/population-health':    'Population Health',
  '/revenue':              'Revenue Cycle',
  '/patient-portal':       'Patient Portal',
  '/governance':           'AI Governance',
  '/tenants':              'Tenants',
  '/admin/users':          'Users',
  '/admin/practitioners':  'Practitioners',
  '/admin/audit':          'Audit Log',
  '/admin/break-glass':    'Break-Glass',
  '/admin/feedback':       'AI Feedback',
  '/admin/health':         'Platform Health',
  '/admin/demo':           'Demo Admin',
  '/admin/guide-history':  'Guide History',
  '/admin':                'Admin Settings',
  '/admin/profile':        'My Profile',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getLabel(pathname: string): string {
  return PAGE_LABELS[pathname] ?? pathname;
}

export function loadRecentPages(): RecentPage[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function recordVisit(pathname: string): void {
  // Skip demo routes and internal redirects
  if (pathname.startsWith('/demo')) return;

  const existing = loadRecentPages();
  const label    = getLabel(pathname);
  const now      = new Date().toISOString();

  // Deduplicate: remove existing entry for this path then prepend
  const filtered = existing.filter(p => p.href !== pathname);
  const updated  = [{ href: pathname, label, visitedAt: now }, ...filtered].slice(0, MAX_ITEMS);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * PageTracker — invisible component that records page visits to localStorage.
 * Mount once inside <Routes> (e.g. in App.tsx) so it has access to useLocation().
 */
export function PageTracker() {
  const { pathname } = useLocation();

  useEffect(() => {
    recordVisit(pathname);
  }, [pathname]);

  return null;
}
