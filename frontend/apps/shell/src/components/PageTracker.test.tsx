import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PageTracker, loadRecentPages } from './PageTracker';

beforeEach(() => {
  localStorage.clear();
});

describe('PageTracker', () => {
  it('records a page visit to localStorage', () => {
    render(
      <MemoryRouter initialEntries={['/triage']}>
        <PageTracker />
      </MemoryRouter>
    );
    const pages = loadRecentPages();
    expect(pages).toHaveLength(1);
    expect(pages[0].href).toBe('/triage');
    expect(pages[0].label).toBe('Triage');
  });

  it('uses friendly label from ROUTE_LABELS map', () => {
    render(
      <MemoryRouter initialEntries={['/population-health']}>
        <PageTracker />
      </MemoryRouter>
    );
    const pages = loadRecentPages();
    expect(pages[0].label).toBe('Population Health');
  });

  it('uses pathname as label when route not in map', () => {
    render(
      <MemoryRouter initialEntries={['/unknown-route']}>
        <PageTracker />
      </MemoryRouter>
    );
    const pages = loadRecentPages();
    expect(pages[0].label).toBe('/unknown-route');
  });

  it('deduplicates — revisiting the same page only keeps one entry', () => {
    // Record the same page twice via separate renders
    render(
      <MemoryRouter initialEntries={['/triage']}>
        <PageTracker />
      </MemoryRouter>
    );
    render(
      <MemoryRouter initialEntries={['/triage']}>
        <PageTracker />
      </MemoryRouter>
    );
    const pages = loadRecentPages();
    const triageEntries = pages.filter(p => p.href === '/triage');
    expect(triageEntries).toHaveLength(1);
  });

  it('skips demo routes', () => {
    render(
      <MemoryRouter initialEntries={['/demo/live']}>
        <PageTracker />
      </MemoryRouter>
    );
    expect(loadRecentPages()).toHaveLength(0);
  });

  it('prepends new visit — most recent is first', () => {
    render(
      <MemoryRouter initialEntries={['/triage']}>
        <PageTracker />
      </MemoryRouter>
    );
    render(
      <MemoryRouter initialEntries={['/scheduling']}>
        <PageTracker />
      </MemoryRouter>
    );
    const pages = loadRecentPages();
    expect(pages[0].href).toBe('/scheduling');
    expect(pages[1].href).toBe('/triage');
  });

  it('loadRecentPages returns empty array on corrupted storage', () => {
    localStorage.setItem('hq:recent-pages', 'not-json');
    expect(loadRecentPages()).toEqual([]);
  });
});
