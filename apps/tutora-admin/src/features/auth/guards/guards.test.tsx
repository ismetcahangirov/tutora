import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';

import type { AuthStatus, AuthUser } from '../types';
import { useAuthStore } from '../store/auth-store';
import { ProtectedRoute } from './ProtectedRoute';
import { RequirePermission } from './RequirePermission';

const adminUser: AuthUser = {
  id: 'u1',
  email: 'admin@tutora.app',
  name: 'Admin',
  avatarUrl: null,
  role: 'ADMIN',
  onboardingCompleted: true,
};

function setAuth(status: AuthStatus, user: AuthUser | null = null) {
  useAuthStore.setState({ status, user, isSigningIn: false, error: null });
}

function renderProtected() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route index element={<div>protected content</div>} />
        </Route>
        <Route path="/login" element={<div>login page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute (#60)', () => {
  beforeEach(() => setAuth('restoring'));

  it('shows a loader while the session is restoring', () => {
    setAuth('restoring');
    renderProtected();
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
  });

  it('redirects to sign-in when unauthenticated', () => {
    setAuth('unauthenticated');
    renderProtected();
    expect(screen.getByText('login page')).toBeInTheDocument();
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
  });

  it('renders the outlet when authenticated', () => {
    setAuth('authenticated', adminUser);
    renderProtected();
    expect(screen.getByText('protected content')).toBeInTheDocument();
  });
});

describe('RequirePermission (#60)', () => {
  it('renders children when the admin holds the permission', () => {
    setAuth('authenticated', adminUser);
    render(
      <RequirePermission permission="users:manage">
        <div>section body</div>
      </RequirePermission>,
    );
    expect(screen.getByText('section body')).toBeInTheDocument();
  });

  it('hides children and shows the forbidden state without the permission', () => {
    setAuth('authenticated', { ...adminUser, role: 'TUTOR' });
    render(
      <RequirePermission permission="users:manage">
        <div>section body</div>
      </RequirePermission>,
    );
    expect(screen.queryByText('section body')).not.toBeInTheDocument();
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });
});
