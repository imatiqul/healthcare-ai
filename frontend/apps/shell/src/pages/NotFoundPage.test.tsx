import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotFoundPage from './NotFoundPage';

vi.mock('@healthcare/design-system', () => ({
  SkeletonStatGrid: () => null,
  Card: ({ children }: any) => <div>{children}</div>,
}));

function renderPage(path = '/unknown') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <NotFoundPage />
    </MemoryRouter>
  );
}

describe('NotFoundPage', () => {
  it('renders the 404 heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /404/i })).toBeInTheDocument();
  });

  it('renders the explanatory text', () => {
    renderPage();
    expect(screen.getByText(/doesn't exist or may have been moved/i)).toBeInTheDocument();
  });

  it('renders Go to Dashboard button', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /Go to Dashboard/i })).toBeInTheDocument();
  });

  it('renders Go Back button', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /Go Back/i })).toBeInTheDocument();
  });

  it('renders the quick-link chips', () => {
    renderPage();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('AI Triage')).toBeInTheDocument();
    expect(screen.getByText('Scheduling')).toBeInTheDocument();
    expect(screen.getByText('Population Health')).toBeInTheDocument();
  });

  it('has the accessible page-not-found container label', () => {
    renderPage();
    expect(screen.getByLabelText('Page not found')).toBeInTheDocument();
  });
});
