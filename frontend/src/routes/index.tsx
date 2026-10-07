import type { ComponentType } from 'react';
import { Link, Navigate, Outlet, createBrowserRouter } from 'react-router';
import { AppShell } from './AppShell';
import { ProtectedRoute, PublicOnlyRoute } from './ProtectedRoute';

// Pages are lazy-loaded so the chart library only downloads when the dashboard is opened.
const page = (loader: () => Promise<{ default: ComponentType }>) => async () => ({ Component: (await loader()).default });

const NotFound = () => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-2">
    <p className="text-5xl font-semibold text-slate-300">404</p>
    <p className="text-slate-600">Page not found</p>
    <Link to="/dashboard" className="text-brand-600 hover:underline">
      Back to dashboard
    </Link>
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <PublicOnlyRoute>
        <Outlet />
      </PublicOnlyRoute>
    ),
    children: [{ index: true, lazy: page(() => import('@/pages/LoginPage')) }],
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', lazy: page(() => import('@/pages/DashboardPage')) },
      { path: 'segments', lazy: page(() => import('@/pages/SegmentationPage')) },
      { path: 'campaigns', lazy: page(() => import('@/pages/CampaignPage')) },
    ],
  },
  { path: '*', element: <NotFound /> },
]);
