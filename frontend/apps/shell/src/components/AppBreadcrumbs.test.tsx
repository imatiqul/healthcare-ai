import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { AppBreadcrumbs } from './AppBreadcrumbs';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppBreadcrumbs />
    </MemoryRouter>
  );
}

describe('AppBreadcrumbs', () => {
  it('renders nothing on root path', () => {
    const { container } = renderAt('/');
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing on demo routes', () => {
    const { container } = renderAt('/demo');
    expect(container.firstChild).toBeNull();
  });

  it('shows Home link and Admin label on /admin', () => {
    renderAt('/admin');
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('shows nested breadcrumbs for /admin/users', () => {
    renderAt('/admin/users');
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
  });

  it('renders last segment as non-link (plain text)', () => {
    renderAt('/admin/audit');
    const auditEl = screen.getByText('Audit Log');
    // The last crumb is a Typography (span), not an anchor
    expect(auditEl.closest('a')).toBeNull();
  });

  it('shows AI Governance label on /governance', () => {
    renderAt('/governance');
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByText('AI Governance')).toBeInTheDocument();
  });

  it('shows Notification Center on /notifications', () => {
    renderAt('/notifications');
    expect(screen.getByText('Notification Center')).toBeInTheDocument();
  });
});
